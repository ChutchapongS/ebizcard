import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CardView } from '@/components/card/CardView'

const mockCard = {
  id: 'test-card-1',
  name: 'John Doe',
  job_title: 'Software Engineer',
  company: 'Tech Corp',
  phone: '+1234567890',
  email: 'john@example.com',
  address: '123 Main St, City, State',
  social_links: {
    website: 'https://johndoe.com',
    linkedin: 'https://linkedin.com/in/johndoe',
    twitter: 'https://twitter.com/johndoe',
  },
  theme: 'default',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// Mock fetch
global.fetch = jest.fn()

describe('CardView Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders card information correctly', () => {
    render(<CardView card={mockCard} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Tech Corp')).toBeInTheDocument()
    expect(screen.getByText('+1234567890')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('renders social links', () => {
    render(<CardView card={mockCard} />)
    
    expect(screen.getByText('website')).toBeInTheDocument()
    expect(screen.getByText('linkedin')).toBeInTheDocument()
    expect(screen.getByText('twitter')).toBeInTheDocument()
  })

  it('handles missing optional fields gracefully', () => {
    const cardWithoutOptional = {
      ...mockCard,
      job_title: undefined,
      company: undefined,
      phone: undefined,
      email: undefined,
      address: undefined,
      social_links: {},
    }
    
    render(<CardView card={cardWithoutOptional} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument()
  })

  it('generates QR code when button is clicked', async () => {
    const mockResponse = {
      success: true,
      qrCode: 'data:image/png;base64,test-qr-code',
      publicUrl: 'https://test.com/card/test-card-1',
    }
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    render(<CardView card={mockCard} />)
    
    const qrButton = screen.getByText('สร้าง QR Code')
    fireEvent.click(qrButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: 'test-card-1' }),
      })
    })
  })

  it('handles QR code generation error', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(<CardView card={mockCard} />)
    
    const qrButton = screen.getByText('สร้าง QR Code')
    fireEvent.click(qrButton)
    
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Error generating QR code:',
        expect.any(Error)
      )
    })
  })

  it('downloads vCard when button is clicked', async () => {
    const mockBlob = new Blob(['BEGIN:VCARD...'], { type: 'text/vcard' })
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    })

    // Mock URL.createObjectURL and document methods
    const mockCreateObjectURL = jest.fn(() => 'blob:mock-url')
    const mockRevokeObjectURL = jest.fn()
    const mockClick = jest.fn()
    const mockAppendChild = jest.fn()
    const mockRemoveChild = jest.fn()

    global.URL.createObjectURL = mockCreateObjectURL
    global.URL.revokeObjectURL = mockRevokeObjectURL
    Object.defineProperty(document, 'createElement', {
      value: () => ({
        href: '',
        download: '',
        click: mockClick,
      }),
    })
    Object.defineProperty(document.body, 'appendChild', {
      value: mockAppendChild,
    })
    Object.defineProperty(document.body, 'removeChild', {
      value: mockRemoveChild,
    })

    render(<CardView card={mockCard} />)
    
    const vCardButton = screen.getByText('ดาวน์โหลด vCard')
    fireEvent.click(vCardButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/generate-vcard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: 'test-card-1' }),
      })
    })
  })

  it('handles share functionality', async () => {
    const mockShare = jest.fn()
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true,
    })

    render(<CardView card={mockCard} />)
    
    const shareButton = screen.getByText('แชร์นามบัตร')
    fireEvent.click(shareButton)
    
    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: 'นามบัตรดิจิทัล - John Doe',
        text: 'ดูนามบัตรดิจิทัลของ John Doe',
        url: window.location.href,
      })
    })
  })

  it('falls back to clipboard when share is not available', async () => {
    const mockWriteText = jest.fn()
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      writable: true,
    })
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
    })

    // Mock alert
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {})

    render(<CardView card={mockCard} />)
    
    const shareButton = screen.getByText('แชร์นามบัตร')
    fireEvent.click(shareButton)
    
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(window.location.href)
      expect(mockAlert).toHaveBeenCalledWith('คัดลอกลิงก์เรียบร้อยแล้ว')
    })

    mockAlert.mockRestore()
  })
})
