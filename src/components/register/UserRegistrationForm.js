'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaFacebook,
} from 'react-icons/fa'
import { auth, db } from '../../lib/firebase-client' // Adjust path as needed
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore'
import { translateFirebaseAuthError } from '../../lib/firebaseErrors'

const UserRegistrationForm = ({}) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [passwordsMatch, setPasswordsMatch] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [registerLoading, setRegisterLoading] =
    useState(false)
  const [socialLoading, setSocialLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] =
    useState(false)
  const router = useRouter()

  // Redirect authenticated users
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard') // Or wherever logged-in users should go
      }
    })
    return () => unsubscribe()
  }, [router])

  // Check if passwords match
  useEffect(() => {
    if (repeatPassword) {
      setPasswordsMatch(password === repeatPassword)
    } else {
      setPasswordsMatch(true) // Reset if repeat password is empty
    }
  }, [password, repeatPassword])

  // --- Validation ---
  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres'
    }
    if (!/[A-Z]/.test(password)) {
      return 'La contraseña debe contener al menos una letra mayúscula'
    }
    return ''
  }

  // --- Firestore User Creation/Update ---
  const createUserDocument = async (
    user,
    additionalData = {},
  ) => {
    if (!user) return

    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      // Only create if it doesn't exist
      const { displayName, email } = user
      const createdAt = serverTimestamp() // Use server timestamp for creation
      try {
        await setDoc(userRef, {
          name:
            displayName ||
            additionalData.name ||
            'Usuario Anónimo',
          email,
          createdAt,
          updatedAt: createdAt, // Initially same as createdAt
          ratings: [],
          ...additionalData, // Allow overriding defaults
        })
      } catch (error) {
        console.error('Error al crear el usuario: ', error)
        setError('Error al crear el usuario.')
        // Optional: Clean up created auth user if Firestore fails?
      }
    } else {
      // If user exists (e.g., via social previously), maybe update updatedAt
      try {
        await setDoc(
          userRef,
          { updatedAt: serverTimestamp() },
          { merge: true },
        )
      } catch (error) {
        console.error(
          'Error updating user document timestamp: ',
          error,
        )
      }
    }
  }

  // --- Handlers ---
  const handleEmailPasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!name.trim()) {
      setError('Por favor, ingresa tu nombre.')
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }
    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden')
      return
    }

    setRegisterLoading(true)
    try {
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        )
      const user = userCredential.user

      // Now create the user document in Firestore
      await createUserDocument(user, { name: name.trim() }) // Pass the entered name

      setMessage('¡Registro exitoso! Redirigiendo...')
      // Redirect is handled by onAuthStateChanged effect
      // setTimeout(() => router.push('/dashboard'), 1000); // Optional direct redirect
    } catch (error) {
      console.error('Email/Pass Signup Error:', error)
      if (error.code === 'auth/email-already-in-use') {
        setError(
          'Este correo electrónico ya está en uso. Intenta iniciar sesión.',
        )
      } else {
        setError(
          `Error en el registro: ${translateFirebaseAuthError(
            error.message,
          )}`,
        )
      }
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleSocialSignUp = async (providerType) => {
    setError('')
    setMessage('')
    setSocialLoading(true)

    let provider
    if (providerType === 'google') {
      provider = new GoogleAuthProvider()
    } else if (providerType === 'facebook') {
      provider = new FacebookAuthProvider()
      // Note: Facebook login requires setup in Firebase Console & Facebook Developer Portal
    } else {
      setError('Proveedor de inicio de sesión no válido.')
      setSocialLoading(false)
      return
    }

    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user

      // Create or update user document in Firestore
      await createUserDocument(user)

      setMessage(
        '¡Inicio de sesión exitoso! Redirigiendo...',
      )
      // Redirect is handled by onAuthStateChanged effect
    } catch (error) {
      console.error('Social Signup Error:', error)
      // Handle common errors like account-exists-with-different-credential
      if (
        error.code ===
        'auth/account-exists-with-different-credential'
      ) {
        setError(
          'Ya existe una cuenta con este correo electrónico usando otro método de inicio de sesión.',
        )
        // TODO: Optionally link credentials here
      } else if (
        error.code === 'auth/popup-closed-by-user'
      ) {
        // User closed the popup, do nothing or provide feedback
        setMessage('Proceso de inicio de sesión cancelado.')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setError(
          `Error con ${providerType}: ${error.message}`,
        )
      }
    } finally {
      setSocialLoading(false)
    }
  }

  return (
    <>
      {/* Email/Password Form */}
      <form
        onSubmit={handleEmailPasswordSubmit}
        className='min-w-96 mx-auto'
      >
        {/* Name */}
        <div className='mb-4'>
          <label
            htmlFor='userName'
            className='block text-gray-700 font-bold mb-2'
          >
            Nombre
          </label>
          <div className='relative'>
            <input
              type='text'
              id='userName'
              name='userName'
              className='w-full px-3 py-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder='Tu nombre (público)'
            />
            {name && (
              <button
                type='button'
                onClick={() => setName('')}
                className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                aria-label='Clear name input'
              >
                &#x2715;
              </button>
            )}
          </div>
        </div>

        {/* Email */}
        <div className='mb-4'>
          <label
            htmlFor='userEmail'
            className='block text-gray-700 font-bold mb-2'
          >
            Correo electrónico
          </label>
          <div className='relative'>
            <input
              type='email'
              id='userEmail'
              name='userEmail'
              className='w-full px-3 py-2 pr-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete='email'
            />
            {email && (
              <button
                type='button'
                onClick={() => setEmail('')}
                className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                aria-label='Clear email input'
              >
                &#x2715;
              </button>
            )}
          </div>
        </div>

        {/* Password */}
        <div className='mb-4'>
          <label
            htmlFor='userPassword'
            className='block text-gray-700 font-bold mb-2'
          >
            Contraseña
          </label>
          <div className='relative'>
            <input
              type={showPassword ? 'text' : 'password'}
              id='userPassword'
              name='userPassword'
              className='w-full px-3 py-2 pr-16 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete='new-password'
            />
            {password && (
              <button
                type='button'
                onClick={() => setPassword('')}
                className='absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                aria-label='Clear password input'
              >
                &#x2715;
              </button>
            )}
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
              aria-label={
                showPassword
                  ? 'Hide password'
                  : 'Show password'
              }
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <p className='text-xs text-gray-500 mt-1'>
            Mínimo 6 caracteres, 1 mayúscula.
          </p>
        </div>

        {/* Repeat Password */}
        <div className='mb-6'>
          <label
            htmlFor='userRepeatPassword'
            className='block text-gray-700 font-bold mb-2'
          >
            Repetir contraseña
          </label>
          <div className='relative'>
            <input
              type={
                showRepeatPassword ? 'text' : 'password'
              }
              id='userRepeatPassword'
              name='userRepeatPassword'
              className={`w-full px-3 py-2 pr-16 border rounded-lg focus:outline-none focus:ring-2 ${
                passwordsMatch
                  ? 'focus:ring-teal-500'
                  : 'focus:ring-red-500 border-red-300'
              }`}
              value={repeatPassword}
              onChange={(e) =>
                setRepeatPassword(e.target.value)
              }
              required
              autoComplete='new-password'
            />
            {repeatPassword && (
              <button
                type='button'
                onClick={() => setRepeatPassword('')}
                className='absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                aria-label='Clear repeat password input'
              >
                &#x2715;
              </button>
            )}
            {repeatPassword && (
              <button
                type='button'
                onClick={() =>
                  setShowRepeatPassword(!showRepeatPassword)
                }
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                aria-label={
                  showRepeatPassword
                    ? 'Hide repeat password'
                    : 'Show repeat password'
                }
              >
                {showRepeatPassword ? (
                  <FaEyeSlash />
                ) : (
                  <FaEye />
                )}
              </button>
            )}
          </div>
          {!passwordsMatch && repeatPassword && (
            <p className='text-red-500 text-xs italic mt-1'>
              Las contraseñas no coinciden.
            </p>
          )}
        </div>

        {/* Display Error/Success Messages */}
        {error && (
          <div className='mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center'>
            {error}
          </div>
        )}
        {message && (
          <div className='mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center'>
            {message}
          </div>
        )}

        {/* Submit Button */}
        <button
          type='submit'
          className='w-full bg-teal-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-600 transition duration-300 disabled:opacity-70'
          disabled={registerLoading || socialLoading}
        >
          {registerLoading
            ? 'Creando cuenta...'
            : 'Crear cuenta'}
        </button>
      </form>

      {/* Divider */}
      <div className='flex items-center my-6'>
        <div className='flex-grow border-t border-gray-300'></div>
        <span className='flex-shrink mx-4 text-gray-500 text-sm'>
          O
        </span>
        <div className='flex-grow border-t border-gray-300'></div>
      </div>

      {/* Social Sign Up Buttons */}
      <div className='flex flex-col sm:flex-row gap-3'>
        <button
          type='button'
          onClick={() => handleSocialSignUp('google')}
          className='flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition duration-300 disabled:opacity-70'
          disabled={registerLoading || socialLoading}
        >
          <FaGoogle className='text-red-500' />
          {socialLoading
            ? 'Procesando...'
            : 'Continuar con Google'}
        </button>
        {/* Add Facebook button if configured */}
        <button
          type='button'
          onClick={() => handleSocialSignUp('facebook')}
          className='flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 disabled:opacity-70'
          disabled={registerLoading || socialLoading}
        >
          <FaFacebook />
          {socialLoading
            ? 'Procesando...'
            : 'Continuar con Facebook'}
        </button>
      </div>
    </>
  )
}

export default UserRegistrationForm
