'use client'

import { useState } from 'react'

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleOpen = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className='border-b border-gray-200 pb-4'>
      <button
        className='flex justify-between items-center w-full text-left py-2 focus:outline-none'
        onClick={toggleOpen}
        aria-expanded={isOpen}
      >
        <span className='text-lg font-semibold text-gray-800'>
          {question}
        </span>
        <svg
          className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 9l-7 7-7-7'
          />
        </svg>
      </button>
      {isOpen && (
        <div className='mt-2 pr-10'>
          {' '}
          {/* Add padding to prevent text bumping icon */}
          <p className='text-gray-600 leading-relaxed'>
            {answer}
          </p>
        </div>
      )}
    </div>
  )
}

export default FAQItem
