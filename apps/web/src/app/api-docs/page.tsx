'use client';

import { useEffect, useState } from 'react';

/**
 * API Documentation Page
 * 
 * Displays the OpenAPI/Swagger documentation using Swagger UI.
 * This page loads the OpenAPI specification and renders it using Swagger UI React component.
 */
export default function ApiDocsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Swagger UI dynamically
    const loadSwaggerUI = async () => {
      try {
        // Check if Swagger UI is already loaded
        if (typeof window !== 'undefined' && (window as any).SwaggerUIBundle) {
          setIsLoading(false);
          return;
        }

        // Load Swagger UI CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css';
        document.head.appendChild(link);

        // Load Swagger UI JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-bundle.js';
        script.async = true;
        script.onload = () => {
          setIsLoading(false);
          initializeSwaggerUI();
        };
        script.onerror = () => {
          setError('Failed to load Swagger UI');
          setIsLoading(false);
        };
        document.body.appendChild(script);
      } catch (err) {
        setError('Failed to initialize Swagger UI');
        setIsLoading(false);
      }
    };

    const initializeSwaggerUI = () => {
      if (typeof window === 'undefined' || !(window as any).SwaggerUIBundle) {
        return;
      }

      const SwaggerUIBundle = (window as any).SwaggerUIBundle;
      const SwaggerUIStandalonePreset = (window as any).SwaggerUIStandalonePreset;

      SwaggerUIBundle({
        url: '/docs/api/openapi.yaml',
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: 'StandaloneLayout',
        deepLinking: true,
        displayRequestDuration: true,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
      });
    };

    loadSwaggerUI();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">API Documentation</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600">
            Please check your internet connection or view the documentation directly at{' '}
            <a 
              href="/docs/api/openapi.yaml" 
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              /docs/api/openapi.yaml
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {isLoading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading API Documentation...</p>
          </div>
        </div>
      )}
      <div id="swagger-ui" className={isLoading ? 'hidden' : ''}></div>
    </div>
  );
}

