'use client'

import { useEffect, useRef } from 'react'

const HeroBackgroundSlider = ({ images, children }) => {
  const heroRef = useRef(null)
  const imageSources = images || [
    '/theater.jpg',
    '/carnival.jpg',
    '/guitarist.jpg',
  ] // Default images if none provided

  useEffect(() => {
    let bgIndex = 0
    const interval = setInterval(() => {
      bgIndex = (bgIndex + 1) % imageSources.length
      if (heroRef.current) {
        // Add a transition for smooth background change
        heroRef.current.style.transition =
          'background-image 1s ease-in-out'
        heroRef.current.style.backgroundImage = `url(${imageSources[bgIndex]})`
      }
    }, 4000) // Changed interval to 4 seconds for smoother feel

    // Preload images
    imageSources.forEach((src) => {
      const img = new Image()
      img.src = src
    })

    return () => clearInterval(interval)
  }, [imageSources]) // Depend on imageSources

  return (
    <section
      ref={heroRef}
      className='hero img text-white h-[80vh] flex items-center justify-center w-full bg-cover bg-center' // Added bg-cover bg-center
      style={{
        backgroundImage: `url(${imageSources[0]})`,
        transition: 'background-image 1s ease-in-out', // Initial transition
      }}
    >
      {/* Render children passed to it (the content inside the hero) */}
      {children}
    </section>
  )
}

export default HeroBackgroundSlider
