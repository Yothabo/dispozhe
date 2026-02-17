import { useState, useEffect } from 'react'

interface KeyboardHeight {
  height: number
  isVisible: boolean
}

export const useKeyboardHeight = (): KeyboardHeight => {
  const [keyboardHeight, setKeyboardHeight] = useState<KeyboardHeight>({
    height: 0,
    isVisible: false
  })

  useEffect(() => {
    // Only run on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (!isMobile) return

    const handleResize = () => {
      // Get the visual viewport height
      const visualViewport = window.visualViewport
      if (!visualViewport) return

      // Get the window inner height
      const windowHeight = window.innerHeight
      
      // Calculate keyboard height (when visual viewport is smaller than window)
      const height = Math.max(0, windowHeight - visualViewport.height)
      
      setKeyboardHeight({
        height,
        isVisible: height > 100 // Threshold to detect keyboard
      })
    }

    // Add event listeners
    window.visualViewport?.addEventListener('resize', handleResize)
    window.visualViewport?.addEventListener('scroll', handleResize)
    
    // Initial check
    handleResize()

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize)
      window.visualViewport?.removeEventListener('scroll', handleResize)
    }
  }, [])

  return keyboardHeight
}
