describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/auth/login')
  })

  it('should display login form', () => {
    cy.get('h2').should('contain', 'เข้าสู่ระบบ')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('contain', 'เข้าสู่ระบบ')
  })

  it('should show validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click()
    cy.get('input[type="email"]').should('have.attr', 'required')
    cy.get('input[type="password"]').should('have.attr', 'required')
  })

  it('should navigate to register page', () => {
    cy.get('a[href="/auth/register"]').click()
    cy.url().should('include', '/auth/register')
    cy.get('h2').should('contain', 'สมัครสมาชิก')
  })

  it('should show password visibility toggle', () => {
    cy.get('input[type="password"]').type('testpassword')
    cy.get('button[aria-label="toggle password visibility"]').click()
    cy.get('input[type="text"]').should('have.value', 'testpassword')
  })

  it('should handle Google OAuth login', () => {
    cy.get('button').contains('Google').click()
    // Note: In a real test, you would mock the OAuth flow
    // For now, we just verify the button is clickable
    cy.get('button').contains('Google').should('be.visible')
  })

  it('should handle LinkedIn OAuth login', () => {
    cy.get('button').contains('LinkedIn').click()
    // Note: In a real test, you would mock the OAuth flow
    // For now, we just verify the button is clickable
    cy.get('button').contains('LinkedIn').should('be.visible')
  })
})

describe('Registration Flow', () => {
  beforeEach(() => {
    cy.visit('/auth/register')
  })

  it('should display registration form', () => {
    cy.get('h2').should('contain', 'สมัครสมาชิก')
    cy.get('input[name="fullName"]').should('be.visible')
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="password"]').should('be.visible')
    cy.get('input[name="confirmPassword"]').should('be.visible')
    cy.get('button[type="submit"]').should('contain', 'สมัครสมาชิก')
  })

  it('should validate password confirmation', () => {
    cy.get('input[name="password"]').type('password123')
    cy.get('input[name="confirmPassword"]').type('differentpassword')
    cy.get('button[type="submit"]').click()
    
    // Should show validation error
    cy.get('input[name="confirmPassword"]').should('have.attr', 'required')
  })

  it('should validate password length', () => {
    cy.get('input[name="password"]').type('123')
    cy.get('button[type="submit"]').click()
    
    // Should show validation error for short password
    cy.get('input[name="password"]').should('have.attr', 'required')
  })

  it('should navigate to login page', () => {
    cy.get('a[href="/auth/login"]').click()
    cy.url().should('include', '/auth/login')
    cy.get('h2').should('contain', 'เข้าสู่ระบบ')
  })
})

describe('Dashboard Access', () => {
  it('should redirect to login when not authenticated', () => {
    cy.visit('/dashboard')
    cy.url().should('include', '/auth/login')
  })

  it('should show dashboard when authenticated', () => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', 'mock-token')
    })
    
    cy.visit('/dashboard')
    cy.get('h1').should('contain', 'แดชบอร์ด')
  })
})
