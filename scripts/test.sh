#!/bin/bash

# Test script for e-BizCard
set -e

echo "🧪 Running e-BizCard Tests..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version: $(node -v)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Run type checking
echo ""
echo "🔍 Running TypeScript type checking..."
npm run type-check
print_status "TypeScript type checking passed"

# Run linting
echo ""
echo "🔍 Running ESLint..."
npm run lint
print_status "ESLint passed"

# Run web app tests
echo ""
echo "🧪 Running Web App Tests..."
cd apps/web
if [ ! -d "node_modules" ]; then
    npm install
fi

# Install test dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom

# Run tests
npm test -- --coverage --watchAll=false
print_status "Web app tests passed"

# Run mobile app tests
echo ""
echo "🧪 Running Mobile App Tests..."
cd ../mobile
if [ ! -d "node_modules" ]; then
    npm install
fi

# Install test dependencies
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo

# Run tests
npm test -- --coverage --watchAll=false
print_status "Mobile app tests passed"

# Run E2E tests (if Cypress is installed)
echo ""
echo "🌐 Running E2E Tests..."
cd ../web
if [ -d "node_modules/cypress" ]; then
    # Install Cypress if not already installed
    if ! command -v npx cypress &> /dev/null; then
        npm install --save-dev cypress
    fi
    
    # Run Cypress tests
    npx cypress run --headless
    print_status "E2E tests passed"
else
    print_warning "Cypress not installed. Skipping E2E tests."
    print_warning "To install: npm install --save-dev cypress"
fi

# Run build tests
echo ""
echo "🏗️  Running Build Tests..."
cd ../web
npm run build
print_status "Web app build successful"

cd ../mobile
npm run build:android
print_status "Mobile app Android build successful"

# Run API tests (if available)
echo ""
echo "🔌 Running API Tests..."
cd ../api
if [ -f "package.json" ]; then
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    # Run API tests
    npm test -- --watchAll=false
    print_status "API tests passed"
else
    print_warning "API tests not configured. Skipping API tests."
fi

# Summary
echo ""
echo "🎉 All tests completed successfully!"
echo ""
echo "📊 Test Summary:"
echo "  ✅ TypeScript type checking"
echo "  ✅ ESLint linting"
echo "  ✅ Web app unit tests"
echo "  ✅ Mobile app unit tests"
echo "  ✅ Web app build test"
echo "  ✅ Mobile app build test"
echo "  ✅ E2E tests (if available)"
echo "  ✅ API tests (if available)"
echo ""
echo "🚀 Ready for deployment!"
