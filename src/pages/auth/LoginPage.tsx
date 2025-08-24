import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { OAuthButtons } from '@/components/auth/OAuthButtons'
import { useAuthStore } from '@/stores/authStore'
import { LoginCredentials } from '@/types/auth'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, isAuthenticated, error } = useAuthStore()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data)
      // Navigation will happen automatically via the store
    } catch (error) {
      // Error handling is done in the store
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your ControlVector account"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-cv-orange-400 mb-2">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className={`
              appearance-none relative block w-full px-3 py-3 border rounded-lg
              bg-cv-dark-800 text-white placeholder-cv-dark-300 focus:outline-none focus:ring-2 focus:ring-offset-2
              focus:ring-cv-orange-500 focus:border-cv-orange-500 focus:z-10 sm:text-sm
              transition-colors duration-200 focus:bg-cv-dark-700
              ${errors.email 
                ? 'border-red-400 focus:ring-red-500 focus:border-red-500' 
                : 'border-cv-dark-600'
              }
            `}
            placeholder="you@controlvector.dev"
          />
          {errors.email && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-600"
            >
              {errors.email.message}
            </motion.p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-cv-orange-400 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              className={`
                appearance-none relative block w-full px-3 py-3 pr-10 border rounded-lg
                bg-cv-dark-800 text-white placeholder-cv-dark-300 focus:outline-none focus:ring-2 focus:ring-offset-2
                focus:ring-cv-orange-500 focus:border-cv-orange-500 focus:z-10 sm:text-sm
                transition-colors duration-200 focus:bg-cv-dark-700
                ${errors.password 
                  ? 'border-red-400 focus:ring-red-500 focus:border-red-500' 
                  : 'border-cv-dark-600'
                }
              `}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-cv-dark-300 hover:text-cv-orange-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-cv-dark-300 hover:text-cv-orange-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-sm text-red-600"
            >
              {errors.password.message}
            </motion.p>
          )}
        </div>

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-cv-orange-500 focus:ring-cv-orange-500 border-cv-dark-600 rounded bg-cv-dark-800"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-cv-dark-100">
              Remember me
            </label>
          </div>

          <Link
            to="/auth/forgot-password"
            className="text-sm text-cv-orange-400 hover:text-cv-orange-300 font-medium transition-colors duration-200"
          >
            Forgot password?
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`
            group relative w-full flex justify-center py-3 px-4 border border-transparent
            text-sm font-medium rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-offset-2
            focus:ring-cv-orange-500 transition-all duration-200 cv-button
            ${isLoading 
              ? 'bg-cv-orange-400 cursor-not-allowed opacity-50' 
              : 'bg-gradient-to-r from-cv-orange-600 to-cv-orange-500 hover:from-cv-orange-700 hover:to-cv-orange-600 shadow-md hover:shadow-xl'
            }
          `}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </motion.button>
      </form>

      {/* Divider */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-cv-dark-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-cv-dark-900 text-cv-dark-300">Or continue with</span>
          </div>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="mt-6">
        <OAuthButtons />
      </div>

      {/* Sign up link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-cv-dark-200">
          Don't have an account?{' '}
          <Link
            to="/auth/signup"
            className="font-medium text-cv-orange-400 hover:text-cv-orange-300 transition-colors duration-200"
          >
            Sign up for free
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}