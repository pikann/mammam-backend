import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

export default async () => {
  const bucketName = 'mammam-photo-video-bucket-dev';
  const client = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    },
  });
  const fileName = uuidv4();
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  });
  const presignedUrl = await getSignedUrl(client, command, { expiresIn: 100 });
  return {
    presignedUrl,
    imageUrl: `https://${bucketName}.s3.ap-southeast-1.amazonaws.com/${fileName}`,
  };
};
