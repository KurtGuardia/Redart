'use client'

import { useEffect, useRef } from 'react'

const HeroBackgroundSlider = ({ images, children }) => {
  const heroRef = useRef(null)
  const imageSources = images || [
    '/theater.jpg',
    '/carnival.jpg',
    '/guitarist.jpg',
  ]

  useEffect(() => {
    let bgIndex = 0
    const interval = setInterval(() => {
      bgIndex = (bgIndex + 1) % imageSources.length
      if (heroRef.current) {
        heroRef.current.style.transition =
          'background-image 1s ease-in-out'
        heroRef.current.style.backgroundImage = `url(${imageSources[bgIndex]})`
      }
    }, 4000)

    imageSources.forEach((src) => {
      const img = new Image()
      img.src = src
    })

    return () => clearInterval(interval)
  }, [imageSources])

  return (
    <section
      ref={heroRef}
      className='hero img text-white  h-screen lg:h-[80vh] flex items-center justify-center w-full bg-cover bg-center p-8'
      style={{
        backgroundImage: `url(${imageSources[0]})`,
        transition: 'background-image 1s ease-in-out',
      }}
    >
      {' '}
      {children}
    </section>
  )
}

export default HeroBackgroundSlider
