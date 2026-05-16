'use strict';

const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const BUCKET = process.env.AWS_BUCKET_NAME || 'teamify-uploads';

const uploadFile = async (file, folder = 'uploads') => {
  const ext = file.originalname.split('.').pop();
  const key = `${folder}/${uuidv4()}.${ext}`;
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  }));
  return {
    key,
    url: `https://${BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
  };
};

const getDownloadUrl = async (key, expiresIn = 3600) => {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
};

const deleteFile = async (key) => {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
};

module.exports = { uploadFile, getDownloadUrl, deleteFile };
