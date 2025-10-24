"use client"

import { useState, useEffect } from 'react'

// Optimized window width hook with debouncing and proper cleanup
function useWindowWidth() {
  const [windowWidth, setWindowWidth] = useState(768) // Default to tablet width

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Set initial width
    setWindowWidth(window.innerWidth)

    // Debounced resize handler
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth)
      }, 150) // 150ms debounce
    }

    window.addEventListener('resize', handleResize, { passive: true })
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return windowWidth
}

export { useWindowWidth }