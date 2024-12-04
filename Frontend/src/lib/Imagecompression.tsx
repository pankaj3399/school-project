import imageCompression from 'browser-image-compression';

/**
 * Compresses the image and returns a Base64 string.
 * @param {File} file - The image file to compress.
 * @returns {Promise<string>} - A Base64 string of the compressed image.
 */
export const compressImage = async (file: File): Promise<string | null> => {
  if (!file) return null;

  const options = {
    maxSizeMB: 1, // Adjust max size to 1MB for stricter compression.
    maxWidthOrHeight: 1024, // Resize to a max width/height.
    useWebWorker: true, // Utilize a Web Worker for faster compression.
  };

  try {
    // Compress the file
    const compressedFile = await imageCompression(file, options);

    // Convert to Base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(compressedFile);
    });
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('Image compression failed');
  }
};
