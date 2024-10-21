# AWS S3 Lambda Transcription Service

This repository contains a robust AWS Lambda function written in TypeScript that automates transcription for media files uploaded to an Amazon S3 bucket. It uses AWS Transcribe to convert supported media formats (such as `mp3`, `mp4`, `wav`, `flac`, etc.) into text, with the transcription results stored back in the same S3 bucket.

## Purpose

The goal of this project is to automatically generate transcriptions for media files uploaded to an S3 bucket. The Lambda function is triggered by S3 events whenever a new file is uploaded. It initiates an AWS Transcribe job for supported media formats, and the transcription result is saved in the `transcriptions/` folder in the same S3 bucket.

## Features and Enhancements

### Supported File Formats
- Supports media formats: `mp3`, `mp4`, `wav`, `flac`, `mov`, `mpg`, `mpeg`, `m4a`.

### File Size Handling
- Checks the size of each uploaded file. Files exceeding a specified limit (default is 5000 MB) are rejected to prevent overloading.
- Returns a `413 (Payload Too Large)` status if the file exceeds the allowed size.

### Scalability for Large File Processing
- Submits transcription jobs to AWS Transcribe asynchronously. 
- Status polling of transcription jobs can be handled separately, e.g., with AWS Step Functions or another Lambda function.

### Error Handling and Logging
- Logs details of each transcription job submission, file format validation, and any errors encountered during the transcription process.
- Provides detailed error messages in AWS CloudWatch.

### Job Polling
- A helper function (`checkTranscriptionStatus`) is provided to check the status of long-running transcription jobs asynchronously.

### Event-Driven Execution
- The Lambda function is triggered automatically by S3 events when new files are uploaded.

### Scalable Architecture
- Supports scalability by allowing heavy processing tasks to be decoupled from the main job submission workflow. Step Functions, CloudWatch, or SQS can be used for status polling and scaling.

## Prerequisites

- **AWS Account**: You need an active AWS account to deploy the Lambda function, configure S3, and use AWS Transcribe.
- **Node.js**: Ensure Node.js is installed in your environment for local development.

## Setup and Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/aws-s3-lambda-transcription-service.git
cd aws-s3-lambda-transcription-service
```

### 2. Install Dependencies
Install the necessary dependencies by running the following command:

```bash
Copy code
npm install
```
### 3. AWS Lambda Configuration
Create a Lambda Function:

Go to the AWS Management Console, navigate to Lambda, and create a new Lambda function using the Node.js runtime.
Upload the Code:

Zip the TypeScript code and node modules, then upload the zip file to the Lambda function.
Add Environment Variables (Optional):

Configure environment variables if needed (e.g., for file size limits).
Set the Timeout and Memory:

Adjust timeout (e.g., to 15 minutes) and memory settings (512MB to 1GB recommended) based on your expected workload.

### 4. Set Up S3 Bucket and Events
Create an S3 Bucket:

In the AWS Management Console, create an S3 bucket where media files will be uploaded.
Configure S3 Events:

Go to the S3 bucket properties and create a new event notification for ObjectCreated (All types).
Select the Lambda function as the destination for the event.
### 5. IAM Role Configuration
Ensure your Lambda function's execution role has the following permissions:

S3 Access: For reading and writing to the S3 bucket.
Transcribe Permissions: To start transcription jobs and fetch job statuses.
CloudWatch Logs: For logging into CloudWatch.
Example IAM policy:

```bash
{
   "Version": "2012-10-17",
   "Statement": [
      {
         "Effect": "Allow",
         "Action": [
            "s3:GetObject",
            "s3:PutObject",
            "s3:ListBucket"
         ],
         "Resource": [
            "arn:aws:s3:::your-bucket-name",
            "arn:aws:s3:::your-bucket-name/*"
         ]
      },
      {
         "Effect": "Allow",
         "Action": [
            "transcribe:StartTranscriptionJob",
            "transcribe:GetTranscriptionJob",
            "transcribe:ListTranscriptionJobs"
         ],
         "Resource": "*"
      },
      {
         "Effect": "Allow",
         "Action": "logs:*",
         "Resource": "*"
      }
   ]
}
```

### 6. Deploy and Test
Upload Media: Upload a media file (e.g., .mp3, .wav) to the S3 bucket.
Monitor Logs: Check CloudWatch Logs for Lambda execution and transcription job logs.
Check Transcriptions: The transcription results will be saved in the transcriptions/ folder of the S3 bucket.

### 7. Optional Scaling with AWS Step Functions
For long-running transcription jobs, consider using AWS Step Functions to decouple the job submission from job status polling.

Troubleshooting
Permission Errors: Check that the Lambda's IAM role has sufficient permissions for S3 and AWS Transcribe.
File Size Limits: Ensure that the uploaded file is within the size limits configured for Lambda and AWS Transcribe.
Transcription Failures: Use CloudWatch Logs to investigate job failures and other issues.


## Conclusion
This project automates media file transcription using AWS Lambda, S3, and Transcribe, offering a scalable, event-driven solution. With built-in error handling, file size checks, and asynchronous processing, the system is designed to handle various file formats and large files robustly.

Feel free to extend the project by integrating with services like Step Functions, SNS, or SQS to further enhance scalability and notification capabilities.