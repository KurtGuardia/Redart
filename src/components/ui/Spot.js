'use client'

import React from 'react'
import chroma from 'chroma-js'

const COLOR_PALETTE = [
  'OliveDrab',
  'Teal',
  'Chartreuse',
  'Coral',
  'SlateBlue',
  'Magenta',
  'Red',
  'Indigo',
  'GoldenRod',
  'MediumVioletRed',
  'DarkKhaki',
  'DarkOrchid',
  'Cyan',
  'SkyBlue',
  'Peru',
  'FireBrick',
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
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(${color}, 0.4) 0%, rgba(${color}, 0) 50%)`,
          filter: 'blur(50px)',
          opacity: 1,
          transition: 'opacity 0.3s ease-out',
        }
        return <div key={i} style={style}></div>
      })}
    </>
  )
}

export default Spots
