'use client'

import { useState } from 'react'
import { CATEGORIES } from '../../lib/constants'
import { isValidUrl } from '../../lib/utils'

export default function EventCreateForm({
  onAddEvent,
  eventFormError,
  eventSuccess,
  setEventFormError,
  setEventSuccess,
}) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('BOB')
  const [ticketUrl, setTicketUrl] = useState('')
  const [image, setImage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [duration, setDuration] = useState('')

  const MAX_IMAGE_SIZE_MB = 2
  const MAX_IMAGE_SIZE_BYTES =
    MAX_IMAGE_SIZE_MB * 1024 * 1024

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        console.warn(
          `Image too large: ${Math.round(
            file.size / 1024,
          )}KB > ${MAX_IMAGE_SIZE_MB}MB`,
        )
        if (setEventFormError)
          setEventFormError(
            `La imagen no debe superar los ${MAX_IMAGE_SIZE_MB}MB.`,
          )
        setImage(null)
        e.target.value = ''
        return
      }

      if (!file.type.startsWith('image/')) {
        console.warn(`Invalid file type: ${file.type}`)
        if (setEventFormError)
          setEventFormError(
            'Por favor selecciona un archivo de imagen válido (JPEG, PNG, GIF, etc.).',
          )
        setImage(null)
        e.target.value = ''
        return
      }

      // Ensure PNG is accepted
      const validImageTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/svg+xml',
      ]
      if (!validImageTypes.includes(file.type)) {
        console.warn(
          `Image type not explicitly supported: ${file.type}. Will attempt to process anyway.`,
        )
        // Continue anyway since it passed the image/ check above
      }

      setImage(file)
      if (setEventFormError) setEventFormError('') // Clear error on new valid image
    } else {
      setImage(null)
    }
  }

  const handleRemoveImage = () => {
    setImage(null)
    // Reset the file input visually
    const fileInput = document.getElementById('eventImage')
    if (fileInput) fileInput.value = ''
    if (setEventFormError) setEventFormError('') // Clear any previous image errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Clear previous messages using setters from parent
    if (setEventFormError) setEventFormError('')
    if (setEventSuccess) setEventSuccess('')

    // --- Client-Side Validation ---
    try {
      if (!title.trim())
        throw new Error(
          'El título del evento es obligatorio.',
        )
      if (!description.trim())
        throw new Error(
          'La descripción del evento es obligatoria.',
        )
      if (!category)
        throw new Error(
          'La categoría del evento es obligatoria.',
        )

      // Date validation
      if (!date)
        throw new Error(
          'La fecha y hora del evento son obligatorias.',
        )
      const eventDateTime = new Date(date)
      if (isNaN(eventDateTime.getTime())) {
        throw new Error('Formato de fecha y hora inválido.')
      }
      if (eventDateTime < new Date()) {
        throw new Error(
          'La fecha del evento debe ser en el futuro.',
        )
      }

      // Price validation (optional - ensure it's a number if provided)
      if (price && isNaN(Number(price))) {
        throw new Error(
          'El precio debe ser un número válido.',
        )
      }

      // Ticket URL validation
      if (ticketUrl && !isValidUrl(ticketUrl.trim())) {
        throw new Error(
          'El formato de la URL de venta de entradas no es válido.',
        )
      }

      // Image size validation (redundant check, primarily handled in handleImageChange, but good safeguard)
      if (image && image.size > MAX_IMAGE_SIZE_BYTES) {
        throw new Error(
          `La imagen no debe superar los ${MAX_IMAGE_SIZE_MB}MB.`,
        )
      }
      if (image && !image.type.startsWith('image/')) {
        throw new Error(
          'El archivo seleccionado para la imagen no es válido.',
        )
      }
    } catch (validationError) {
      if (setEventFormError)
        setEventFormError(validationError.message)
      setIsSubmitting(false)
      // Optional: Scroll to error
      document
        .querySelector('.error-message-selector')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      return // Stop submission
    }

    const formData = {
      title: title.trim(),
      date,
      description: description.trim(),
      category,
      price,
      currency,
      ticketUrl: ticketUrl.trim(),
      duration,
    }

    // Call the handler passed from the parent component
    const success = await onAddEvent(formData, image)

    if (success) {
      // Reset form fields locally upon successful submission
      setTitle('')
      setDate('')
      setDescription('')
      setCategory('')
      setPrice('')
      setCurrency('BOB')
      setTicketUrl('')
      setDuration('')
      handleRemoveImage() // Clear image state and file input
    }
    // Error/Success message display is handled by the parent based on the return value
    setIsSubmitting(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='my-6 bg-white rounded-lg shadow-sm text-sm md:text-base 2xl:text-lg'
      noValidate
    >
      <h3 className='text-lg md:text-xl 2xl:text-2xl font-semibold w-fit text-gray-800 my-4 border-b pb-2'>
        Crear Nuevo Evento
      </h3>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 text-sm md:text-base 2xl:text-lg'>
        {/* Title */}
        <div className='col-span-2 text-sm md:text-base 2xl:text-lg'>
          <label
            htmlFor='eventTitle'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Título del evento{' '}
            <span className='text-red-500'>*</span>
          </label>
          <input
            id='eventTitle'
            type='text'
            placeholder='Ej: Concierto de Jazz'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none focus:border-transparent '
            required
            maxLength={100}
          />
        </div>

        {/* Category */}
        <div className='col-span-2 md:col-span-1'>
          <label
            htmlFor='eventCategory'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Categoría{' '}
            <span className='text-red-500'>*</span>
          </label>
          <select
            id='eventCategory'
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className='w-full p-2 border bg-white border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none focus:border-transparent'
            required
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price & Currency */}
        <div className='col-span-2 md:col-span-1'>
          <label
            htmlFor='eventPrice'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Precio
          </label>
          <div className='flex gap-7 md:gap-2 text-sm md:text-base 2xl:text-lg'>
            <div className='relative flex-1'>
              <input
                id='eventPrice'
                type='number'
                min='0'
                max='9999'
                step='0.1'
                placeholder='0.00'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className='w-full min-w-20 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none focus:border-transparent text-sm md:text-base 2xl:text-lg '
              />
            </div>
            <select
              id='eventCurrency'
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className='w-24 p-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none focus:border-transparent text-sm md:text-base 2xl:text-lg'
            >
              <option value='BOB'>Bs (BOB)</option>
              <option value='USD'>$ (USD)</option>
              <option value='EUR'>€ (EUR)</option>
              <option value='GBP'>£ (GBP)</option>
              <option value='BRL'>R$ (BRL)</option>
              <option value='ARS'>$ (ARS)</option>
              <option value='CLP'>$ (CLP)</option>
              <option value='COP'>$ (COP)</option>
              <option value='MXN'>$ (MXN)</option>
              <option value='PEN'>S/ (PEN)</option>
              <option value='UYU'>$U (UYU)</option>
              <option value='PYG'>₲ (PYG)</option>
            </select>
          </div>
          <p className='text-xs md:text-sm 2xl:text-base text-gray-500 mt-1'>
            Deja en 0 o vacío si es gratis
          </p>
        </div>

        {/* Date */}
        <div className='col-span-2 md:col-span-1'>
          <label
            htmlFor='eventDate'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Fecha y hora{' '}
            <span className='text-red-500'>*</span>
          </label>
          <input
            id='eventDate'
            type='datetime-local'
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none focus:border-transparent'
            required
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        {/* Duration (optional) */}
        <div className='col-span-2 md:col-span-1'>
          <label
            htmlFor='eventDuration'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Duración <small>(opcional)</small>
          </label>
          <input
            id='eventDuration'
            type='number'
            min='0.25'
            step='0.25'
            placeholder='Ej: 2'
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none focus:border-transparent'
          />
        </div>

        {/* Ticket URL */}
        <div className='col-span-2 text-sm md:text-base 2xl:text-lg'>
          <label
            htmlFor='eventTicketUrl'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            URL de venta de entradas
          </label>
          <input
            id='eventTicketUrl'
            type='url'
            placeholder='https://ejemplo.com/tickets'
            value={ticketUrl}
            onChange={(e) => setTicketUrl(e.target.value)}
            className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none focus:border-transparent'
          />
          <p className='text-xs md:text-sm 2xl:text-base text-gray-500 mt-1'>
            Opcional: URL donde se pueden comprar entradas
          </p>
        </div>

        {/* Description */}
        <div className='col-span-2 text-sm md:text-base 2xl:text-lg'>
          <label
            htmlFor='eventDescription'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Descripción{' '}
            <span className='text-red-500'>*</span>
          </label>
          <textarea
            id='eventDescription'
            rows='4'
            placeholder='Describe el evento, artistas, horarios, etc.'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none focus:border-transparent'
            required
            maxLength={999}
          ></textarea>
          <p className='text-xs md:text-sm 2xl:text-base text-gray-500 text-right mt-1'>
            {description.length} / 999
          </p>
        </div>

        {/* Image */}
        <div className='col-span-2 text-sm md:text-base 2xl:text-lg'>
          <label
            htmlFor='eventImage'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Imagen (Max {MAX_IMAGE_SIZE_MB}MB)
          </label>
          <div className='flex items-center gap-4 text-sm md:text-base 2xl:text-lg'>
            <input
              id='eventImage'
              type='file'
              accept='image/png, image/jpeg, image/jpg, image/gif, image/svg+xml, image/*'
              onChange={handleImageChange}
              className='flex-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none focus:border-transparent text-sm md:text-base 2xl:text-lg'
            />
            {image && (
              <div className='h-16 w-16 relative border rounded overflow-hidden'>
                <img
                  src={URL.createObjectURL(image)}
                  alt='Vista previa'
                  className='h-full w-full object-cover text-sm md:text-base 2xl:text-lg'
                />
                <button
                  type='button'
                  onClick={handleRemoveImage}
                  className='absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl text-xs md:text-sm 2xl:text-base'
                  aria-label='Remove image preview'
                >
                  <svg
                    className='w-3 h-3'
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
          </div>
          <p className='text-xs md:text-sm 2xl:text-base text-gray-500 mt-1'>
            Recomendado: 16:9. Tipos comunes: JPG, PNG, GIF,
            WEBP.
          </p>
        </div>
      </div>

      {/* Error Message Display (using prop from parent) */}
      {eventFormError && (
        <div className='bg-red-50 border-l-4 border-red-500 p-4 mb-4 error-message-selector text-xs md:text-sm 2xl:text-base'>
          {' '}
          {/* Added class for potential scrolling */}
          <p className='text-red-700 text-xs md:text-sm 2xl:text-base'>
            {eventFormError}
          </p>
        </div>
      )}

      {/* Success Message Display (using prop from parent) */}
      {eventSuccess && (
        <div className='bg-green-50 border-l-4 border-green-500 p-4 mb-4 text-xs md:text-sm 2xl:text-base'>
          <p className='text-green-700 text-xs md:text-sm 2xl:text-base'>
            {eventSuccess}
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div className='mt-8 text-sm md:text-base 2xl:text-lg'>
        <button
          type='submit'
          disabled={isSubmitting}
          className='w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold text-base md:text-lg 2xl:text-xl rounded-md hover:from-teal-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition duration-200 disabled:opacity-70 disabled:cursor-not-allowed'
        >
          {isSubmitting ? (
            <span className='flex items-center justify-center text-sm md:text-base 2xl:text-lg'>
              Agregando...
            </span>
          ) : (
            <span className='flex items-center justify-center text-sm md:text-base 2xl:text-lg'>
              <svg
                className='w-5 h-5 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                />
              </svg>
              Agregar evento
            </span>
          )}
        </button>
      </div>
    </form>
  )
}
