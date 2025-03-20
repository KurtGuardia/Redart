import { useState, useEffect, useRef } from 'react'
import useHasScrolled from '../hooks/useHasScrolled'

const TypingAnimation = ({ text = '', speed = 50 }) => {
  const hasScrolled = useHasScrolled()
  const [displayText, setDisplayText] = useState('')
  const intervalRef = useRef(null)
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (!hasScrolled || hasAnimated) return

    let currentIndex = 0
    intervalRef.current = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        clearInterval(intervalRef.current)
        setHasAnimated(true)
      }
    }, speed)

    return () => clearInterval(intervalRef.current)
  }, [hasScrolled, text, speed, hasAnimated])

  return (
    <p className='text-center text-2xl md:text-3xl px-4 leading-relaxed text-[var(--primary)] max-w-5xl mx-auto tracking-wider'>
      {displayText}
      {hasScrolled && (
        <span className='animate-blink'>|</span>
      )}
    </p>
  )
}

export default TypingAnimation
