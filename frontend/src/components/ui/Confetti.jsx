import { useEffect } from 'react'
import confetti from 'canvas-confetti'

export function Confetti({ trigger, type = 'default' }) {
  useEffect(() => {
    if (!trigger) return

    if (type === 'sideCannons') {
      // Side cannons effect for Perfect Month
      const end = Date.now() + 3 * 1000 // 3 seconds
      const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1"]

      const frame = () => {
        if (Date.now() > end) return

        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          startVelocity: 60,
          origin: { x: 0, y: 0.5 },
          colors: colors,
          zIndex: 9999,
        })

        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          startVelocity: 60,
          origin: { x: 1, y: 0.5 },
          colors: colors,
          zIndex: 9999,
        })

        requestAnimationFrame(frame)
      }

      frame()
    } else if (type === 'fireworks') {
      // Fireworks effect for Perfect Week
      const duration = 5 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }
      
      const randomInRange = (min, max) => Math.random() * (max - min) + min

      const interval = window.setInterval(() => {
        const timeLeft = animationEnd - Date.now()
        
        if (timeLeft <= 0) {
          return clearInterval(interval)
        }

        const particleCount = 50 * (timeLeft / duration)
        
        // Left side firework
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        })
        
        // Right side firework
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        })
      }, 250)

      return () => clearInterval(interval)
    } else if (type === 'stars') {
      // Star confetti effect for Perfect Day
      const defaults = {
        spread: 360,
        ticks: 50,
        gravity: 0,
        decay: 0.94,
        startVelocity: 30,
        colors: ["#FFE400", "#FFBD00", "#E89400", "#FFCA6C", "#FDFFB8"],
        zIndex: 9999,
      }

      const shoot = () => {
        confetti({
          ...defaults,
          particleCount: 40,
          scalar: 1.2,
          shapes: ["star"],
        })

        confetti({
          ...defaults,
          particleCount: 10,
          scalar: 0.75,
          shapes: ["circle"],
        })
      }

      // Trigger multiple bursts for a more dramatic effect
      setTimeout(shoot, 0)
      setTimeout(shoot, 100)
      setTimeout(shoot, 200)
    } else {
      // Default confetti effect for habit completion (original confetti)
      const count = 200
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
      }

      function fire(particleRatio, opts) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        })
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      })

      fire(0.2, {
        spread: 60,
      })

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      })

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      })

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      })
    }
  }, [trigger, type])

  return null // canvas-confetti renders directly to canvas
}
