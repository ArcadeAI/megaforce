"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiClient, User, LoginRequest, RegisterRequest } from './api-client'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing token and load user on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Only try to get current user if we have a token
        const token = localStorage.getItem('token')
        if (token) {
          const currentUser = await apiClient.getCurrentUser()
          setUser(currentUser)
        }
      } catch (error) {
        // Token might be invalid or expired - silently clear it
        console.log('Authentication check failed, clearing token')
        apiClient.logout()
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (credentials: LoginRequest) => {
    setLoading(true)
    try {
      // Login and get token
      await apiClient.login(credentials)
      // Fetch user data after successful login
      const currentUser = await apiClient.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: RegisterRequest) => {
    setLoading(true)
    try {
      // Register user
      await apiClient.register(userData)
      // Registration successful, now log them in automatically
      await apiClient.login({ username: userData.username, password: userData.password })
      // Fetch user data after successful login
      const currentUser = await apiClient.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    apiClient.logout()
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
