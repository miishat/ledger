import React, { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

interface AnimatedNumberProps {
  value: number
  format?: (n: number) => string
  durationMs?: number
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  format = (n) => n.toLocaleString('en-CA', { maximumFractionDigits: 0 }),
  durationMs = 600,
}) => {
  const reduced = useReducedMotion()
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)

  useEffect(() => {
    if (reduced || prev.current === value) {
      prev.current = value
      return
    }
    const controls = animate(prev.current, value, {
      duration: durationMs / 1000,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(v),
    })
    prev.current = value
    return () => controls.stop()
  }, [value, reduced, durationMs])

  return <span>{format(reduced ? value : display)}</span>
}
