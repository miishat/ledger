import React from 'react'
import type { AppTheme } from '../../store/useThemeStore'

interface ThemeBackgroundProps {
  theme: AppTheme
}

export const ThemeBackground: React.FC<ThemeBackgroundProps> = ({ theme }) => {
  if (theme === 'aurora') {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Deep Slate Background */}
        <div className="absolute inset-0 bg-[#090d16]" />
        
        {/* Glow Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/10 blur-[120px] animate-float-1" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-violet-600/10 blur-[140px] animate-float-2" />
        <div className="absolute top-[30%] right-[20%] w-[40vw] h-[40vw] rounded-full bg-sky-500/5 blur-[100px] animate-float-1" style={{ animationDelay: '-5s' }} />
      </div>
    )
  }

  if (theme === 'glass') {
    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#0b0910]">
        {/* Subtle Radial Mesh */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle at 40% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), 
                              radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.1) 0%, transparent 45%)`
          }}
        />
        
        {/* Neon Light Bars/Blobs */}
        <div className="absolute top-[20%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-cyan-500/10 blur-[130px] animate-float-2" />
        <div className="absolute bottom-[10%] left-[5%] w-[50vw] h-[50vw] rounded-full bg-fuchsia-600/5 blur-[150px] animate-float-1" style={{ animationDelay: '-9s' }} />
      </div>
    )
  }

  return null
}
