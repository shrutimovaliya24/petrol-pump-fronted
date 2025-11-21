'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Cookies from 'js-cookie'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored user data
    const userData = Cookies.get('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('Error parsing user data:', error)
        Cookies.remove('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password, role) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
        role,
      })

      if (response.data.success) {
        const userData = response.data.data
        setUser(userData)
        Cookies.set('user', JSON.stringify(userData), { expires: 7 })
        return { success: true, data: userData }
      } else {
        return { success: false, message: response.data.message || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.',
      }
    }
  }

  const logout = () => {
    setUser(null)
    Cookies.remove('user')
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}







