# API Documentation

This directory contains the API documentation for the e-BizCard platform.

## OpenAPI Specification

The main API documentation is provided in OpenAPI 3.0 format:

- **`openapi.yaml`** - Complete OpenAPI 3.0 specification

## Viewing the Documentation

### Option 1: Swagger UI (Recommended)

1. Install Swagger UI:
   ```bash
   npm install -g swagger-ui-serve
   ```

2. Serve the documentation:
   ```bash
   swagger-ui-serve docs/api/openapi.yaml
   ```

   Or use npx:
   ```bash
   npx swagger-ui-serve docs/api/openapi.yaml
   ```

3. Open your browser to `http://localhost:3001`

### Option 2: Online Swagger Editor

1. Go to https://editor.swagger.io/
2. Copy the contents of `openapi.yaml`
3. Paste into the editor

### Option 3: Redoc

1. Install Redoc CLI:
   ```bash
   npm install -g redoc-cli
   ```

2. Generate HTML documentation:
   ```bash
   redoc-cli build docs/api/openapi.yaml -o docs/api/api-docs.html
   ```

3. Open `docs/api/api-docs.html` in your browser

## API Endpoints Overview

### Profile Management
- `POST /api/update-profile` - Update user profile
- `POST /api/get-profile` - Get user profile
- `POST /api/update-addresses` - Update user addresses

### Business Cards
- `POST /api/generate-vcard` - Generate vCard file
- `POST /api/card-views` - Track card view

### QR Code
- `POST /api/generate-qr` - Generate QR code

### Contact
- `POST /api/contact` - Send contact form message

### Templates
- `GET /api/templates` - Get all templates

## Authentication

Most endpoints require authentication using one of the following methods:

1. **Bearer Token** - JWT token from Supabase authentication
   ```
   Authorization: Bearer <token>
   ```

2. **Service Role Key** - For admin operations (server-side only)
   ```
   Authorization: Bearer <service_role_key>
   ```

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "error": "Error message",
  "message": "Detailed error message",
  "details": "Additional error details"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `500` - Internal Server Error

## Rate Limiting

API endpoints may be rate-limited in production. Check response headers for rate limit information:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Time when limit resets

## Examples

See the OpenAPI specification file for detailed request/response examples for each endpoint.

## Contributing

When adding new API endpoints:

1. Update `openapi.yaml` with the new endpoint specification
2. Add JSDoc comments to the route handler
3. Include request/response examples
4. Document authentication requirements
5. List possible error responses

