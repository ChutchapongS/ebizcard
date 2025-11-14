import { Template } from '@/types/theme-customization';

export const SAMPLE_TEMPLATES: Template[] = [
  {
    id: 'template-1',
    name: 'Classic Business Card',
    paper: {
      size: 'A4',
      width: 794,
      height: 1123,
      orientation: 'portrait',
      background: {
        type: 'color',
        color: '#ffffff'
      }
    },
    elements: [
      {
        id: 'name-1',
        type: 'text',
        field: 'name',
        x: 50,
        y: 100,
        width: 300,
        height: 40,
        style: {
          fontSize: 24,
          fontWeight: 'bold',
          color: '#1f2937',
          textAlign: 'left'
        }
      },
      {
        id: 'position-1',
        type: 'text',
        field: 'position',
        x: 50,
        y: 150,
        width: 300,
        height: 30,
        style: {
          fontSize: 16,
          fontWeight: 'normal',
          color: '#6b7280',
          textAlign: 'left'
        }
      },
      {
        id: 'email-1',
        type: 'text',
        field: 'email',
        x: 50,
        y: 200,
        width: 300,
        height: 30,
        style: {
          fontSize: 14,
          fontWeight: 'normal',
          color: '#374151',
          textAlign: 'left'
        }
      },
      {
        id: 'phone-1',
        type: 'text',
        field: 'phone',
        x: 50,
        y: 230,
        width: 300,
        height: 30,
        style: {
          fontSize: 14,
          fontWeight: 'normal',
          color: '#374151',
          textAlign: 'left'
        }
      },
      {
        id: 'logo-1',
        type: 'picture' as const,
        field: 'companyLogo',
        x: 400,
        y: 100,
        width: 100,
        height: 100,
        style: {
          backgroundColor: '#f3f4f6',
          border: {
            width: 1,
            color: '#d1d5db',
            radius: 8
          }
        }
      }
    ],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'template-2',
    name: 'Modern Card',
    paper: {
      size: 'A4',
      width: 794,
      height: 1123,
      orientation: 'portrait',
      background: {
        type: 'color',
        color: '#f8fafc'
      }
    },
    elements: [
      {
        id: 'name-2',
        type: 'text',
        field: 'name',
        x: 100,
        y: 200,
        width: 400,
        height: 50,
        style: {
          fontSize: 28,
          fontWeight: 'bold',
          color: '#1e40af',
          textAlign: 'center'
        }
      },
      {
        id: 'description-2',
        type: 'textarea',
        field: 'description',
        x: 100,
        y: 270,
        width: 400,
        height: 80,
        style: {
          fontSize: 16,
          fontWeight: 'normal',
          color: '#4b5563',
          textAlign: 'center',
          backgroundColor: '#e0e7ff',
          padding: 15,
          border: {
            width: 0,
            color: '#3b82f6',
            radius: 12
          }
        }
      },
      {
        id: 'contact-2',
        type: 'text',
        field: 'email',
        x: 100,
        y: 380,
        width: 400,
        height: 30,
        style: {
          fontSize: 14,
          fontWeight: 'normal',
          color: '#6b7280',
          textAlign: 'center'
        }
      }
    ],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02')
  }
];
