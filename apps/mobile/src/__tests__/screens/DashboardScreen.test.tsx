import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardScreen from '../../screens/DashboardScreen'
import { useAuth } from '../../contexts/AuthContext'

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
}

// Mock useAuth
jest.mock('../../contexts/AuthContext')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock businessCards service
jest.mock('../../services/supabase', () => ({
  businessCards: {
    getAll: jest.fn(),
    delete: jest.fn(),
  },
}))

const mockCards = [
  {
    id: 'card-1',
    name: 'John Doe',
    job_title: 'Software Engineer',
    company: 'Tech Corp',
    phone: '+1234567890',
    email: 'john@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'card-2',
    name: 'Jane Smith',
    job_title: 'Designer',
    company: 'Design Co',
    phone: '+0987654321',
    email: 'jane@example.com',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

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
      {children}
    </QueryClientProvider>
  )
}

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' },
      isAuthenticated: true,
      isLoading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithGoogle: jest.fn(),
      signInWithLinkedIn: jest.fn(),
    })
  })

  it('renders loading state', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithGoogle: jest.fn(),
      signInWithLinkedIn: jest.fn(),
    })

    render(
      <TestWrapper>
        <DashboardScreen navigation={mockNavigation} />
      </TestWrapper>
    )
    
    expect(screen.getByText('กำลังโหลด...')).toBeOnTheScreen()
  })

  it('renders empty state when no cards', () => {
    const { businessCards } = require('../../services/supabase')
    businessCards.getAll.mockResolvedValue([])

    render(
      <TestWrapper>
        <DashboardScreen navigation={mockNavigation} />
      </TestWrapper>
    )
    
    expect(screen.getByText('ยังไม่มีนามบัตร')).toBeOnTheScreen()
    expect(screen.getByText('เริ่มต้นสร้างนามบัตรดิจิทัลของคุณ')).toBeOnTheScreen()
  })

  it('renders cards list', async () => {
    const { businessCards } = require('../../services/supabase')
    businessCards.getAll.mockResolvedValue(mockCards)

    render(
      <TestWrapper>
        <DashboardScreen navigation={mockNavigation} />
      </TestWrapper>
    )
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeOnTheScreen()
      expect(screen.getByText('Software Engineer')).toBeOnTheScreen()
      expect(screen.getByText('Tech Corp')).toBeOnTheScreen()
      expect(screen.getByText('Jane Smith')).toBeOnTheScreen()
      expect(screen.getByText('Designer')).toBeOnTheScreen()
    })
  })

  it('navigates to card editor when add button is pressed', () => {
    const { businessCards } = require('../../services/supabase')
    businessCards.getAll.mockResolvedValue([])

    render(
      <TestWrapper>
        <DashboardScreen navigation={mockNavigation} />
      </TestWrapper>
    )
    
    const addButton = screen.getByText('สร้างนามบัตรใหม่')
    fireEvent.press(addButton)
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('CardEditor')
  })

  it('navigates to card editor when edit button is pressed', async () => {
    const { businessCards } = require('../../services/supabase')
    businessCards.getAll.mockResolvedValue(mockCards)

    render(
      <TestWrapper>
        <DashboardScreen navigation={mockNavigation} />
      </TestWrapper>
    )
    
    await waitFor(() => {
      const editButtons = screen.getAllByTestId('edit-button')
      fireEvent.press(editButtons[0])
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith('CardEditor', {
        card: mockCards[0],
      })
    })
  })

  it('shows delete confirmation and deletes card', async () => {
    const { businessCards } = require('../../services/supabase')
    businessCards.getAll.mockResolvedValue(mockCards)
    businessCards.delete.mockResolvedValue(true)

    // Mock Alert
    const mockAlert = jest.spyOn(require('react-native'), 'Alert')
    mockAlert.alert = jest.fn((title, message, buttons) => {
      if (buttons && buttons[1]) {
        buttons[1].onPress()
      }
    })

    render(
      <TestWrapper>
        <DashboardScreen navigation={mockNavigation} />
      </TestWrapper>
    )
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByTestId('delete-button')
      fireEvent.press(deleteButtons[0])
      
      expect(mockAlert.alert).toHaveBeenCalledWith(
        'ยืนยันการลบ',
        'คุณต้องการลบนามบัตรนี้หรือไม่?',
        expect.any(Array)
      )
    })

    mockAlert.alert.mockRestore()
  })

  it('handles delete error', async () => {
    const { businessCards } = require('../../services/supabase')
    businessCards.getAll.mockResolvedValue(mockCards)
    businessCards.delete.mockRejectedValue(new Error('Delete failed'))

    // Mock Alert
    const mockAlert = jest.spyOn(require('react-native'), 'Alert')
    mockAlert.alert = jest.fn((title, message, buttons) => {
      if (buttons && buttons[1]) {
        buttons[1].onPress()
      }
    })

    render(
      <TestWrapper>
        <DashboardScreen navigation={mockNavigation} />
      </TestWrapper>
    )
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByTestId('delete-button')
      fireEvent.press(deleteButtons[0])
    })

    await waitFor(() => {
      expect(mockAlert.alert).toHaveBeenCalledWith(
        'ข้อผิดพลาด',
        'ไม่สามารถลบนามบัตรได้'
      )
    })

    mockAlert.alert.mockRestore()
  })

  it('refreshes data when pull to refresh', async () => {
    const { businessCards } = require('../../services/supabase')
    businessCards.getAll.mockResolvedValue(mockCards)

    render(
      <TestWrapper>
        <DashboardScreen navigation={mockNavigation} />
      </TestWrapper>
    )
    
    await waitFor(() => {
      const flatList = screen.getByTestId('cards-list')
      fireEvent(flatList, 'onRefresh')
    })

    expect(businessCards.getAll).toHaveBeenCalledTimes(2)
  })
})
