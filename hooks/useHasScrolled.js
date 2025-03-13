import { useState, useEffect } from 'react'

const useHasScrolled = ( threshold = 50 ) => {
  const [hasScrolled, setHasScrolled] = useState( false )

  useEffect( () => {
    const handleScroll = () => {
      const scrolled = window.scrollY > threshold
      setHasScrolled( scrolled )
    }

    window.addEventListener( 'scroll', handleScroll )
    return () => window.removeEventListener( 'scroll', handleScroll )
  }, [threshold] )

  return hasScrolled
}

export default useHasScrolled
