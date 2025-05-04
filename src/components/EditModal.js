'use client'

import { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import { GeoPoint } from 'firebase/firestore'
import { useAddressSearch } from '../hooks/useAddressSearch'
import {
  compressImage,
  compressMultipleImages,
} from '../lib/utils'

// Import MapComponent dynamically to avoid SSR issues
const MapComponent = dynamic(
  () => import('./map/MapComponent'),
  {
    ssr: false,
  },
)

/**
 * A reusable modal component for editing data
 * @param {Object} props Component props
 * @param {boolean} props.isOpen Whether the modal is open
 * @param {function} props.onClose Function to call when modal is closed
 * @param {string} props.title Modal title
 * @param {Object} props.data The data to edit
 * @param {function} props.onSave Function to call when save button is clicked, receives updated data
 * @param {Object} props.fields Configuration for form fields to display
 * @param {string} props.saveButtonText Custom text for the save button
 */

const EditModal = ({
  isOpen,
  onClose,
  title,
  data,
  onSave,
  fields,
  saveButtonText = 'Guardar Cambios',
}) => {
  // Inside the EditModal component function
  const [formData, setFormData] = useState({})
  const [currentMapLocation, setCurrentMapLocation] =
    useState(null)
  const [isMounted, setIsMounted] = useState(false)

  // Generate a unique map ID for each modal instance
  const mapId = useMemo(
    () =>
      `map-${Math.random().toString(36).substring(2, 9)}`,
    [],
  )

  const {
    searchQuery,
    setSearchQuery, // Get setter to potentially clear it
    handleInputChange,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    handleSuggestionClick,
    handleSearchClick, // Might not need the explicit search button
    isSearching,
    searchError,
    searchResult, // This is the result object { lat, lng, address, ... } after selection
  } = useAddressSearch(
    formData?.address || '', // Initial query from form data
    formData?.city || '', // Initial city context from form data
    (result) => {
      // --- Callback when a suggestion is clicked ---
      console.log('Address search result selected:', result)
      const newLocation = {
        lat: result.lat,
        lng: result.lng,
      }
      setCurrentMapLocation(newLocation) // Update the map's target location

      //  update form fields based on search result
      setFormData((prev) => ({
        ...prev,
        // Update address/city only if they seem more specific or missing
        address: result.address || prev.address || '',
        city: result.city || prev.city || '',
        // DO NOT update formData.location here directly. Let save handle it.
      }))
      // clear search query after selection
      setSearchQuery(result.address || '') // Or clear completely: setSearchQuery('');
      setShowSuggestions(false) // Hide suggestions after selection
    },
  )

  // Modify the useEffect for initial data
  useEffect(() => {
    if (data && isOpen) {
      // Also check isOpen to reset when reopened
      setFormData(data) // Set the main form data

      // Initialize currentMapLocation from data.location (expecting GeoPoint or old format)
      let initialLat = null
      let initialLng = null

      if (data.location) {
        if (
          data.location.latitude != null &&
          data.location.longitude != null
        ) {
          // It's likely a GeoPoint
          initialLat = data.location.latitude
          initialLng = data.location.longitude
        } else if (
          data.location.lat != null &&
          data.location.lng != null
        ) {
          // It might be the old { lat, lng } format
          initialLat = data.location.lat
          initialLng = data.location.lng
        }

        if (initialLat !== null && initialLng !== null) {
          setCurrentMapLocation({
            lat: initialLat,
            lng: initialLng,
          })
        } else {
          setCurrentMapLocation(null) // No valid initial location
        }
      } else {
        setCurrentMapLocation(null) // No location in data
      }
    } else if (!isOpen) {
      // Optionally reset state when modal closes
      setFormData({})
      setCurrentMapLocation(null)
    }
  }, [data, isOpen]) // Depend on data and isOpen

  // Client-side only rendering for the portal
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Add a useEffect to clean up any map instances when the modal closes
  useEffect(() => {
    return () => {
      // Find any leaflet-related elements and remove them
      const mapContainer = document.getElementById(mapId)
      if (mapContainer) {
        // Reset the container content to ensure it's clean for next use
        mapContainer.innerHTML = ''
        // Remove any Leaflet-added classes
        mapContainer.className = mapContainer.className
          .split(' ')
          .filter((cls) => !cls.startsWith('leaflet'))
          .join(' ')
      }
    }
  }, [mapId])

  // Inside the EditModal component function

  const handleMapClickSelect = (locationFromClick) => {
    // locationFromClick is { lat, lng, latitude, longitude }
    setCurrentMapLocation({
      // Update map location state
      lat: locationFromClick.lat,
      lng: locationFromClick.lng,
    })
    //Clear search query if user clicks map instead
    setSearchQuery('')
    //Perform reverse geocoding here to update address/city fields in formData
    fetchReverseGeocode(
      locationFromClick.lat,
      locationFromClick.lng,
    ).then((details) => {
      setFormData((prev) => ({
        ...prev,
        address: details.address,
        city: details.city,
      }))
    })
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Create a copy of the form data for processing
    let processedData = { ...formData }

    // --- Add/Update Location just before saving ---
    if (
      currentMapLocation &&
      currentMapLocation.lat != null &&
      currentMapLocation.lng != null
    ) {
      // Assign the { lat, lng } object. The backend service will convert it.
      processedData.location = {
        lat: currentMapLocation.lat,
        lng: currentMapLocation.lng,
      }
    } else {
      // Handle case where location might be removed or was never set
      processedData.location = null // Or delete processedData.location;
    }

    // Process image fields before submission
    for (const [key, field] of Object.entries(fields)) {
      // Handle photoGallery fields - compress all new photos
      if (
        field.type === 'photoGallery' &&
        processedData[key]
      ) {
        // Separate existing URLs from new files
        const existingPhotos = processedData[key].filter(
          (photo) => typeof photo === 'string',
        )
        const newPhotos = processedData[key].filter(
          (photo) => typeof photo !== 'string',
        )

        if (newPhotos.length > 0) {
          // Compress new photos
          const compressedPhotos =
            await compressMultipleImages(newPhotos)

          // Recombine with existing photos
          processedData[key] = [
            ...existingPhotos,
            ...compressedPhotos,
          ]
        }
      }

      // Handle single image fields
      if (
        field.type === 'image' &&
        processedData[key] &&
        typeof processedData[key] !== 'string'
      ) {
        // Compress the image
        processedData[key] = await compressImage(
          processedData[key],
        )
      }
    }

    // Submit the processed data
    onSave(processedData)
  }

  // Render nothing on the server
  if (!isMounted || !isOpen) return null

  // Render the modal in a portal
  return createPortal(
    <div className='fixed inset-0 z-[9999] overflow-y-auto'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50 transition-opacity'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='flex items-center justify-center min-h-screen py-4 mx-2'>
        <div className='relative bg-white rounded-lg shadow-xl max-w-xl w-full mx-auto p-4 md:px-12 z-[9999]'>
          {/* Close button */}
          <button
            className='absolute top-3 right-3 text-gray-400 hover:text-gray-500'
            onClick={onClose}
          >
            <svg
              className='h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>

          {/* Title */}
          <h2 className='text-xl font-bold text-gray-800 mb-6'>
            {title}
          </h2>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className='space-y-4'
          >
            {fields &&
              Object.entries(fields).map(([key, field]) => {
                // Skip fields not meant to be shown
                if (field.show === false) return null

                switch (field.type) {
                  case 'text':
                  case 'email':
                  case 'number':
                  case 'url':
                  case 'date':
                  case 'tel':
                    return (
                      <div key={key}>
                        <label
                          htmlFor={key}
                          className='block text-sm font-medium text-gray-700 mb-1'
                        >
                          {field.label}
                        </label>
                        <input
                          id={key}
                          name={key}
                          type={field.type}
                          value={formData[key] || ''}
                          onChange={handleChange}
                          className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none'
                          required={field.required}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          placeholder={field.placeholder}
                        />
                        {field.description && (
                          <p className='mt-1 text-xs text-gray-500'>
                            {field.description}
                          </p>
                        )}
                      </div>
                    )

                  case 'datetime-local':
                    return (
                      <div key={key}>
                        <label
                          htmlFor={key}
                          className='block text-sm font-medium text-gray-700 mb-1'
                        >
                          {field.label}
                        </label>
                        <input
                          id={key}
                          name={key}
                          type='datetime-local'
                          value={formData[key] || ''}
                          onChange={handleChange}
                          className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none'
                          required={field.required}
                        />
                        {field.description && (
                          <p className='mt-1 text-xs text-gray-500'>
                            {field.description}
                          </p>
                        )}
                      </div>
                    )

                  case 'textarea':
                    return (
                      <div key={key}>
                        <label
                          htmlFor={key}
                          className='block text-sm font-medium text-gray-700 mb-1'
                        >
                          {field.label}
                        </label>
                        <textarea
                          id={key}
                          name={key}
                          value={formData[key] || ''}
                          onChange={handleChange}
                          rows={field.rows || 3}
                          className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none'
                          required={field.required}
                          placeholder={field.placeholder}
                          maxLength={field.maxlength}
                        />
                        {field.description && (
                          <p className='mt-1 text-base text-gray-500'>
                            {field.description}
                          </p>
                        )}
                        {field.maxlength && (
                          <p className='text-base text-gray-500 text-right mt-1'>
                            {formData[key]?.length || 0} /{' '}
                            {field.maxlength}
                          </p>
                        )}
                      </div>
                    )

                  case 'checkboxGroup':
                    return (
                      <div key={`${key}-group`}>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          {field.label}
                        </label>
                        <div className='grid grid-cols-2 gap-3'>
                          {field.options.map((option) => (
                            <label
                              key={`${key}-option-${option}`}
                              className={`flex items-center space-x-2 p-2 border rounded-lg hover:bg-[#1e40af20] cursor-pointer transition-colors duration-200 ${
                                formData[key]?.includes(
                                  option,
                                )
                                  ? 'bg-[#1e40af20]'
                                  : ''
                              }`}
                            >
                              <input
                                type='checkbox'
                                value={option}
                                checked={
                                  formData[key]?.includes(
                                    option,
                                  ) || false
                                }
                                onChange={(e) => {
                                  const currentArray =
                                    formData[key] || []
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      [key]: [
                                        ...currentArray,
                                        option,
                                      ],
                                    })
                                  } else {
                                    setFormData({
                                      ...formData,
                                      [key]:
                                        currentArray.filter(
                                          (item) =>
                                            item !== option,
                                        ),
                                    })
                                  }
                                }}
                                className='form-checkbox h-4 w-4 outline-none focus:ring-teal-500'
                              />
                              <span className='text-gray-700'>
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )

                  case 'select':
                    return (
                      <div key={key}>
                        <label
                          htmlFor={key}
                          className='block text-sm font-medium text-gray-700 mb-1'
                        >
                          {field.label}
                        </label>
                        <select
                          id={key}
                          name={key}
                          value={formData[key] || ''}
                          onChange={handleChange}
                          className='w-full p-2 border bg-white border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none'
                          required={field.required}
                        >
                          {field.options &&
                            field.options.map((option) => (
                              <option
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            ))}
                        </select>
                        {field.description && (
                          <p className='mt-1 text-base text-gray-500'>
                            {field.description}
                          </p>
                        )}
                      </div>
                    )

                  case 'checkbox':
                    return (
                      <div
                        key={key}
                        className='flex items-center'
                      >
                        <input
                          id={key}
                          name={key}
                          type='checkbox'
                          checked={!!formData[key]}
                          onChange={handleChange}
                          className='h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded outline-none'
                        />
                        <label
                          htmlFor={key}
                          className='ml-2 block text-sm text-gray-700'
                        >
                          {field.label}
                        </label>
                      </div>
                    )

                  case 'map':
                    // Use currentMapLocation for checks and centering
                    const hasLocation =
                      currentMapLocation &&
                      currentMapLocation.lat != null &&
                      currentMapLocation.lng != null

                    return (
                      <div key={key} className='my-4'>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          {field.label}
                          {field.required && (
                            <span className='text-red-500'>
                              *
                            </span>
                          )}
                        </label>

                        {field.description && (
                          <p className='text-base text-gray-500 mb-2'>
                            {field.description}
                          </p>
                        )}

                        {/* --- NEW: Address Search Input --- */}
                        <div className='relative mb-3'>
                          <label
                            htmlFor='address-search'
                            className='block text-xs font-medium text-gray-600 mb-1'
                          >
                            Buscar Dirección o Lugar
                          </label>
                          <input
                            id='address-search'
                            type='text'
                            value={searchQuery}
                            onChange={handleInputChange}
                            onFocus={() =>
                              setShowSuggestions(true)
                            }
                            // onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // Delay hiding to allow click
                            placeholder='Escribe una dirección...'
                            className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none'
                            disabled={isSearching}
                            autoComplete='off'
                          />
                          {isSearching && (
                            <span className='absolute right-2 top-8 text-xs text-gray-500'>
                              Buscando...
                            </span>
                          )}
                          {/* Suggestions List */}
                          {showSuggestions &&
                            suggestions.length > 0 && (
                              <div className='absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto'>
                                {suggestions.map((s) => (
                                  <button
                                    key={s.id}
                                    type='button' // Prevent form submission
                                    onClick={() =>
                                      handleSuggestionClick(
                                        s,
                                      )
                                    }
                                    onMouseDown={(e) =>
                                      e.preventDefault()
                                    } // Prevents input blur before click registers
                                    className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                                  >
                                    {s.place_name}
                                  </button>
                                ))}
                              </div>
                            )}
                          {searchError && (
                            <p className='text-red-500 text-xs mt-1'>
                              {searchError}
                            </p>
                          )}
                        </div>

                        {/* Show instruction message when no location is set */}
                        {!hasLocation && (
                          <div className='bg-blue-50 p-2 mb-3 text-base text-gray-700 rounded-md'>
                            <p className='flex items-center'>
                              <svg
                                className='h-5 w-5 mr-1'
                                fill='none'
                                viewBox='0 0 24 24'
                                stroke='currentColor'
                              >
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                                />
                              </svg>
                              Haz clic en el mapa para
                              seleccionar la ubicación
                              exacta de tu local
                            </p>
                          </div>
                        )}

                        <div className='h-72 w-full rounded-lg overflow-hidden'>
                          <MapComponent
                            mapId={mapId}
                            small={true}
                            hideSearch={false}
                            isEditable={true}
                            center={
                              hasLocation
                                ? [
                                    formData.location
                                      .latitude ||
                                      formData.location.lat,
                                    formData.location
                                      .longitude ||
                                      formData.location.lng,
                                  ]
                                : [-17.389499, -66.156123] // Default center for Bolivia
                            }
                            venues={
                              // Only include venue if BOTH latitude and longitude are valid numbers
                              hasLocation &&
                              typeof (
                                formData.location
                                  .latitude ||
                                formData.location.lat
                              ) === 'number' &&
                              typeof (
                                formData.location
                                  .longitude ||
                                formData.location.lng
                              ) === 'number' &&
                              !isNaN(
                                formData.location
                                  .latitude ||
                                  formData.location.lat,
                              ) &&
                              !isNaN(
                                formData.location
                                  .longitude ||
                                  formData.location.lng,
                              )
                                ? [
                                    {
                                      name:
                                        formData.name ||
                                        'Mi local',
                                      location:
                                        formData.location,
                                    },
                                  ]
                                : [] // Empty if no valid location - don't show any venue until location is selected
                            }
                            onLocationSelect={(
                              location,
                            ) => {
                              setFormData((prev) => ({
                                ...prev,
                                location: location,
                              }))
                            }}
                          />
                        </div>
                      </div>
                    )

                  case 'photoGallery':
                    return (
                      <div key={key} className='mb-4'>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          {field.label}
                          {field.description && (
                            <span className='text-gray-500 text-base ml-1'>
                              ({field.description})
                            </span>
                          )}
                        </label>

                        {/* Current photos grid */}
                        {formData[key] &&
                        formData[key].filter(
                          (p) => typeof p === 'string',
                        ).length > 0 ? (
                          <div className='mb-4'>
                            <p className='text-lg font-medium text-gray-700 mb-2'>
                              Fotos actuales:
                            </p>
                            <div className='grid grid-cols-3 gap-3'>
                              {formData[key].map(
                                (photo, index) =>
                                  typeof photo ===
                                    'string' && (
                                    <div
                                      key={photo}
                                      className='relative group border rounded-lg overflow-hidden'
                                    >
                                      <div className='relative h-36 w-full'>
                                        <img
                                          src={photo}
                                          alt={`Foto ${
                                            index + 1
                                          }`}
                                          className='w-full h-full object-cover'
                                        />
                                      </div>
                                      <button
                                        type='button'
                                        onClick={() => {
                                          const updatedPhotos =
                                            formData[
                                              key
                                            ].filter(
                                              (_, i) =>
                                                i !== index,
                                            )
                                          setFormData({
                                            ...formData,
                                            [key]:
                                              updatedPhotos,
                                          })
                                        }}
                                        className='absolute right-1 top-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity'
                                      >
                                        <svg
                                          className='h-4 w-4'
                                          fill='none'
                                          viewBox='0 0 24 24'
                                          stroke='currentColor'
                                        >
                                          <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            strokeWidth={2}
                                            d='M6 18L18 6M6 6l12 12'
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                  ),
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className='text-lg text-gray-500 mb-4'>
                            No hay fotos actualmente. Añade
                            algunas abajo.
                          </p>
                        )}

                        {/* Upload new photos */}
                        <div className='mt-3'>
                          <p className='text-lg font-medium text-gray-700 mb-2'>
                            Añadir nuevas fotos:
                          </p>
                          <input
                            type='file'
                            accept='image/*'
                            multiple
                            onChange={(e) => {
                              const files = Array.from(
                                e.target.files,
                              )
                              const currentPhotos =
                                formData[key] || []

                              // Check if adding these would exceed the max photos limit
                              const currentCount =
                                currentPhotos.filter(
                                  (p) =>
                                    typeof p === 'string',
                                ).length
                              const newFiles = files.slice(
                                0,
                                field.maxPhotos -
                                  currentCount,
                              )

                              if (newFiles.length > 0) {
                                setFormData({
                                  ...formData,
                                  [key]: [
                                    ...currentPhotos,
                                    ...newFiles,
                                  ],
                                })
                              }

                              // Reset the input to allow selecting the same files again
                              e.target.value = ''
                            }}
                            className='w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 outline-none'
                          />
                          {field.maxPhotos && (
                            <p className='text-base text-gray-500 mt-1'>
                              Máximo {field.maxPhotos}{' '}
                              fotos.
                              {formData[key] &&
                                formData[key].length > 0 &&
                                ` (${
                                  formData[key].filter(
                                    (p) =>
                                      typeof p === 'string',
                                  ).length
                                }/${
                                  field.maxPhotos
                                } utilizadas)`}
                            </p>
                          )}
                        </div>

                        {/* Preview for newly selected photos */}
                        {formData[key] &&
                          formData[key].some(
                            (photo) =>
                              typeof photo !== 'string',
                          ) && (
                            <div className='mt-4'>
                              <p className='text-lg font-medium text-gray-700 mb-2'>
                                Vista previa de nuevas
                                fotos:
                              </p>
                              <div className='grid grid-cols-3 gap-3'>
                                {formData[key].map(
                                  (photo, index) =>
                                    typeof photo !==
                                      'string' && (
                                      <div
                                        key={`new-${photo.name}-${index}`}
                                        className='relative group border rounded-lg overflow-hidden'
                                      >
                                        <div className='relative h-36 w-full'>
                                          <img
                                            src={URL.createObjectURL(
                                              photo,
                                            )}
                                            alt={`Nueva foto ${
                                              index + 1
                                            }`}
                                            className='w-full h-full object-cover'
                                          />
                                        </div>
                                        <button
                                          type='button'
                                          onClick={() => {
                                            const updatedPhotos =
                                              formData[
                                                key
                                              ].filter(
                                                (_, i) =>
                                                  i !==
                                                  index,
                                              )
                                            setFormData({
                                              ...formData,
                                              [key]:
                                                updatedPhotos,
                                            })
                                          }}
                                          className='absolute right-1 top-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity'
                                        >
                                          <svg
                                            className='h-4 w-4'
                                            fill='none'
                                            viewBox='0 0 24 24'
                                            stroke='currentColor'
                                          >
                                            <path
                                              strokeLinecap='round'
                                              strokeLinejoin='round'
                                              strokeWidth={
                                                2
                                              }
                                              d='M6 18L18 6M6 6l12 12'
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    ),
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    )

                  case 'array':
                    return (
                      <div key={`${key}-container`}>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          {field.label}
                        </label>
                        <div className='space-y-2'>
                          {formData[key] &&
                            formData[key].map(
                              (item, index) => (
                                <div
                                  key={`${key}-item-${index}`}
                                  className='flex items-center'
                                >
                                  <input
                                    type='text'
                                    value={item}
                                    onChange={(e) => {
                                      const newArray = [
                                        ...formData[key],
                                      ]
                                      newArray[index] =
                                        e.target.value
                                      setFormData({
                                        ...formData,
                                        [key]: newArray,
                                      })
                                    }}
                                    className='flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none'
                                  />
                                  <button
                                    type='button'
                                    onClick={() => {
                                      const newArray =
                                        formData[
                                          key
                                        ].filter(
                                          (_, i) =>
                                            i !== index,
                                        )
                                      setFormData({
                                        ...formData,
                                        [key]: newArray,
                                      })
                                    }}
                                    className='ml-2 text-red-500 hover:text-red-700'
                                  >
                                    <svg
                                      className='h-5 w-5'
                                      fill='none'
                                      viewBox='0 0 24 24'
                                      stroke='currentColor'
                                    >
                                      <path
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        strokeWidth={2}
                                        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v10M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3'
                                      />
                                    </svg>
                                  </button>
                                </div>
                              ),
                            )}
                          <button
                            type='button'
                            onClick={() => {
                              const currentArray =
                                formData[key] || []
                              setFormData({
                                ...formData,
                                [key]: [
                                  ...currentArray,
                                  '',
                                ],
                              })
                            }}
                            className='inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'
                          >
                            <svg
                              className='h-4 w-4 mr-1'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 4v16m8-8H4'
                              />
                            </svg>
                            Añadir{' '}
                            {field.itemLabel || 'elemento'}
                          </button>
                        </div>
                      </div>
                    )

                  case 'image':
                    return (
                      <div key={key}>
                        <label
                          htmlFor={key}
                          className='block text-sm font-medium text-gray-700 mb-1'
                        >
                          {field.label}
                          {field.required && (
                            <span className='text-red-500 ml-1'>
                              *
                            </span>
                          )}
                        </label>

                        <div className='flex flex-col space-y-2'>
                          {/* Show current image if it exists */}
                          {formData[key] &&
                            typeof formData[key] ===
                              'string' && (
                              <div className='relative w-full h-40 mb-2'>
                                <img
                                  src={formData[key]}
                                  alt='Current image'
                                  className='object-cover w-full h-full rounded-md'
                                />
                                <button
                                  type='button'
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      [key]: null,
                                    })
                                  }
                                  className='absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full'
                                >
                                  <svg
                                    className='w-4 h-4'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M6 18L18 6M6 6l12 12'
                                    />
                                  </svg>
                                </button>
                              </div>
                            )}

                          {/* Image upload input */}
                          <input
                            id={key}
                            name={key}
                            type='file'
                            accept={
                              field.accept || 'image/*'
                            }
                            onChange={(e) => {
                              if (
                                e.target.files &&
                                e.target.files[0]
                              ) {
                                setFormData({
                                  ...formData,
                                  [key]: e.target.files[0],
                                })
                              }
                            }}
                            className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none'
                          />

                          {/* Show preview of new image */}
                          {formData[key] &&
                            typeof formData[key] !==
                              'string' && (
                              <div className='relative w-full h-40 mb-2'>
                                <img
                                  src={URL.createObjectURL(
                                    formData[key],
                                  )}
                                  alt='New image preview'
                                  className='object-cover w-full h-full rounded-md'
                                />
                                <button
                                  type='button'
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      [key]: null,
                                    })
                                  }
                                  className='absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full'
                                >
                                  <svg
                                    className='w-4 h-4'
                                    fill='none'
                                    viewBox='0 0 24 24'
                                    stroke='currentColor'
                                  >
                                    <path
                                      strokeLinecap='round'
                                      strokeLinejoin='round'
                                      strokeWidth={2}
                                      d='M6 18L18 6M6 6l12 12'
                                    />
                                  </svg>
                                </button>
                              </div>
                            )}

                          {field.description && (
                            <p className='text-lg text-gray-500 mt-1'>
                              {field.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )

                  default:
                    return null
                }
              })}

            {/* Buttons */}
            <div className='flex justify-end space-x-3 pt-4'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'
              >
                Cancelar
              </button>
              <button
                type='submit'
                className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'
              >
                {saveButtonText}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default EditModal
