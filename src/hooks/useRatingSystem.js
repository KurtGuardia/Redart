'use client'

import { useState, useCallback } from 'react'
import {
  doc,
  runTransaction,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase-client'

/**
 * Custom hook to manage rating submissions and deletions for both venues and events
 *
 * @param {Object} options - Configuration options
 * @param {string} options.targetId - ID of the target (venue ID or event ID)
 * @param {string} options.targetType - Type of target ('venue' or 'event')
 * @param {string} options.targetName - Name of the target (venue name or event title)
 * @param {Object|null} options.user - Current user object (from useAuth)
 * @param {Function} options.onUpdateTarget - Callback to update local target state (venue/event)
 *
 * @returns {Object} Rating state and functions
 */
export default function useRatingSystem({
  targetId,
  targetType,
  targetName,
  user,
  onUpdateTarget,
}) {
  // Rating states
  const [userRating, setUserRating] = useState(0)
  const [isSubmittingRating, setIsSubmittingRating] =
    useState(false)
  const [isDeletingRating, setIsDeletingRating] =
    useState(false)
  const [ratingError, setRatingError] = useState(null)
  const [ratingSuccess, setRatingSuccess] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  // Get the proper collection name based on target type
  const getCollectionName = () => {
    return targetType === 'venue' ? 'venues' : 'events'
  }

  /**
   * Updates the user's rating for a target (venue or event)
   * @param {number} newRating - The new rating value (1-5)
   */
  const handleRatingSubmit = async (newRating) => {
    if (!user) {
      setRatingError('Debes iniciar sesión para puntuar.')
      setTimeout(() => setRatingError(null), 5000)
      return
    }

    if (!targetId) {
      setRatingError(
        `Datos del ${
          targetType === 'venue' ? 'local' : 'evento'
        } no cargados.`,
      )
      setTimeout(() => setRatingError(null), 5000)
      return
    }

    setIsSubmittingRating(true)
    setRatingError(null)
    setRatingSuccess(false)

    const targetRef = doc(db, getCollectionName(), targetId)
    const userRef = doc(db, 'users', user.uid)
    const ratingTimestamp = Timestamp.now()

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Get latest data
        const targetDoc = await transaction.get(targetRef)
        if (!targetDoc.exists()) {
          throw new Error(
            `El ${
              targetType === 'venue' ? 'local' : 'evento'
            } ya no existe.`,
          )
        }
        const currentTargetData = targetDoc.data()
        let currentTargetRatings = Array.isArray(
          currentTargetData.ratings,
        )
          ? currentTargetData.ratings
          : []

        const userDoc = await transaction.get(userRef)
        if (!userDoc.exists()) {
          throw new Error('Usuario no encontrado.')
        }
        const currentUserData = userDoc.data()
        let currentUserRatings = Array.isArray(
          currentUserData.ratings,
        )
          ? currentUserData.ratings
          : []

        // 2. Update ratings on both documents

        // Target document: Remove old rating if exists, add new one
        const updatedTargetRatings =
          currentTargetRatings.filter(
            (r) => r.userId !== user.uid,
          )
        updatedTargetRatings.push({
          userId: user.uid,
          score: newRating,
          updatedAt: ratingTimestamp,
        })

        // User document: Remove old rating if exists, add new one
        const updatedUserRatings =
          currentUserRatings.filter(
            (r) => r.targetId !== targetId,
          )
        updatedUserRatings.push({
          targetId: targetId,
          name:
            targetName ||
            `${
              targetType === 'venue' ? 'Local' : 'Evento'
            } sin nombre`,
          type: targetType,
          score: newRating,
          updatedAt: ratingTimestamp,
        })

        // 3. Update both documents in the transaction
        transaction.update(targetRef, {
          ratings: updatedTargetRatings,
        })
        transaction.update(userRef, {
          ratings: updatedUserRatings,
        })
      })

      // 4. Update UI state
      setUserRating(newRating)
      setRatingSuccess(true)

      // 5. Update parent component state via callback
      if (typeof onUpdateTarget === 'function') {
        onUpdateTarget((prevTarget) => {
          if (!prevTarget) return null

          // Create a new ratings array with the user's new rating
          const existingRatings = prevTarget.ratings || []
          const updatedRatings = existingRatings.filter(
            (r) => r.userId !== user.uid,
          )
          updatedRatings.push({
            userId: user.uid,
            score: newRating,
            updatedAt: ratingTimestamp.toDate(),
          })

          return { ...prevTarget, ratings: updatedRatings }
        })
      }

      setTimeout(() => setRatingSuccess(false), 3000)
    } catch (error) {
      console.error(
        `Error submitting rating transaction:`,
        error,
      )
      setRatingError(
        error.message || 'Error al enviar la puntuación.',
      )
      setTimeout(() => setRatingError(null), 5000)
    } finally {
      setIsSubmittingRating(false)
    }
  }

  /**
   * Deletes the user's rating for a target (venue or event)
   */
  const handleDeleteRating = async () => {
    console.log('[handleDeleteRating] Initiated for:', {
      targetId,
      targetType,
      userId: user?.uid,
    })
    if (!user) {
      setRatingError(
        'Debes iniciar sesión para eliminar tu puntuación.',
      )
      setTimeout(() => setRatingError(null), 5000)
      return
    }

    // Note: targetId check might be redundant if called from RatedListItem where item.targetId exists, but good safeguard.
    if (!targetId) {
      setRatingError(
        `Datos del ${
          targetType === 'venue' ? 'local' : 'evento'
        } no cargados.`,
      )
      setTimeout(() => setRatingError(null), 5000)
      return
    }

    console.log(
      '[handleDeleteRating] Proceeding with deletion...',
    )
    setIsDeletingRating(true)
    setRatingError(null)
    setDeleteSuccess(false)

    const targetRef = doc(db, getCollectionName(), targetId)
    const userRef = doc(db, 'users', user.uid)

    try {
      await runTransaction(db, async (transaction) => {
        console.log(
          '[handleDeleteRating] Transaction started. Refs:',
          {
            targetRef: targetRef.path,
            userRef: userRef.path,
          },
        )
        // 1. Get latest data
        const targetDoc = await transaction.get(targetRef)
        console.log(
          '[handleDeleteRating] Fetched targetDoc. Exists:',
          targetDoc.exists(),
        )
        if (!targetDoc.exists()) {
          console.warn(
            `[handleDeleteRating] Target document ${targetRef.path} not found. Proceeding to remove rating from user only.`,
          )
          // If target doesn't exist, we can't update its ratings, but we still need to update the user's ratings.
          // Initialize target-related variables safely.
          // No need to initialize currentTargetRatings here, it's handled later.
        }
        const userDoc = await transaction.get(userRef)
        console.log(
          '[handleDeleteRating] Fetched userDoc. Exists:',
          userDoc.exists(),
        )
        if (!userDoc.exists()) {
          throw new Error('Usuario no encontrado.')
        }
        const currentUserData = userDoc.data()
        let currentUserRatings = Array.isArray(
          currentUserData.ratings,
        )
          ? currentUserData.ratings
          : []

        // 2. Remove ratings from both documents
        let updatedTargetRatings = []
        if (targetDoc.exists()) {
          const currentTargetData = targetDoc.data()
          let currentTargetRatings = Array.isArray(
            currentTargetData.ratings,
          )
            ? currentTargetData.ratings
            : []
          console.log(
            '[handleDeleteRating] Current target ratings:',
            currentTargetRatings,
          )
          updatedTargetRatings =
            currentTargetRatings.filter(
              (r) => r.userId !== user.uid,
            )
        }
        console.log(
          '[handleDeleteRating] Updated target ratings:',
          updatedTargetRatings,
        )

        console.log(
          '[handleDeleteRating] Current user ratings:',
          currentUserRatings,
        )
        const updatedUserRatings =
          currentUserRatings.filter(
            (r) => r.targetId !== targetId,
          )
        console.log(
          '[handleDeleteRating] Updated user ratings:',
          updatedUserRatings,
        )

        // 3. Update both documents in the transaction
        // Only update target if it exists
        if (targetDoc.exists()) {
          console.log(
            '[handleDeleteRating] Updating target document...',
          )
          transaction.update(targetRef, {
            ratings: updatedTargetRatings,
          })
        }

        console.log(
          '[handleDeleteRating] Updating user document...',
        )
        transaction.update(userRef, {
          ratings: updatedUserRatings,
        })
      })

      // 4. Update UI state
      setUserRating(0)
      console.log(
        '[handleDeleteRating] Transaction successful. Setting deleteSuccess.',
      )
      setDeleteSuccess(true)

      // 5. Update parent component state via callback
      if (typeof onUpdateTarget === 'function') {
        onUpdateTarget((prevTarget) => {
          if (!prevTarget) return null
          return {
            ...prevTarget,
            ratings: (prevTarget.ratings || []).filter(
              (r) => r.userId !== user.uid,
            ),
          }
        })
      }

      setTimeout(() => setDeleteSuccess(false), 3000)
    } catch (error) {
      console.error(
        '[handleDeleteRating] Error during transaction:',
        error,
      ) // Log the full error
      setRatingError(
        error.message || 'Error al eliminar la puntuación.',
      )
      setTimeout(() => setRatingError(null), 5000)
    } finally {
      setIsDeletingRating(false)
    }
  }

  /**
   * Updates the userRating state when the target's ratings or user changes
   * This should be called in a useEffect in the parent component
   */
  const updateUserRating = useCallback(
    (targetData) => {
      if (targetData?.ratings && user?.uid) {
        const existingRating = targetData.ratings.find(
          (r) => r.userId === user.uid,
        )
        setUserRating(
          existingRating ? existingRating.score : 0,
        )
      } else {
        setUserRating(0)
      }
    },
    [user?.uid],
  ) // Dependency: user.uid ensures it only changes if the user changes

  // Return all necessary state and functions
  return {
    // State
    userRating,
    isSubmittingRating,
    isDeletingRating,
    ratingError,
    ratingSuccess,
    deleteSuccess,

    // Methods
    handleRatingSubmit,
    handleDeleteRating,
    updateUserRating,

    // Setters (for direct state manipulation if needed)
    setRatingError,
  }
}
