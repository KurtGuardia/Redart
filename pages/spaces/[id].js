import Layout from "../../components/Layout"
import { db } from "../_app"
import { doc, getDoc } from "firebase/firestore"
import Image from "next/image"

export async function getServerSideProps(context) {
  const { id } = context.params
  const spaceRef = doc(db, "spaces", id)
  const spaceSnap = await getDoc(spaceRef)

  if (!spaceSnap.exists()) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      space: {
        id: spaceSnap.id,
        ...spaceSnap.data(),
      },
    },
  }
}

export default function SpaceDetail({ space }) {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{space.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            {space.imageUrl && (
              <Image
                src={space.imageUrl || "/placeholder.svg"}
                alt={space.name}
                width={600}
                height={400}
                className="rounded-lg object-cover"
              />
            )}
          </div>
          <div>
            <p className="text-gray-600 mb-4">{space.address}</p>
            <p className="text-gray-800 mb-4">{space.description}</p>
            {/* Add more details about the space here */}
          </div>
        </div>
        {/* Add a section for upcoming events at this space */}
      </div>
    </Layout>
  )
}

