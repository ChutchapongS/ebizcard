import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QRCodeGenerator } from '@/components/QRCodeGenerator'

// Mock fetch
global.fetch = jest.fn()

describe('QRCodeGenerator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders generate button initially', () => {
    render(<QRCodeGenerator cardId="test-card-1" cardName="John Doe" />)
    
    expect(screen.getByText('สร้าง QR Code')).toBeInTheDocument()
    expect(screen.getByText('QR Code Image')).toBeInTheDocument()
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

    render(<QRCodeGenerator cardId="test-card-1" cardName="John Doe" />)
    
    const generateButton = screen.getByText('สร้าง QR Code')
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: 'test-card-1' }),
      })
    })
    
    expect(screen.getByText('สแกนเพื่อดูนามบัตรดิจิทัล')).toBeInTheDocument()
  })

  it('shows loading state during generation', async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(resolve, 100))
    )

    render(<QRCodeGenerator cardId="test-card-1" cardName="John Doe" />)
    
    const generateButton = screen.getByText('สร้าง QR Code')
    fireEvent.click(generateButton)
    
    expect(screen.getByText('กำลังสร้าง...')).toBeInTheDocument()
  })

  it('handles generation error', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    render(<QRCodeGenerator cardId="test-card-1" cardName="John Doe" />)
    
    const generateButton = screen.getByText('สร้าง QR Code')
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Error generating QR code:',
        expect.any(Error)
      )
    })
  })

  it('downloads QR code when download button is clicked', async () => {
    const mockResponse = {
      success: true,
      qrCode: 'data:image/png;base64,test-qr-code',
      publicUrl: 'https://test.com/card/test-card-1',
    }
    
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['test'], { type: 'image/png' })),
      })

    // Mock URL methods
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

    render(<QRCodeGenerator cardId="test-card-1" cardName="John Doe" />)
    
    // Generate QR code first
    const generateButton = screen.getByText('สร้าง QR Code')
    fireEvent.click(generateButton)
    
    await waitFor(() => {
      expect(screen.getByText('ดาวน์โหลด')).toBeInTheDocument()
    })
    
    // Download QR code
    const downloadButton = screen.getByText('ดาวน์โหลด')
    fireEvent.click(downloadButton)
    
    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled()
      expect(mockClick).toHaveBeenCalled()
    })
  })

  it('copies URL to clipboard', async () => {
    const mockWriteText = jest.fn()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
    })

    render(<QRCodeGenerator cardId="test-card-1" cardName="John Doe" />)
    
    const copyButton = screen.getByRole('button', { name: '' })
    fireEvent.click(copyButton)
    
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('http://localhost:3000/card/test-card-1')
    })
  })

  it('shows copied state after copying', async () => {
    const mockWriteText = jest.fn()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
    })

    render(<QRCodeGenerator cardId="test-card-1" cardName="John Doe" />)
    
    const copyButton = screen.getByRole('button', { name: '' })
    fireEvent.click(copyButton)
    
    await waitFor(() => {
      expect(screen.getByText('คัดลอกลิงก์เรียบร้อยแล้ว')).toBeInTheDocument()
    })
  })
})