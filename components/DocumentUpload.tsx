'use client';

import { useState, useEffect } from 'react';

interface StoredDocument {
  id: string;
  name: string;
  content: string;
  isOriginal: boolean;
  createdAt: string;
}

interface DocumentUploadProps {
  label: string;
  type: 'resume' | 'coverLetter';
  onTextChange: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  user?: { id: string; email: string; name?: string | null } | null;
}

export default function DocumentUpload({
  label,
  type,
  onTextChange,
  placeholder = 'Paste your content here...',
  required = false,
  user = null,
}: DocumentUploadProps) {
  const [content, setContent] = useState('');
  const [storedDocs, setStoredDocs] = useState<StoredDocument[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [isOriginal, setIsOriginal] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  useEffect(() => {
    if (user) {
      loadStoredDocuments();
    }
  }, [user]);

  const loadStoredDocuments = async () => {
    try {
      const endpoint = type === 'resume' ? '/api/resumes' : '/api/cover-letters';
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const docs = type === 'resume' ? data.resumes : data.coverLetters;
        setStoredDocs(docs);
      }
    } catch (error) {
      console.error('Failed to load stored documents:', error);
    }
  };

  const handleChange = (text: string) => {
    setContent(text);
    onTextChange(text);
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/parse-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to parse PDF');
    }

    const data = await response.json();
    return data.text;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Handle PDF files
    if (file.type === 'application/pdf') {
      setIsParsing(true);
      try {
        const text = await extractTextFromPDF(file);
        if (!text || text.length === 0) {
          alert('Could not extract text from PDF. The PDF might be image-based or empty.');
          return;
        }
        handleChange(text);
      } catch (error) {
        console.error('Error parsing PDF:', error);
        alert(`Failed to parse PDF file: ${error instanceof Error ? error.message : 'Unknown error'}. Please try a different file or paste the text manually.`);
      } finally {
        setIsParsing(false);
      }
    } else {
      // Handle text files
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        handleChange(text);
      };
      reader.readAsText(file);
    }
  };

  const handleLoadStored = (doc: StoredDocument) => {
    handleChange(doc.content);
    setShowSaved(false);
  };

  const handleSave = async () => {
    if (!saveName || !content) return;

    try {
      const endpoint = type === 'resume' ? '/api/resumes' : '/api/cover-letters';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: saveName, content, isOriginal }),
      });

      if (response.ok) {
        await loadStoredDocuments();
        setShowSaveDialog(false);
        setSaveName('');
        setIsOriginal(false);
      }
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">
          {label} {required && '*'}
        </label>
        <div className="flex gap-4 items-center">
          {isParsing && (
            <span className="text-sm text-gray-500">Parsing PDF...</span>
          )}
          {user && storedDocs.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSaved(!showSaved)}
              className="text-sm text-blue-600 hover:text-blue-700"
              disabled={isParsing}
            >
              Load saved ({storedDocs.length})
            </button>
          )}
          <label className={`cursor-pointer text-sm ${isParsing ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700'}`}>
            <input
              type="file"
              accept=".txt,.md,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isParsing}
            />
            Upload file
          </label>
          {user && content && (
            <button
              type="button"
              onClick={() => setShowSaveDialog(true)}
              className="text-sm text-green-600 hover:text-green-700"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {showSaved && storedDocs.length > 0 && (
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 max-h-48 overflow-y-auto">
          <div className="space-y-2">
            {storedDocs.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => handleLoadStored(doc)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex justify-between items-center"
              >
                <span className="text-sm">
                  {doc.name}
                  {doc.isOriginal && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400">(Base)</span>
                  )}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showSaveDialog && (
        <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
          <h4 className="text-sm font-medium mb-3">Save {label}</h4>
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Name this document..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded mb-3 bg-white dark:bg-gray-800"
          />
          <label className="flex items-center gap-2 mb-3 text-sm">
            <input
              type="checkbox"
              checked={isOriginal}
              onChange={(e) => setIsOriginal(e.target.checked)}
              className="rounded"
            />
            Mark as base template
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!saveName}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm rounded"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSaveDialog(false);
                setSaveName('');
                setIsOriginal(false);
              }}
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-sm rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        rows={15}
        required={required}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 font-mono text-sm"
        placeholder={placeholder}
      />

      {content && (
        <div className="text-sm text-gray-500">
          {content.split(/\s+/).length} words
        </div>
      )}
    </div>
  );
}
