'use client';

import { useState } from 'react';

interface JobFormProps {
  onSubmit: (data: JobFormData) => void;
  isLoading?: boolean;
}

export interface JobFormData {
  title: string;
  company: string;
  description: string;
  url?: string;
}

export default function JobForm({ onSubmit, isLoading = false }: JobFormProps) {
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    company: '',
    description: '',
    url: '',
  });
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFetchFromUrl = async () => {
    if (!formData.url) {
      setFetchError('Please enter a job URL first');
      return;
    }

    setIsFetchingUrl(true);
    setFetchError(null);

    try {
      const response = await fetch('/api/fetch-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formData.url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch job posting');
      }

      const jobData = await response.json();
      setFormData({
        ...formData,
        title: jobData.title,
        company: jobData.company,
        description: jobData.description,
      });
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch job posting');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="url" className="block text-sm font-medium mb-2">
          Job URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            id="url"
            value={formData.url}
            onChange={(e) => {
              setFormData({ ...formData, url: e.target.value });
              setFetchError(null);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
            placeholder="https://jobs.company.com/..."
          />
          <button
            type="button"
            onClick={handleFetchFromUrl}
            disabled={isFetchingUrl || !formData.url}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            {isFetchingUrl ? 'Fetching...' : 'Fetch Job'}
          </button>
        </div>
        {fetchError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{fetchError}</p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          Paste a job URL and click "Fetch Job" to auto-fill the fields below, or enter details manually
        </p>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Job Title *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
            placeholder="e.g., Senior Software Engineer"
          />
        </div>

        <div className="mt-8">
          <label htmlFor="company" className="block text-sm font-medium mb-2">
            Company *
          </label>
          <input
            type="text"
            id="company"
            required
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800"
            placeholder="e.g., Google"
          />
        </div>

        <div className="mt-8">
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Job Description *
          </label>
          <textarea
            id="description"
            required
            rows={12}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 font-mono text-sm"
            placeholder="Paste the full job description here..."
          />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-8 rounded-lg transition-colors"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Job Description'}
        </button>
      </div>
    </form>
  );
}
