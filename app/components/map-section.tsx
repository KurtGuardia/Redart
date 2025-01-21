'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(
  () => import('./map-component'),
  { ssr: false }
)

export function MapSection() {
  return (
    <div className="bg-card rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4 text-foreground">Mapa de Lugares</h2>
      <div className="relative w-full h-[60vh]">
        <MapComponent />
      </div>
    </div>
  )
}
