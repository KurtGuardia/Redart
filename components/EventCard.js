import Image from 'next/image'
import React from 'react'

const EventCard = ( { title, description, date, location, image } ) => (
  <div className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 hover:ring-2 hover:ring-[var(--primary)] transition-all duration-300 p-4 max-w-sm mx-auto flex flex-col">
    {image ? (
      <Image
        src={image}
        alt={title}
        className="  rounded-md"
        width={400}
        height={400}
        priority
        responsive
      />
    ) : (
      <div className="py-4">
        <span className="text-gray-400">Img de: {title} | Imagen no disponible</span>
      </div>
    )}
    <h3 className="text-lg font-semibold mt-4">{title}</h3>
    <p className="text-gray-600 text-sm flex-1">{description}</p>
    <div className="flex justify-between items-center mt-4 text-gray-600 text-sm">
      <div className="flex items-center gap-2">
        <span>📅 {date}</span>
      </div>
      <div className="flex items-center gap-2">
        <span>📍 {location}</span>
      </div>
    </div>
    <div className="mt-4">
      <button className="text-[var(--primary)] font-semibold hover:underline">
        Ver más
      </button>
    </div>
  </div>
)

export default EventCard
