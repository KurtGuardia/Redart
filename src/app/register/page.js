'use client'

import { useState } from 'react'
import Link from 'next/link'
import Spots from '../../components/ui/Spot'
import VenueRegistrationForm from '../../components/register/VenueRegistrationForm'
import UserRegistrationForm from '../../components/register/UserRegistrationForm'

export default function Register() {
  const [activeTab, setActiveTab] = useState('venue') // 'user' or 'venue'

  return (
    <>
      <Spots count={5} />
      <div className='min-w-[40vw] mx-auto mt-32 mb-24'>
        {/* Tab Buttons Container - Note: Removed bottom border from here */}
        <div className='flex'>
          {/* User Tab */}
          <button
            onClick={() => setActiveTab('user')}
            className={`flex-1 py-3 px-4 text-center text-lg rounded-t-3xl transition-all duration-200 ease-in-out
              ${
                activeTab === 'user'
                  ? 'bg-white text-teal-600 font-bold'
                  : 'bg-amber-50 text-gray-500 border-b-2 tracking-wide hover:bg-amber-100 hover:text-gray-700'
              }`}
          >
            Personas
          </button>
          {/* Venue Tab */}
          <button
            onClick={() => setActiveTab('venue')}
            className={`flex-1 py-3 px-4 text-center text-lg rounded-t-3xl transition-all duration-200 ease-in-out
              ${
                activeTab === 'venue'
                  ? 'bg-white text-teal-600 font-bold'
                  : 'bg-amber-50 text-gray-500 border-b-2 tracking-wide hover:bg-amber-100 hover:text-gray-700'
              }`}
          >
            Establecimiento
          </button>
        </div>

        {/* Form Container - Apply the background, padding, shadow here */}
        <div className='p-6 sm:p-8 bg-white rounded-b-lg shadow-md overflow-hidden '>
          {/* Page Title - Can be dynamic or static */}
          <h2 className='text-2xl font-bold mb-6 text-center'>
            {activeTab === 'user'
              ? 'Crear cuenta Personal'
              : 'Crear cuenta de Establecimiento'}
          </h2>

          {/* Conditional Form Rendering */}
          <div className='transition-opacity duration-300 ease-in-out'>
            {activeTab === 'user' && (
              <UserRegistrationForm />
            )}
            {activeTab === 'venue' && (
              <VenueRegistrationForm />
            )}
          </div>

          {/* Login Link - Added back here */}
          <p className='mt-6 text-center text-sm'>
            ¿Ya tienes una cuenta?{' '}
            <Link
              className='text-teal-600 hover:underline'
              href='/login'
            >
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
