'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ATSScoreCard from '@/components/ATSScoreCard';
import ExportButtons from '@/components/ExportButtons';
import FormattedResume from '@/components/FormattedResume';
import { ATSScore } from '@/lib/ats';
import { JobAnalysis } from '@/lib/openai';

interface SavedJob {
  id: string;
  title: string;
  company: string;
  description: string;
  url?: string;
  analysis: JobAnalysis;
  baseResumeContent?: string;
  optimizedResumeContent?: string;
  optimizedCoverLetterContent?: string;
  baseAtsScore?: ATSScore;
  optimizedAtsScore?: ATSScore;
  createdAt: string;
  updatedAt: string;
}

export default function ApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const [job, setJob] = useState<SavedJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editableResumeContent, setEditableResumeContent] = useState('');
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [editableCoverLetterContent, setEditableCoverLetterContent] = useState('');
  const [isSavingCoverLetter, setIsSavingCoverLetter] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  useEffect(() => {
    loadJob();
  }, [params.id]);

  const loadJob = async () => {
    try {
      const response = await fetch(`/api/jobs/${params.id}`);
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/');
          return;
        }
        throw new Error('Failed to load application');
      }

      const data = await response.json();
      setJob(data.job);
      setEditableResumeContent(data.job.optimizedResumeContent || '');
      setEditableCoverLetterContent(data.job.optimizedCoverLetterContent || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // Autosave resume changes
  const saveResumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveCoverLetterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const autosaveResume = useCallback(async (content: string) => {
    if (!job?.id) return;

    setIsSavingResume(true);
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optimizedResumeContent: content }),
      });
    } catch (error) {
      console.error('Failed to autosave resume:', error);
    } finally {
      setIsSavingResume(false);
    }
  }, [job?.id]);

  const autosaveCoverLetter = useCallback(async (content: string) => {
    if (!job?.id) return;

    setIsSavingCoverLetter(true);
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optimizedCoverLetterContent: content }),
      });
    } catch (error) {
      console.error('Failed to autosave cover letter:', error);
    } finally {
      setIsSavingCoverLetter(false);
    }
  }, [job?.id]);

  const handleResumeChange = (content: string) => {
    setEditableResumeContent(content);

    // Debounce autosave - wait 2 seconds after typing stops
    if (saveResumeTimeoutRef.current) {
      clearTimeout(saveResumeTimeoutRef.current);
    }

    saveResumeTimeoutRef.current = setTimeout(() => {
      autosaveResume(content);
    }, 2000);
  };

  const handleCoverLetterChange = (content: string) => {
    setEditableCoverLetterContent(content);

    // Debounce autosave - wait 2 seconds after typing stops
    if (saveCoverLetterTimeoutRef.current) {
      clearTimeout(saveCoverLetterTimeoutRef.current);
    }

    saveCoverLetterTimeoutRef.current = setTimeout(() => {
      autosaveCoverLetter(content);
    }, 2000);
  };

  const handleReanalyze = async () => {
    if (!job) return;

    setIsReanalyzing(true);
    try {
      const response = await fetch('/api/reanalyze-ats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          optimizedResumeContent: editableResumeContent,
          jobDescription: job.description,
          jobAnalysis: job.analysis,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to re-analyze resume');
      }

      const { atsScore } = await response.json();

      // Update the job state with new ATS score
      setJob({
        ...job,
        optimizedAtsScore: atsScore,
      });
    } catch (err) {
      console.error('Re-analyze error:', err);
      alert('Failed to re-analyze resume. Please try again.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handlePrintResume = (printable: boolean = false) => {
    // Open new window with just the resume
    const resumeId = printable ? 'printable-resume' : 'formatted-resume';
    const resumeElement = document.getElementById(resumeId);
    if (!resumeElement) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resume - ${job?.company || ''} ${job?.title || ''}</title>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, sans-serif; }
            @page { size: letter; margin: 0; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${resumeElement.innerHTML}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.onafterprint = () => window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg mb-4">
            {error || 'Application not found'}
          </div>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 sm:p-12 pb-20">
      <main className="w-[80%] max-w-7xl mx-auto">
        <div className="mb-12 flex items-center justify-between no-print">
          <div>
            <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">{job.company}</p>
            <p className="text-sm text-gray-500 mt-2">
              Saved on {new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrintPDF}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
            >
              Print to PDF
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* ATS Score Comparison */}
        {job.baseAtsScore && job.optimizedAtsScore && (
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between mb-4 no-print">
              <h3 className="text-xl font-semibold">ATS Score Comparison</h3>
              <button
                onClick={handleReanalyze}
                disabled={isReanalyzing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg transition-colors"
              >
                {isReanalyzing ? 'Re-analyzing...' : 'Re-analyze ATS Score'}
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Base Resume ATS Score</h3>
                <ATSScoreCard score={job.baseAtsScore} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Optimized Resume ATS Score</h3>
                <ATSScoreCard score={job.optimizedAtsScore} />
                {job.optimizedAtsScore.overall > job.baseAtsScore.overall && (
                  <div className="mt-3 text-center">
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      +{job.optimizedAtsScore.overall - job.baseAtsScore.overall} point improvement!
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Optimized Resume Text */}
        {job.optimizedResumeContent && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Optimized Resume</h3>
              <div className="no-print">
                <ExportButtons
                  content={editableResumeContent}
                  filename={`${job.company}-${job.title}-Resume`}
                />
              </div>
            </div>
            <div className="relative">
              <textarea
                value={editableResumeContent}
                onChange={(e) => handleResumeChange(e.target.value)}
                rows={20}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 font-mono text-sm"
                placeholder="Optimized resume content..."
              />
              {isSavingResume && (
                <div className="absolute top-2 right-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                  Saving...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Formatted Optimized Resume */}
        {job.optimizedResumeContent && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Formatted Optimized Resume</h3>
              <div className="no-print flex gap-2">
                <button
                  onClick={() => handlePrintResume(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => handlePrintResume(true)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                >
                  Export Printable PDF
                </button>
              </div>
            </div>

            {/* Colorful Resume Preview */}
            <div id="formatted-resume" className="mb-6">
              <FormattedResume
                content={editableResumeContent}
                jobTitle={job.title}
                company={job.company}
                printable={false}
              />
            </div>

            {/* Hidden printable version */}
            <div id="printable-resume" className="hidden">
              <FormattedResume
                content={editableResumeContent}
                jobTitle={job.title}
                company={job.company}
                printable={true}
              />
            </div>
          </div>
        )}

        {/* Cover Letter */}
        {job.optimizedCoverLetterContent && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Tailored Cover Letter</h3>
              <div className="no-print">
                <ExportButtons
                  content={editableCoverLetterContent}
                  filename={`${job.company}-${job.title}-CoverLetter`}
                />
              </div>
            </div>
            <div className="relative">
              <textarea
                value={editableCoverLetterContent}
                onChange={(e) => handleCoverLetterChange(e.target.value)}
                rows={15}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 font-mono text-sm"
                placeholder="Cover letter content..."
              />
              {isSavingCoverLetter && (
                <div className="absolute top-2 right-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded">
                  Saving...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Job Description */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-semibold mb-4">Job Description</h3>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
            {job.description}
          </div>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
