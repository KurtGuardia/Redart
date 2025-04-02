import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Timestamp } from 'firebase/firestore'
import { CATEGORIES } from './constants' // Import categories for label lookup
import imageCompression from 'browser-image-compression' // For image compression

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a currency code (e.g., USD, BOB) to its symbol (e.g., $, Bs).
 * @param {string} currencyCode - The currency code.
 * @returns {string} The currency symbol or the code itself if not found.
 */
export const getCurrencySymbol = (currencyCode) => {
  switch (
    currencyCode?.toUpperCase() // Added toUpperCase for safety
  ) {
    case 'USD':
      return '$'
    case 'EUR':
      return '€'
    case 'GBP':
      return '£'
    case 'BOB':
      return 'Bs'
    case 'BRL':
      return 'R$'
    case 'ARS':
      return '$'
    case 'CLP':
      return '$'
    case 'COP':
      return '$'
    case 'MXN':
      return '$'
    case 'PEN':
      return 'S/'
    case 'UYU':
      return '$U'
    case 'PYG':
      return '₲'
    default:
      return currencyCode || 'Bs'
  }
}

/**
 * Formats a Firestore Timestamp or Date object into a localized string.
 * @param {Timestamp|Date|object} timestamp - The timestamp or date object {seconds, nanoseconds} to format.
 * @param {object} options - Intl.DateTimeFormat options (optional). Defaults to long date, short time.
 * @returns {string} Formatted date/time string or fallback text.
 */
export const formatTimestamp = (
  timestamp,
  options = {},
) => {
  if (!timestamp) return 'Fecha no disponible'

  let date
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate()
  } else if (timestamp instanceof Date) {
    date = timestamp
  } else if (
    timestamp.seconds &&
    typeof timestamp.seconds === 'number'
  ) {
    date = new Date(timestamp.seconds * 1000)
  } else {
    return 'Fecha inválida'
  }

  const defaultOptions = {
    dateStyle: 'long',
    timeStyle: 'short',
    ...options, // Allow overriding defaults
  }

  try {
    return new Intl.DateTimeFormat(
      'es-ES',
      defaultOptions,
    ).format(date)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Fecha inválida'
  }
}

/**
 * Validates if a string is a potentially valid URL.
 * @param {string} string - The string to validate.
 * @returns {boolean} True if the string looks like a URL, false otherwise.
 */
export const isValidUrl = (string) => {
  if (!string) return false
  try {
    // Basic check, doesn't guarantee reachability
    const url = new URL(string)
    // Optionally add protocol check if needed: return ['http:', 'https:'].includes(url.protocol);
    return true
  } catch (_) {
    return false
  }
}

/**
 * Gets the Spanish label for a given category value.
 * @param {string} categoryValue - The category value (e.g., 'music').
 * @returns {string} The Spanish label or the original value if not found.
 */
export const getCategoryLabel = (categoryValue) => {
  const category = CATEGORIES.find(
    (c) => c.value === categoryValue,
  )
  return category?.label || categoryValue || 'Sin categoría'
}

// --- Image Compression Functions ---

/**
 * Compresses an image file to a target size.
 * @param {File} imageFile - The original image file.
 * @param {number} maxSizeKB - Maximum size in KB (default: 150KB).
 * @returns {Promise<File>} - A promise that resolves to the compressed image file or original if fails/small enough.
 */
export async function compressImage(
  imageFile,
  maxSizeKB = 150,
) {
  if (!(imageFile instanceof File)) {
    console.error(
      'compressImage: Expected a File object, received:',
      imageFile,
    )
    return imageFile // Return input if not a file
  }

  try {
    // Skip compression for small images
    if (imageFile.size <= maxSizeKB * 1024) {
      return imageFile
    }

    const options = {
      maxSizeMB: maxSizeKB / 1024,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: imageFile.type,
    }

    // Removed console.log for compression start/end
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
    console.error(
      `Error compressing image ${imageFile.name}:`,
      error,
    )
    return imageFile // Return original on error
  }
}

/**
 * Compresses multiple images.
 * @param {File[]} imageFiles - Array of image files.
 * @param {number} maxSizeKB - Maximum size in KB (default: 150KB).
 * @returns {Promise<File[]>} - A promise that resolves to an array of compressed/original image files.
 */
export async function compressMultipleImages(
  imageFiles,
  maxSizeKB = 150,
) {
  if (!Array.isArray(imageFiles)) {
    console.error(
      'compressMultipleImages: Expected an array of File objects.',
    )
    return imageFiles // Return input if not an array
  }

  const validImageFiles = imageFiles.filter(
    (file) => file instanceof File,
  )
  if (validImageFiles.length === 0) return [] // Return empty if no valid files

  try {
    const compressPromises = validImageFiles.map((file) =>
      compressImage(file, maxSizeKB),
    )
    return await Promise.all(compressPromises)
  } catch (error) {
    console.error(
      'Error compressing multiple images:',
      error,
    )
    return validImageFiles // Return original valid files on error
  }
}
