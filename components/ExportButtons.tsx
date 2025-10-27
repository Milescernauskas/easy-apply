'use client';

import { useState } from 'react';
import { exportToPDF, exportToDOCX, exportToText } from '@/lib/export';

interface ExportButtonsProps {
  content: string;
  filename: string;
}

export default function ExportButtons({ content, filename }: ExportButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePDF = () => {
    exportToPDF(content, `${filename}.pdf`);
  };

  const handleDOCX = async () => {
    await exportToDOCX(content, `${filename}.docx`);
  };

  const handleText = () => {
    exportToText(content, `${filename}.txt`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={handleCopy}
        className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <button
        onClick={handlePDF}
        className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
      >
        Export PDF
      </button>
      <button
        onClick={handleDOCX}
        className="px-4 py-2 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
      >
        Export DOCX
      </button>
      <button
        onClick={handleText}
        className="px-4 py-2 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
      >
        Export TXT
      </button>
    </div>
  );
}
