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
                    <h2 className="text-2xl font-bold mb-1">{job.title}</h2>
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

                <Link
                  href={`/application/${job.id}`}
                  className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  View Full Application
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
