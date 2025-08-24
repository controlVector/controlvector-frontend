import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { MatrixRain } from '../ui/MatrixRain'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cv-dark-900 via-cv-dark-800 to-cv-dark-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Matrix Rain Background Effect */}
      <MatrixRain intensity="low" color="orange" className="opacity-20" />
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Logo */}
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-cv-orange-600 to-cv-orange-500 rounded-2xl flex items-center justify-center mb-8 shadow-2xl cv-orange-glow">
            <div className="text-2xl font-black text-white">
              CV
            </div>
          </div>
          
          {/* Brand */}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cv-orange-400 to-cv-orange-600 bg-clip-text text-transparent">
            ControlVector
          </h1>
          <p className="text-sm text-cv-matrix-green mt-2 cv-matrix-text">
            AI Infrastructure Management
          </p>
        </motion.div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-cv-dark-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-cv-orange-500/30 cv-card"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white text-center">
              {title}
            </h2>
            <p className="mt-2 text-sm text-cv-dark-200 text-center">
              {subtitle}
            </p>
          </div>
          
          {children}
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-8 text-center relative z-10"
      >
        <p className="text-xs text-cv-dark-300">
          © 2025 ControlVector. Built for production infrastructure management.
        </p>
      </motion.div>
    </div>
  )
}