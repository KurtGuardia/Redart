import Layout from "../../components/Layout"
import { db } from "../_app"
import { doc, getDoc } from "firebase/firestore"
import Image from "next/image"

export async function getServerSideProps(context) {
  const { id } = context.params
  const eventRef = doc(db, "events", id)
  const eventSnap = await getDoc(eventRef)

  if (!eventSnap.exists()) {
    return {
      notFound: true,
    }
  }

  const event = {
    id: eventSnap.id,
    ...eventSnap.data(),
  }

  // Fetch space details
  const spaceRef = doc(db, "spaces", event.spaceId)
  const spaceSnap = await getDoc(spaceRef)
  const space = spaceSnap.exists() ? { id: spaceSnap.id, ...spaceSnap.data() } : null

  return {
    props: {
      event,
      space,
    },
  }
}

export default function EventDetail({ event, space }) {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {event.imageUrl && (
              <Image
                src={event.imageUrl || "/placeholder.svg"}
                alt={event.title}
                width={600}
                height={400}
                className="rounded-lg object-cover"
              />
            )}
          </div>
          <div>
            <p className="text-gray-600 mb-2">
              Fecha: {event.date} a las {event.time}
            </p>
            <p className="text-gray-600 mb-4">Precio: {event.price}</p>
            <p className="text-gray-800 mb-4">{event.description}</p>
            {space && (
              <div className="mt-4">
                <h2 className="text-xl font-semibold mb-2">Ubicación</h2>
                <p className="text-gray-600">{space.name}</p>
                <p className="text-gray-600">{space.address}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

