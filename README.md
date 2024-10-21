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
git clone https://github.com/akther-hussain/aws-s3-lambda-transcribe
cd aws-s3-lambda-transcribe
```

### 2. Install Dependencies
Install the necessary dependencies by running the following command:

```bash
npm install
```

## 3. AWS Lambda Configuration

### Create a Lambda Function:

1. Go to the **AWS Management Console**.
2. Navigate to **Lambda** and create a new Lambda function using the **Node.js runtime**.
   
### Upload the Code:

1. Zip your **TypeScript code** and the `node_modules` folder.
2. Upload the ZIP file to the newly created Lambda function.

### Add Environment Variables (Optional):

1. Optionally configure **environment variables** in the Lambda function.
   - For example, you can set a **size limit** for files.

### Set Timeout and Memory:

1. Increase the **timeout** (e.g., to 15 minutes) based on the expected time needed for transcription jobs.
2. Adjust **memory allocation** between **512MB to 1GB** depending on the expected load and file sizes.

---

## 4. Set Up S3 Bucket and Events

### Create an S3 Bucket:

1. In the **AWS Management Console**, create a new **S3 bucket** where media files will be uploaded.
2. (Optional) Enable **S3 versioning** for safe recovery of files.

### Configure S3 Events:

1. Go to the **S3 bucket properties**.
2. Under **Event Notifications**, create a new event notification for `ObjectCreated` (All types).
3. Select the Lambda function created in the previous step as the **destination** for the event.
4. Optionally, limit the event to certain file formats by specifying **prefixes or suffixes** like `.mp3`, `.wav`, etc.

---

## 5. IAM Role Configuration

Ensure that the Lambda function’s **execution role** has the following permissions:

### S3 Access:
- The role must have permissions to **read and write** to the S3 bucket.

### AWS Transcribe Permissions:
- The role must be able to use AWS Transcribe services to start and monitor transcription jobs.

### CloudWatch Logs:
- Ensure the role has permissions to log data into **CloudWatch Logs** to track any issues or errors.

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

## Troubleshooting
Permission Errors: Check that the Lambda's IAM role has sufficient permissions for S3 and AWS Transcribe.
File Size Limits: Ensure that the uploaded file is within the size limits configured for Lambda and AWS Transcribe.
Transcription Failures: Use CloudWatch Logs to investigate job failures and other issues.


## Conclusion
This project automates media file transcription using AWS Lambda, S3, and Transcribe, offering a scalable, event-driven solution. With built-in error handling, file size checks, and asynchronous processing, the system is designed to handle various file formats and large files robustly.

Feel free to extend the project by integrating with services like Step Functions, SNS, or SQS to further enhance scalability and notification capabilities.