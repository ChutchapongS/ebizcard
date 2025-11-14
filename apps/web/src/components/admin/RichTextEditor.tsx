'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor = ({ value, onChange, placeholder }: RichTextEditorProps) => {
  const quillRef = useRef<any>(null);

  // Custom toolbar configuration
  const modules = {
    toolbar: {
      container: [
        [{ 'size': ['small', false, 'large', 'huge'] }], // Font size: small, normal, large, huge
        ['bold', 'italic', 'underline', 'strike'], // Text formatting: หนา, เอียง, ขีดเส้นใต้, ขีดเส้นท้าย
        [{ 'color': [] }, { 'background': [] }], // Text color and background color
        [{ 'align': ['', 'center', 'right', 'justify'] }], // Text alignment: ซ้าย, กลาง, ขวา, justify
        [{ 'list': 'ordered'}, { 'list': 'bullet' }], // Lists
        ['link'], // Links
        ['clean'] // Remove formatting
      ],
    },
  };

  const formats = [
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'align',
    'list',
    'bullet',
    'link',
  ];

  return (
    <div className="rich-text-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'กรุณาใส่เนื้อหา...'}
        style={{
          backgroundColor: 'white',
        }}
      />
      <style jsx global>{`
        .rich-text-editor .ql-container {
          font-size: 14px;
          min-height: 200px;
          max-height: 500px;
          overflow-y: auto;
        }
        .rich-text-editor .ql-editor {
          min-height: 200px;
        }
        .rich-text-editor .ql-toolbar {
          border-top: 1px solid #e5e7eb;
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          border-bottom: none;
          border-radius: 0.375rem 0.375rem 0 0;
          background-color: #f9fafb;
        }
        .rich-text-editor .ql-container {
          border-bottom: 1px solid #e5e7eb;
          border-left: 1px solid #e5e7eb;
          border-right: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 0.375rem 0.375rem;
        }
        .rich-text-editor .ql-stroke {
          stroke: #374151;
        }
        .rich-text-editor .ql-fill {
          fill: #374151;
        }
        .rich-text-editor .ql-picker-label {
          color: #374151;
        }
        .rich-text-editor .ql-toolbar button:hover,
        .rich-text-editor .ql-toolbar button.ql-active {
          color: #2563eb;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #2563eb;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-fill,
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #2563eb;
        }
        /* Ensure preview matches editor styling */
        .rich-text-editor .ql-editor p,
        .rich-text-editor .ql-editor h1,
        .rich-text-editor .ql-editor h2,
        .rich-text-editor .ql-editor h3,
        .rich-text-editor .ql-editor ul,
        .rich-text-editor .ql-editor ol {
          margin: 0.5em 0;
        }
        .rich-text-editor .ql-editor ul,
        .rich-text-editor .ql-editor ol {
          padding-left: 1.5em;
        }
      `}</style>
    </div>
  );
};

