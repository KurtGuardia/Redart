import React, { useState, useEffect } from 'react'
import chroma from 'chroma-js'

const Spot = ( { colorName } ) => {
  const [position, setPosition] = useState( { top: '0%', left: '0%' } )

  useEffect( () => {
    setPosition( randomPosition() )
  }, [] )

  const getRgbValue = ( colorName ) => {
    try {
      const color = chroma( colorName )
      return color.rgb().join( ', ' )
    } catch ( error ) {
      console.error( `Invalid color name: ${colorName}` )
      return '0, 0, 0'
    }
  }

  const randomPosition = () => {
    const x = Math.random() * ( 65 - -15 ) + -15
    const y = Math.random() * ( 70 - -100 ) + -100
    return { top: `${y}%`, left: `${x}%` }
  }

  const color = getRgbValue( colorName )
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

  return <div style={style}></div>
}

export default Spot
