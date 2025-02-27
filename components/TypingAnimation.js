import { useState, useEffect } from 'react'

const TypingAnimation = ( { text = '', speed = 50 } ) => {
  const [displayText, setDisplayText] = useState( '' )

  useEffect( () => {
    setDisplayText( '' )
    let currentIndex = 0
    const interval = setInterval( () => {
      if ( currentIndex < text.length ) {
        setDisplayText( prev => prev + text.charAt( currentIndex ) )
        currentIndex++
      } else {
        clearInterval( interval )
      }
    }, speed )

    return () => clearInterval( interval )
  }, [text, speed] )

  return (
    <p className='text-2xl text-[var(--primary)] max-w-5xl mx-auto tracking-wider leading-normal'>
      {displayText}
    </p>
  )
}

export default TypingAnimation
