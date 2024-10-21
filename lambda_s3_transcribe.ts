import { S3Event, Context } from 'aws-lambda';
import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand } from '@aws-sdk/client-transcribe';
import { S3 } from '@aws-sdk/client-s3';
import * as AWSLambda from 'aws-lambda';
import * as uuid from 'uuid';
import * as util from 'util';

const SUPPORTED_FORMATS = new Set(['mp3', 'mp4', 'wav', 'flac', 'mov', 'mpg', 'mpeg', 'm4a']);
const MAX_FILE_SIZE_MB = 5000; // Limit size for large file handling (in MB)

// Initialize AWS SDK clients
const transcribeClient = new TranscribeClient({});
const s3 = new S3({});

// Sanitize job name to conform to AWS Transcribe's expected format
const sanitizeJobName = (name: string): string => {
    return name.replace(/[^0-9a-zA-Z._-]/g, '_');
};

// Function to check object size and ensure it's within reasonable limits
const checkObjectSize = async (bucketName: string, objectKey: string): Promise<number> => {
    const objectData = await s3.headObject({ Bucket: bucketName, Key: objectKey });
    const objectSizeBytes = objectData.ContentLength ?? 0;
    return objectSizeBytes / (1024 * 1024); // Convert bytes to MB
};

// Lambda handler function
export const lambdaHandler = async (event: S3Event, context: Context): Promise<AWSLambda.APIGatewayProxyResult> => {
    const records = event.Records || [];

    for (const record of records) {
        const bucketName = record.s3.bucket.name;
        const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        const fileExtension = objectKey.split('.').pop()?.toLowerCase();

        // Check if the file type is supported
        if (fileExtension && SUPPORTED_FORMATS.has(fileExtension)) {
            console.log(`File ${objectKey} is a supported format: ${fileExtension}`);

            // Check object size
            const fileSizeMB = await checkObjectSize(bucketName, objectKey);
            console.log(`File size of ${objectKey} is ${fileSizeMB} MB`);

            if (fileSizeMB > MAX_FILE_SIZE_MB) {
                console.error(`File ${objectKey} exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB} MB.`);
                return {
                    statusCode: 413, // Payload Too Large
                    body: JSON.stringify(`File size exceeds the limit of ${MAX_FILE_SIZE_MB} MB.`),
                };
            }

            const baseJobName = objectKey.split('.')[0];
            const transcriptionJobName = sanitizeJobName(`${baseJobName}_${uuid.v4()}`);
            const mediaFileUrl = `s3://${bucketName}/${objectKey}`;
            const outputBucketName = bucketName;

            try {
                // Submit transcription job
                const command = new StartTranscriptionJobCommand({
                    TranscriptionJobName: transcriptionJobName,
                    Media: { MediaFileUri: mediaFileUrl },
                    MediaFormat: fileExtension,
                    LanguageCode: 'en-US',
                    OutputBucketName: outputBucketName,
                    OutputKey: `transcriptions/${transcriptionJobName}.json`,
                });

                await transcribeClient.send(command);

                console.log(`Transcription job ${transcriptionJobName} started successfully.`);

                // Optionally, return the job name if you plan to track its status asynchronously
                return {
                    statusCode: 200,
                    body: JSON.stringify(`Transcription job ${transcriptionJobName} started successfully.`),
                };
            } catch (error) {
                console.error(`Error starting transcription job: ${util.inspect(error)}`);
                throw new Error(`Error starting transcription job: ${error}`);
            }
        } else {
            console.log(`File ${objectKey} is not a supported format. Skipping transcription.`);
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify('Transcription function executed successfully.'),
    };
};

// Helper function to poll job status (can be moved to another Lambda for scaling)
export const checkTranscriptionStatus = async (transcriptionJobName: string): Promise<string> => {
    const command = new GetTranscriptionJobCommand({ TranscriptionJobName: transcriptionJobName });
    const data = await transcribeClient.send(command);
    const jobStatus = data.TranscriptionJob?.TranscriptionJobStatus;

    if (jobStatus === 'COMPLETED') {
        console.log(`Transcription job ${transcriptionJobName} completed successfully.`);
        return 'COMPLETED';
    } else if (jobStatus === 'FAILED') {
        console.error(`Transcription job ${transcriptionJobName} failed.`);
        throw new Error(`Transcription job ${transcriptionJobName} failed.`);
    } else {
        console.log(`Transcription job ${transcriptionJobName} is still in progress.`);
        return 'IN_PROGRESS';
    }
};
