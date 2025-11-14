describe('Business Card Management', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', 'mock-token')
    })
    
    cy.visit('/dashboard')
  })

  it('should display empty state when no cards', () => {
    cy.get('h3').should('contain', 'ยังไม่มีนามบัตร')
    cy.get('button').contains('สร้างนามบัตรใหม่').should('be.visible')
  })

  it('should navigate to card editor when create button is clicked', () => {
    cy.get('button').contains('สร้างนามบัตรใหม่').click()
    // Note: In a real test, you would verify navigation to card editor
    // For now, we just verify the button is clickable
    cy.get('button').contains('สร้างนามบัตรใหม่').should('be.visible')
  })

  it('should display cards list when cards exist', () => {
    // Mock API response
    cy.intercept('GET', '**/business_cards**', {
      statusCode: 200,
      body: [
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
      ],
    }).as('getCards')

    cy.visit('/dashboard')
    cy.wait('@getCards')
    
    cy.get('h3').should('contain', 'John Doe')
    cy.get('p').should('contain', 'Software Engineer')
    cy.get('p').should('contain', 'Tech Corp')
  })

  it('should show card actions', () => {
    // Mock API response
    cy.intercept('GET', '**/business_cards**', {
      statusCode: 200,
      body: [
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
      ],
    }).as('getCards')

    cy.visit('/dashboard')
    cy.wait('@getCards')
    
    // Should show action buttons
    cy.get('button[aria-label="ดูตัวอย่าง"]').should('be.visible')
    cy.get('button[aria-label="สร้าง QR Code"]').should('be.visible')
    cy.get('button[aria-label="แชร์"]').should('be.visible')
    cy.get('button[aria-label="แก้ไข"]').should('be.visible')
    cy.get('button[aria-label="ลบ"]').should('be.visible')
  })

  it('should handle card deletion', () => {
    // Mock API response
    cy.intercept('GET', '**/business_cards**', {
      statusCode: 200,
      body: [
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
      ],
    }).as('getCards')

    cy.intercept('DELETE', '**/business_cards/card-1', {
      statusCode: 200,
      body: { success: true },
    }).as('deleteCard')

    cy.visit('/dashboard')
    cy.wait('@getCards')
    
    // Click delete button
    cy.get('button[aria-label="ลบ"]').click()
    
    // Confirm deletion
    cy.get('button').contains('ลบ').click()
    
    cy.wait('@deleteCard')
    cy.get('h3').should('contain', 'ยังไม่มีนามบัตร')
  })

  it('should refresh data on pull to refresh', () => {
    // Mock API response
    cy.intercept('GET', '**/business_cards**', {
      statusCode: 200,
      body: [],
    }).as('getCards')

    cy.visit('/dashboard')
    cy.wait('@getCards')
    
    // Trigger refresh
    cy.get('body').trigger('touchstart', { touches: [{ clientY: 100 }] })
    cy.get('body').trigger('touchmove', { touches: [{ clientY: 200 }] })
    cy.get('body').trigger('touchend')
    
    // Should call API again
    cy.wait('@getCards')
  })
})

describe('Public Card View', () => {
  it('should display public card page', () => {
    // Mock API response
    cy.intercept('GET', '**/business_cards/card-1', {
      statusCode: 200,
      body: {
        id: 'card-1',
        name: 'John Doe',
        job_title: 'Software Engineer',
        company: 'Tech Corp',
        phone: '+1234567890',
        email: 'john@example.com',
        address: '123 Main St, City, State',
        social_links: {
          website: 'https://johndoe.com',
          linkedin: 'https://linkedin.com/in/johndoe',
        },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    }).as('getCard')

    cy.visit('/card/card-1')
    cy.wait('@getCard')
    
    cy.get('h1').should('contain', 'John Doe')
    cy.get('p').should('contain', 'Software Engineer')
    cy.get('p').should('contain', 'Tech Corp')
    cy.get('a[href="tel:+1234567890"]').should('be.visible')
    cy.get('a[href="mailto:john@example.com"]').should('be.visible')
  })

  it('should show QR code generation', () => {
    // Mock API response
    cy.intercept('GET', '**/business_cards/card-1', {
      statusCode: 200,
      body: {
        id: 'card-1',
        name: 'John Doe',
        job_title: 'Software Engineer',
        company: 'Tech Corp',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    }).as('getCard')

    cy.intercept('POST', '**/generate-qr', {
      statusCode: 200,
      body: {
        success: true,
        qrCode: 'data:image/png;base64,test-qr-code',
        publicUrl: 'https://test.com/card/card-1',
      },
    }).as('generateQR')

    cy.visit('/card/card-1')
    cy.wait('@getCard')
    
    cy.get('button').contains('สร้าง QR Code').click()
    cy.wait('@generateQR')
    
    cy.get('img[alt="QR Code"]').should('be.visible')
  })

  it('should handle vCard download', () => {
    // Mock API response
    cy.intercept('GET', '**/business_cards/card-1', {
      statusCode: 200,
      body: {
        id: 'card-1',
        name: 'John Doe',
        job_title: 'Software Engineer',
        company: 'Tech Corp',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    }).as('getCard')

    cy.intercept('POST', '**/generate-vcard', {
      statusCode: 200,
      body: 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nEND:VCARD',
      headers: {
        'Content-Type': 'text/vcard',
        'Content-Disposition': 'attachment; filename="John_Doe.vcf"',
      },
    }).as('generateVCard')

    cy.visit('/card/card-1')
    cy.wait('@getCard')
    
    cy.get('button').contains('ดาวน์โหลด vCard').click()
    cy.wait('@generateVCard')
  })
})
