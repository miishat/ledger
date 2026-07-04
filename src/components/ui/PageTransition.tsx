import React from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const reduced = useReducedMotion()
  if (reduced) return <>{children}</>
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
