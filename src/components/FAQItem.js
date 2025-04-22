'use client'

import { useState } from 'react'

const FAQItem = ( { question, answer } ) => {
  const [isOpen, setIsOpen] = useState( false )

  const toggleOpen = () => {
    setIsOpen( !isOpen )
  }

  return (
    <div className='rounded-md bg-white shadow-md'>
      <button
        className='flex justify-between items-center w-full text-left p-4 2xl:p-6 focus:outline-none'
        onClick={toggleOpen}
        aria-expanded={isOpen}
      >
        <span className='text-xl 2xl:text-3xl font-semibold text-[var(--teal-800)]'>
          {question}
        </span>
        <svg
          className={`w-6 h-6 text-gray-500 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''
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
        <p className='text-base 2xl:text-2xl p-4 bg-gray-100 rounded-b-md text-[var(--blue-800)] leading-relaxed'>
          {answer}
        </p>
      )}
    </div>
  )
}

export default FAQItem
