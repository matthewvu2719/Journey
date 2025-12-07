import { useEffect, useRef } from 'react'

export function NumberTicker({ value, duration = 1000, className = '' }) {
  const ref = useRef(null)
  const startValueRef = useRef(0)
  const startTimeRef = useRef(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const startValue = startValueRef.current
    const endValue = value
    startTimeRef.current = Date.now()

    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(startValue + (endValue - startValue) * easeOut)
      
      element.textContent = current.toLocaleString()
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        startValueRef.current = endValue
      }
    }

    animate()
  }, [value, duration])

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  )
}
