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
 * Formats a Firestore Timestamp, Date object, or ISO date string into a localized string.
 * Handles potential null/undefined/invalid inputs.
 */
export function formatTimestamp(timestampInput, options) {
  // Default options if none provided
  const defaultOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
  }
  const formatOptions = { ...defaultOptions, ...options }

  // 1. Handle null or undefined input gracefully
  if (!timestampInput) {
    // console.warn('formatTimestamp received null or undefined input.');
    return 'Fecha no disponible' // Or return empty string, based on preference
  }

  let dateObj

  try {
    // 2. Convert input to Date object
    if (timestampInput.toDate) {
      // Check if it's a Firestore Timestamp
      dateObj = timestampInput.toDate()
    } else {
      // Assume it's a Date object or ISO string
      dateObj = new Date(timestampInput)
    }

    // 3. Validate the created Date object
    if (isNaN(dateObj.getTime())) {
      // getTime() returns NaN for invalid dates
      console.warn(
        'formatTimestamp resulted in an invalid date for input:',
        timestampInput,
      )
      return 'Fecha inválida'
    }

    // 4. Format the valid Date object
    return new Intl.DateTimeFormat(
      'es-ES',
      formatOptions,
    ).format(dateObj)
  } catch (error) {
    console.error(
      'Error formatting timestamp:',
      error,
      'Input:',
      timestampInput,
    )
    return 'Error de fecha' // Return a generic error message
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

// --- Validation Functions ---

/**
 * Basic validation for a Facebook URL.
 * Checks if the string includes "facebook.com".
 * @param {string} url The URL string to validate.
 * @returns {boolean} True if it seems like a Facebook URL, false otherwise.
 */
export const validateFacebookUrl = (url) => {
  if (!url || typeof url !== 'string') return true // Allow empty or non-string values (treat as optional)
  return url.toLowerCase().includes('facebook.com')
}

/**
 * Basic validation for an Instagram URL.
 * Checks if the string includes "instagram.com".
 * @param {string} url The URL string to validate.
 * @returns {boolean} True if it seems like an Instagram URL, false otherwise.
 */
export const validateInstagramUrl = (url) => {
  if (!url || typeof url !== 'string') return true // Allow empty
  return url.toLowerCase().includes('instagram.com')
}

/**
 * Basic validation for a WhatsApp number.
 * Checks if the string starts with a '+' sign.
 * @param {string} number The number string to validate.
 * @returns {boolean} True if it seems like a valid format, false otherwise.
 */
export const validateWhatsappNumber = (number) => {
  if (!number || typeof number !== 'string') return true // Allow empty
  // Simple check for starting with '+'
  return number.startsWith('+')
}

/**
 * Formats a WhatsApp number string for better readability.
 * Tries to separate country code and add spacing.
 * Example: +34123456789 -> +34 123 456 789
 * @param {string} number The raw WhatsApp number string (e.g., +34123456789).
 * @returns {string} The formatted number string or the original if formatting fails.
 */
export const formatWhatsappNumber = (number) => {
  if (
    !number ||
    typeof number !== 'string' ||
    !number.startsWith('+')
  ) {
    return number // Return original if not a valid starting format
  }

  const digits = number.substring(1)
  let countryCode = ''
  let restOfNumber = ''

  // List of common country codes (can be expanded)
  const common2DigitCodes = [
    '31',
    '32',
    '33',
    '34',
    '36',
    '39',
    '40',
    '41',
    '43',
    '44',
    '45',
    '46',
    '47',
    '48',
    '49',
    '51',
    '52',
    '53',
    '54',
    '55',
    '56',
    '57',
    '58',
    '60',
    '61',
    '62',
    '63',
    '64',
    '65',
    '66',
    '81',
    '82',
    '84',
    '86',
    '90',
    '91',
    '92',
    '93',
    '94',
    '95',
    '98',
  ]
  const common3DigitCodes = [
    '211',
    '212',
    '213',
    '216',
    '218',
    '220',
    '221',
    '222',
    '223',
    '224',
    '225',
    '226',
    '227',
    '228',
    '229',
    '230',
    '231',
    '232',
    '233',
    '234',
    '235',
    '236',
    '237',
    '238',
    '239',
    '240',
    '241',
    '242',
    '243',
    '244',
    '245',
    '246',
    '247',
    '248',
    '249',
    '250',
    '251',
    '252',
    '253',
    '254',
    '255',
    '256',
    '257',
    '258',
    '260',
    '261',
    '262',
    '263',
    '264',
    '265',
    '266',
    '267',
    '268',
    '269',
    '290',
    '291',
    '297',
    '298',
    '299',
    '350',
    '351',
    '352',
    '353',
    '354',
    '355',
    '356',
    '357',
    '358',
    '359',
    '370',
    '371',
    '372',
    '373',
    '374',
    '375',
    '376',
    '377',
    '378',
    '379',
    '380',
    '381',
    '382',
    '385',
    '386',
    '387',
    '389',
    '420',
    '421',
    '423',
    '500',
    '501',
    '502',
    '503',
    '504',
    '505',
    '506',
    '507',
    '508',
    '509',
    '590',
    '591',
    '592',
    '593',
    '594',
    '595',
    '596',
    '597',
    '598',
    '599',
    '670',
    '671',
    '672',
    '673',
    '674',
    '675',
    '676',
    '677',
    '678',
    '679',
    '680',
    '681',
    '682',
    '683',
    '685',
    '686',
    '687',
    '688',
    '689',
    '690',
    '691',
    '692',
    '850',
    '852',
    '853',
    '855',
    '856',
    '880',
    '886',
    '960',
    '961',
    '962',
    '963',
    '964',
    '965',
    '966',
    '967',
    '968',
    '970',
    '971',
    '972',
    '973',
    '974',
    '975',
    '976',
    '977',
    '992',
    '993',
    '994',
    '995',
    '996',
    '998',
  ]

  // Prioritize known single-digit codes (+1, +7) usually with 10 digits following
  if (
    (digits.startsWith('1') || digits.startsWith('7')) &&
    digits.length === 11
  ) {
    countryCode = digits.substring(0, 1)
    restOfNumber = digits.substring(1)
    // Check for known 3-digit codes (needs sufficient remaining digits)
  } else if (
    digits.length >= 10 &&
    common3DigitCodes.includes(digits.substring(0, 3))
  ) {
    countryCode = digits.substring(0, 3)
    restOfNumber = digits.substring(3)
    // Check for known 2-digit codes (needs sufficient remaining digits)
  } else if (
    digits.length >= 9 &&
    common2DigitCodes.includes(digits.substring(0, 2))
  ) {
    countryCode = digits.substring(0, 2)
    restOfNumber = digits.substring(2)
    // Fallback for other 2-digit codes if length is typical
  } else if (
    digits.length === 10 ||
    digits.length === 11 ||
    digits.length === 12
  ) {
    countryCode = digits.substring(0, 2)
    restOfNumber = digits.substring(2)
    // Fallback for other 3-digit codes if length is typical
  } else if (digits.length === 11 || digits.length === 12) {
    countryCode = digits.substring(0, 3)
    restOfNumber = digits.substring(3)
  } else {
    // Cannot reliably determine format, return original
    return number
  }

  // Add spaces to the rest of the number (e.g., every 3 digits)
  const spacedRest = restOfNumber.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ' ',
  )

  return `+${countryCode} ${spacedRest}`
}

/**
 * Checks if the given event date/timestamp is in the past.
 * @param {Timestamp|Date|object|string} dateInput - The timestamp, date object {seconds, nanoseconds}, or date string to check.
 * @returns {boolean} True if the date is in the past, false otherwise or if date is invalid.
 */
export const hasEventPassed = (dateInput) => {
  if (!dateInput) {
    return false // Cannot determine if no date is provided
  }

  let eventDate

  // Convert Firestore Timestamp or Date object
  if (dateInput && typeof dateInput.toDate === 'function') {
    eventDate = dateInput.toDate()
  } else if (dateInput instanceof Date) {
    eventDate = dateInput
  } else {
    // Try parsing if it's a string or other type
    try {
      eventDate = new Date(dateInput)
      if (isNaN(eventDate.getTime())) {
        // Invalid date
        console.warn(
          'hasEventPassed: Received invalid date input:',
          dateInput,
        )
        return false
      }
    } catch (e) {
      console.warn(
        'hasEventPassed: Error parsing date input:',
        dateInput,
        e,
      )
      return false // Error parsing date
    }
  }

  const now = new Date()
  return eventDate < now // Return true if the event date is before now
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
