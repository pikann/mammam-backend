import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

export default async () => {
  const client = new S3Client({ region: process.env.AWS_S3_REGION });
  const command = new GetObjectCommand({
    Bucket: 'mammam-photo-video-bucket-dev',
    Key: `test-object-${Math.ceil(Math.random() * 10 ** 10)}`,
  });
  const url = await getSignedUrl(client, command, { expiresIn: 3600 });
  return url;
};
