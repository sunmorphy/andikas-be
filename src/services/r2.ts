import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

export interface R2UploadResult {
    fileId: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    height: number;
    width: number;
    size: number;
    filePath: string;
    tags?: string[] | null;
    isPrivateFile?: boolean | null;
    customCoordinates?: string | null;
}

export const uploadToR2 = async (file: Buffer, fileName: string, username: string, subFolder?: string): Promise<R2UploadResult> => {
    try {
        const sanitizedFileName = sanitizeFileName(fileName);
        const folderPath = subFolder ? `${username}/${subFolder}` : username;
        const filePath = `${folderPath}/${sanitizedFileName}`;
        const bucketName = process.env.R2_BUCKET_NAME!;
        const publicUrl = process.env.R2_PUBLIC_URL!;

        const contentType = getContentType(fileName);

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: filePath,
            Body: file,
            ContentType: contentType,
        });

        await r2Client.send(command);

        const url = `${publicUrl}/${filePath}`;

        return {
            fileId: generateFileId(filePath),
            name: sanitizedFileName,
            url: url,
            thumbnailUrl: url,
            height: 0,
            width: 0,
            size: file.length,
            filePath: filePath,
            tags: null,
            isPrivateFile: false,
            customCoordinates: null,
        };
    } catch (error) {
        throw new Error(`R2 upload failed: ${error}`);
    }
};

export const uploadProfileImageToR2 = async (file: Buffer, fileName: string, username: string): Promise<R2UploadResult> => {
    try {
        const sanitizedFileName = sanitizeFileName(fileName);
        const filePath = `${username}/${sanitizedFileName}`;
        const bucketName = process.env.R2_BUCKET_NAME!;
        const publicUrl = process.env.R2_PUBLIC_URL!;

        const contentType = getContentType(fileName);

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: filePath,
            Body: file,
            ContentType: contentType,
        });

        await r2Client.send(command);

        const url = `${publicUrl}/${filePath}`;

        return {
            fileId: generateFileId(filePath),
            name: sanitizedFileName,
            url: url,
            thumbnailUrl: url,
            height: 0,
            width: 0,
            size: file.length,
            filePath: filePath,
            tags: null,
            isPrivateFile: false,
            customCoordinates: null,
        };
    } catch (error) {
        throw new Error(`Profile image upload failed: ${error}`);
    }
};

function sanitizeFileName(fileName: string): string {
    return fileName
        .replace(/\s+/g, '-')
        .replace(/[^\w\-\.]/g, '')
        .replace(/\-+/g, '-')
        .toLowerCase();
}

function getContentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    const mimeTypes: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'bmp': 'image/bmp',
        'ico': 'image/x-icon',
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'ogg': 'video/ogg',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        'mkv': 'video/x-matroska',
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
}

function generateFileId(filePath: string): string {
    return Buffer.from(filePath).toString('base64');
}
