"use client"

import Layout from "../components/Layout"
import { useState, useEffect } from "react"
import { auth, db, storage } from "./_app"
import { collection, addDoc, getDocs } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useRouter } from "next/router"

export default function AddEvent() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [price, setPrice] = useState("")
  const [spaceId, setSpaceId] = useState("")
  const [image, setImage] = useState(null)
  const [spaces, setSpaces] = useState([])
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const fetchSpaces = async () => {
      if (auth.currentUser) {
        const spacesSnapshot = await getDocs(collection(db, "spaces"))
        const spacesList = spacesSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((space) => space.userId === auth.currentUser.uid)
        setSpaces(spacesList)
      }
    }
    fetchSpaces()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!auth.currentUser) {
      setError("Debes iniciar sesión para agregar un evento")
      return
    }

    try {
      let imageUrl = null
      if (image) {
        const imageRef = ref(storage, `events/${auth.currentUser.uid}/${Date.now()}-${image.name}`)
        await uploadBytes(imageRef, image)
        imageUrl = await getDownloadURL(imageRef)
      }

      const eventData = {
        title,
        description,
        date,
        time,
        price,
        spaceId,
        imageUrl,
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
      }

      const docRef = await addDoc(collection(db, "events"), eventData)
      router.push(`/events/${docRef.id}`)
    } catch (error) {
      setError("Error al agregar el evento: " + error.message)
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Agregar nuevo evento</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 font-bold mb-2">
              Título del evento
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="description" className="block text-gray-700 font-bold mb-2">
              Descripción
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              rows="4"
              required
            ></textarea>
          </div>
          <div className="mb-4">
            <label htmlFor="date" className="block text-gray-700 font-bold mb-2">
              Fecha
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="time" className="block text-gray-700 font-bold mb-2">
              Hora
            </label>
            <input
              type="time"
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="price" className="block text-gray-700 font-bold mb-2">
              Precio
            </label>
            <input
              type="text"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="space" className="block text-gray-700 font-bold mb-2">
              Espacio
            </label>
            <select
              id="space"
              value={spaceId}
              onChange={(e) => setSpaceId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            >
              <option value="">Selecciona un espacio</option>
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-6">
            <label htmlFor="image" className="block text-gray-700 font-bold mb-2">
              Imagen del evento
            </label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition duration-300"
          >
            Agregar evento
          </button>
        </form>
      </div>
    </Layout>
  )
}

