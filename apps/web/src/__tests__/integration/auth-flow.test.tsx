import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/lib/auth-context'
import LoginPage from '@/app/auth/login/page'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Supabase
const mockSignIn = jest.fn()
const mockSignUp = jest.fn()
const mockSignOut = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithOAuth: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}))

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('handles successful login', async () => {
    mockSignIn.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    })

    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    )
    
    // Fill in login form
    const emailInput = screen.getByPlaceholderText('กรอกอีเมลของคุณ')
    const passwordInput = screen.getByPlaceholderText('กรอกรหัสผ่านของคุณ')
    const loginButton = screen.getByText('เข้าสู่ระบบ')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('handles login error', async () => {
    mockSignIn.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid credentials' },
    })

    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    )
    
    // Fill in login form
    const emailInput = screen.getByPlaceholderText('กรอกอีเมลของคุณ')
    const passwordInput = screen.getByPlaceholderText('กรอกรหัสผ่านของคุณ')
    const loginButton = screen.getByText('เข้าสู่ระบบ')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('validates required fields', async () => {
    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    )
    
    const loginButton = screen.getByText('เข้าสู่ระบบ')
    fireEvent.click(loginButton)

    // Should not call signIn with empty fields
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it('shows loading state during login', async () => {
    mockSignIn.mockImplementationOnce(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )

    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    )
    
    const emailInput = screen.getByPlaceholderText('กรอกอีเมลของคุณ')
    const passwordInput = screen.getByPlaceholderText('กรอกรหัสผ่านของคุณ')
    const loginButton = screen.getByText('เข้าสู่ระบบ')

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(loginButton)

    expect(screen.getByText('กำลังเข้าสู่ระบบ...')).toBeInTheDocument()
  })

  it('handles Google OAuth login', async () => {
    const mockSignInWithOAuth = jest.fn()
    jest.doMock('@/lib/supabase/client', () => ({
      supabase: {
        auth: {
          signInWithPassword: mockSignIn,
          signUp: mockSignUp,
          signOut: mockSignOut,
          getSession: jest.fn(),
          onAuthStateChange: jest.fn(),
          signInWithOAuth: mockSignInWithOAuth,
          resetPasswordForEmail: jest.fn(),
          updateUser: jest.fn(),
        },
      },
    }))

    mockSignInWithOAuth.mockResolvedValueOnce({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      error: null,
    })

    render(
      <TestWrapper>
        <LoginPage />
      </TestWrapper>
    )
    
    const googleButton = screen.getByText('Google')
    fireEvent.click(googleButton)

    await waitFor(() => {
      expect(mockSignInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'http://localhost:3000/dashboard',
        },
      })
    })
  })
})
