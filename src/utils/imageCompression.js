import imageCompression from 'browser-image-compression'

/**
 * Compresses an image file to a target size
 * @param {File} imageFile - The original image file
 * @param {number} maxSizeKB - Maximum size in KB (default: 150KB)
 * @returns {Promise<File>} - A promise that resolves to the compressed image file
 */
export async function compressImage(
  imageFile,
  maxSizeKB = 150,
) {
  try {
    // Skip compression for small images that are already under the limit
    if (imageFile.size <= maxSizeKB * 1024) {
      return imageFile
    }

    const options = {
      maxSizeMB: maxSizeKB / 1024, // Convert KB to MB
      maxWidthOrHeight: 1920, // Reasonable size for most uses
      useWebWorker: true, // Use web worker for better performance
      fileType: imageFile.type, // Maintain the original file type
    }

    const compressedFile = await imageCompression(
      imageFile,
      options,
    )

    // Create a new file with the same name but compressed content
    return new File([compressedFile], imageFile.name, {
      type: imageFile.type,
      lastModified: Date.now(),
    })
  } catch (error) {
    console.error('Error compressing image:', error)
    // Return the original file if compression fails
    return imageFile
  }
}

/**
 * Compresses multiple images
 * @param {File[]} imageFiles - Array of image files
 * @param {number} maxSizeKB - Maximum size in KB (default: 150KB)
 * @returns {Promise<File[]>} - A promise that resolves to an array of compressed image files
 */
export async function compressMultipleImages(
  imageFiles,
  maxSizeKB = 150,
) {
  try {
    if (!imageFiles || imageFiles.length === 0) return []

    // Process all files in parallel
    const compressPromises = imageFiles.map((file) =>
      compressImage(file, maxSizeKB),
    )
    return await Promise.all(compressPromises)
  } catch (error) {
    console.error(
      'Error compressing multiple images:',
      error,
    )
    // Return original files if batch compression fails
    return imageFiles
  }
}
