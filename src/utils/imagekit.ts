import ImageKit from 'imagekit';

let imagekitInstance: ImageKit | null = null;

export function getImageKit(): ImageKit {
    if (!imagekitInstance) {
        const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
        const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

        if (!publicKey || !privateKey || !urlEndpoint) {
            throw new Error('ImageKit credentials are not configured.');
        }

        imagekitInstance = new ImageKit({
            publicKey,
            privateKey,
            urlEndpoint,
        });
    }

    return imagekitInstance;
}
