import { useState, useCallback } from 'react'
import { updateVenueDetails as updateVenueDetailsService } from '../lib/firebaseService'
import {
  validateFacebookUrl,
  validateInstagramUrl,
  validateWhatsappNumber,
} from '../lib/utils' // Import validation utils

export const useVenueActions = (
  venueId,
  currentVenueData,
  onUpdateSuccess,
) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // Success state might be handled by the onUpdateSuccess callback or a local state here
  // const [success, setSuccess] = useState(false);

  const updateVenue = useCallback(
    async (updatedDataFromModal) => {
      if (!venueId || !currentVenueData) {
        console.error(
          'useVenueActions: Missing venueId or currentVenueData.',
        )
        setError(
          'Error: Datos incompletos para actualizar el local.',
        )
        return false
      }

      setLoading(true)
      setError(null)
      // setSuccess(false);

      try {
        // --- Validation ---
        if (
          updatedDataFromModal.facebookUrl &&
          !validateFacebookUrl(
            updatedDataFromModal.facebookUrl,
          )
        ) {
          throw new Error(
            'La URL de Facebook proporcionada no parece válida.',
          )
        }
        if (
          updatedDataFromModal.instagramUrl &&
          !validateInstagramUrl(
            updatedDataFromModal.instagramUrl,
          )
        ) {
          throw new Error(
            'La URL de Instagram proporcionada no parece válida.',
          )
        }
        if (
          updatedDataFromModal.whatsappNumber &&
          !validateWhatsappNumber(
            updatedDataFromModal.whatsappNumber,
          )
        ) {
          throw new Error(
            'El número de WhatsApp debe empezar con + y el código de país.',
          )
        }

        // --- Call Service ---
        // The service handles the actual update, including file uploads/deletions and sync
        await updateVenueDetailsService(
          venueId,
          updatedDataFromModal,
          currentVenueData,
        )

        // --- Trigger Success Callback --- (e.g., to refresh data via useVenueData)
        if (
          onUpdateSuccess &&
          typeof onUpdateSuccess === 'function'
        ) {
          onUpdateSuccess()
        }
        // setSuccess(true); // Optionally set local success state
        return true // Indicate success
      } catch (err) {
        console.error(
          'useVenueActions - Error updating venue:',
          err,
        )
        setError(
          err.message || 'Error al actualizar el local.',
        )
        // setSuccess(false);
        return false // Indicate failure
      } finally {
        setLoading(false)
      }
    },
    [venueId, currentVenueData, onUpdateSuccess],
  ) // Dependencies for the callback

  return {
    updateVenue,
    loading, // Loading state specific to venue actions
    error, // Error state specific to venue actions
    // success, // Optionally expose success state
  }
}
