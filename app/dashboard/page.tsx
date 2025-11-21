'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SavedJob {
  id: string;
  title: string;
  company: string;
  description: string;
  url?: string;
  analysis: any;
  baseResumeContent?: string;
  optimizedResumeContent?: string;
  optimizedCoverLetterContent?: string;
  baseAtsScore?: any;
  optimizedAtsScore?: any;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  name?: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    checkAuthAndLoadJobs();
  }, []);

  const checkAuthAndLoadJobs = async () => {
    try {
      // Check authentication
      const authResponse = await fetch('/api/auth/me');
      if (!authResponse.ok) {
        router.push('/');
        return;
      }

      const authData = await authResponse.json();
      setUser(authData.user);

      // Load saved jobs
      const jobsResponse = await fetch('/api/jobs');
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobs(jobsData.jobs);
      }
    } catch (err) {
      setError('Failed to load saved applications');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleDuplicate = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to duplicate application');
      }

      const { job } = await response.json();

      // Redirect to the duplicated application
      router.push(`/application/${job.id}`);
    } catch (error) {
      console.error('Duplicate failed:', error);
      setError('Failed to duplicate application. Please try again.');
    }
  };

  const startEditing = (job: SavedJob) => {
    setEditingJobId(job.id);
    setEditingTitle(job.title);
  };

  const cancelEditing = () => {
    setEditingJobId(null);
    setEditingTitle('');
  };

  const saveTitle = async (jobId: string) => {
    if (!editingTitle.trim()) {
      cancelEditing();
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update title');
      }

      // Update the jobs list with the new title
      setJobs(jobs.map(job =>
        job.id === jobId ? { ...job, title: editingTitle.trim() } : job
      ));

      cancelEditing();
    } catch (error) {
      console.error('Update title failed:', error);
      setError('Failed to update application title. Please try again.');
      cancelEditing();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, jobId: string) => {
    if (e.key === 'Enter') {
      saveTitle(jobId);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 sm:p-12 pb-20">
      <main className="w-[80%] max-w-7xl mx-auto">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Applications</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              View and manage your saved job applications
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
              {user?.email}
            </span>
            <Link
              href="/"
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              New Application
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No saved applications yet</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Create Your First Application
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {editingJobId === job.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, job.id)}
                          onBlur={() => saveTitle(job.id)}
                          autoFocus
                          className="text-2xl font-bold border-b-2 border-blue-500 bg-transparent focus:outline-none flex-1"
                        />
                        <button
                          onClick={cancelEditing}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Cancel (Esc)"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-2xl font-bold">{job.title}</h2>
                        <button
                          onClick={() => startEditing(job)}
                          className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title="Rename"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                      {job.company}
                    </p>
                    <p className="text-sm text-gray-500">
                      Saved on {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {job.optimizedAtsScore && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">ATS Score</div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {job.optimizedAtsScore.overall}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/application/${job.id}`}
                    className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    View Full Application
                  </Link>
                  <button
                    onClick={() => handleDuplicate(job.id)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm rounded-lg transition-colors"
                  >
                    Duplicate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
