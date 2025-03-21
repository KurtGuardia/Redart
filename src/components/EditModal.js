'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

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
  const [formData, setFormData] = useState({})
  const [isMounted, setIsMounted] = useState(false)

  // Initialize form data when the modal opens or data changes
  useEffect(() => {
    if (data) {
      setFormData(data)
    }
  }, [data, isOpen])

  // Client-side only rendering for the portal
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  // Render nothing on the server
  if (!isMounted || !isOpen) return null

  // Render the modal in a portal
  return createPortal(
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50 transition-opacity'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='flex items-center justify-center min-h-screen p-4'>
        <div className='relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto p-6'>
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
          <h2 className='text-2xl font-bold text-gray-800 mb-6'>
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
                  case 'date':
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
                          className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                          required={field.required}
                          min={field.min}
                          max={field.max}
                          placeholder={field.placeholder}
                        />
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
                          className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                          required={field.required}
                          placeholder={field.placeholder}
                        />
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
                          className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                          required={field.required}
                        >
                          <option value=''>
                            {field.placeholder ||
                              'Seleccionar...'}
                          </option>
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
                          className='h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded'
                        />
                        <label
                          htmlFor={key}
                          className='ml-2 block text-sm text-gray-700'
                        >
                          {field.label}
                        </label>
                      </div>
                    )

                  case 'array':
                    return (
                      <div key={key}>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          {field.label}
                        </label>
                        <div className='space-y-2'>
                          {formData[key] &&
                            formData[key].map(
                              (item, index) => (
                                <div
                                  key={index}
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
                                    className='flex-grow p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
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
