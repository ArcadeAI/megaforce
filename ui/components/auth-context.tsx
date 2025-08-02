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
        const currentUser = await apiClient.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        // Token might be invalid or expired
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
      const response = await apiClient.login(credentials)
      setUser(response.user)
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: RegisterRequest) => {
    setLoading(true)
    try {
      const response = await apiClient.register(userData)
      setUser(response.user)
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
