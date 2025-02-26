'use client'

import Layout from '../components/Layout'
import { useState } from 'react'
import { auth, db, storage } from './_app'
import { collection, addDoc } from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage'
import { useRouter } from 'next/router'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AddSpace() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState(null)
  const [error, setError] = useState(null)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!auth.currentUser) {
      setError(
        'Debes iniciar sesión para agregar un espacio',
      )
      return
    }

    try {
      let imageUrl = null
      if (image) {
        const imageRef = ref(
          storage,
          `spaces/${auth.currentUser.uid}/${Date.now()}-${
            image.name
          }`,
        )
        await uploadBytes(imageRef, image)
        imageUrl = await getDownloadURL(imageRef)
      }

      const spaceData = {
        name,
        address,
        description,
        imageUrl,
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      }

      const docRef = await addDoc(
        collection(db, 'spaces'),
        spaceData,
      )
      router.push(`/spaces/${docRef.id}`)
    } catch (error) {
      setError(
        'Error al agregar el espacio: ' + error.message,
      )
    }
  }

  return (
    <Layout>
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold mb-8'>
          Agregar nuevo espacio
        </h1>
        {error && (
          <p className='text-red-500 mb-4'>{error}</p>
        )}
        <form
          onSubmit={handleSubmit}
          className='max-w-lg mx-auto'
        >
          <div className='mb-4'>
            <Label
              htmlFor='name'
              className='block text-gray-700 font-bold mb-2'
            >
              Nombre del espacio
            </Label>
            <Input
              type='text'
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500'
              required
            />
          </div>
          <div className='mb-4'>
            <Label
              htmlFor='address'
              className='block text-gray-700 font-bold mb-2'
            >
              Dirección
            </Label>
            <Input
              type='text'
              id='address'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500'
              required
            />
          </div>
          <div className='mb-4'>
            <Label
              htmlFor='description'
              className='block text-gray-700 font-bold mb-2'
            >
              Descripción
            </Label>
            <textarea
              id='description'
              value={description}
              onChange={(e) =>
                setDescription(e.target.value)
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500'
              rows='4'
              required
            ></textarea>
          </div>
          <div className='mb-6'>
            <Label
              htmlFor='image'
              className='block text-gray-700 font-bold mb-2'
            >
              Imagen del espacio
            </Label>
            <Input
              type='file'
              id='image'
              accept='image/*'
              onChange={(e) => setImage(e.target.files[0])}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500'
            />
          </div>
          <button
            type='submit'
            className='w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition duration-300'
          >
            Agregar espacio
          </button>
        </form>
      </div>
    </Layout>
  )
}
