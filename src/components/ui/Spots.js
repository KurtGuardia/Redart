'use client'

import { useEffect, useState } from 'react'
import chroma from 'chroma-js'

const COLOR_PALETTE = [
  'Aqua',
  'Aquamarine',
  'Blue',
  'BlueViolet',
  'Chartreuse',
  'Coral',
  'Crimson',
  'Cyan',
  'DeepPink',
  'DeepSkyBlue',
  'DodgerBlue',
  'Fuchsia',
  'Gold',
  'HotPink',
  'LawnGreen',
  'Lime',
  'LimeGreen',
  'Magenta',
  'MediumOrchid',
  'MediumPurple',
  'MediumSpringGreen',
  'Orange',
  'OrangeRed',
  'Orchid',
  'Pink',
  'Red',
  'SpringGreen',
  'Tomato',
  'Turquoise',
  'Violet',
  'Yellow',
  'YellowGreen',
]

function getRandomColor() {
  const idx = Math.floor(
    Math.random() * COLOR_PALETTE.length,
  )
  return COLOR_PALETTE[idx]
}

function getRgbValue(colorName) {
  try {
    const color = chroma(colorName)
    return color.rgb().join(', ')
  } catch (error) {
    console.error(`Invalid color name: ${colorName}`)
    return '0, 0, 0'
  }
}

function randomPosition() {
  const x = Math.random() * (65 - -15) + -15
  const y = Math.random() * (70 - -100) + -100
  return { top: `${y}%`, left: `${x}%` }
}

const Spots = ({ count = 5 }) => {
  const [mounted, setMounted] = useState(false)
  const [dynamicStyles, setDynamicStyles] = useState({
    size: 450,
  })

  useEffect(() => {
    setMounted(true)

    const calculateStyles = () => {
      const width = window.innerWidth
      // Adjust size based on viewport width, with min/max caps
      const size = Math.min(450, Math.max(200, width * 0.3))
      setDynamicStyles({ size })
    }

    // Calculate initial styles on mount
    calculateStyles()

    // Add resize listener to update styles
    window.addEventListener('resize', calculateStyles)

    // Cleanup listener on unmount
    return () =>
      window.removeEventListener('resize', calculateStyles)
  }, [])
  if (!mounted) return null

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const colorName = getRandomColor()
        const color = getRgbValue(colorName)
        const position = randomPosition()
        const style = {
          position: 'absolute',
          zIndex: -1,
          ...position,
          width: `${dynamicStyles.size}px`,
          height: `${dynamicStyles.size}px`,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${color}, 0.5) 0%, rgba(${color}, 0) 50%)`,
          filter: 'blur(20px)',
          transition: 'opacity 0.3s ease-out',
        }
        return <div key={i} style={style}></div>
      })}
    </>
  )
}

export default Spots
