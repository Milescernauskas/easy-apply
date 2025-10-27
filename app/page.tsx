'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import JobForm, { JobFormData } from '@/components/JobForm';
import DocumentUpload from '@/components/DocumentUpload';
import AnalysisDisplay from '@/components/AnalysisDisplay';
import ATSScoreCard from '@/components/ATSScoreCard';
import ExportButtons from '@/components/ExportButtons';
import AuthForm from '@/components/AuthForm';
import FormattedResume from '@/components/FormattedResume';
import { JobAnalysis, ResumeOptimization, CoverLetterGeneration } from '@/lib/openai';
import { ATSScore } from '@/lib/ats';

type Step = 'input' | 'analysis' | 'optimize';

interface User {
  id: string;
  email: string;
  name?: string | null;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [step, setStep] = useState<Step>('input');
  const [jobData, setJobData] = useState<JobFormData | null>(null);
  const [resumeContent, setResumeContent] = useState('');
  const [coverLetterContent, setCoverLetterContent] = useState('');

  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [resumeOptimization, setResumeOptimization] = useState<ResumeOptimization | null>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetterGeneration | null>(null);
  const [baseAtsScore, setBaseAtsScore] = useState<ATSScore | null>(null);
  const [optimizedAtsScore, setOptimizedAtsScore] = useState<ATSScore | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable resume content
  const [editableResumeContent, setEditableResumeContent] = useState('');
  const [isSavingResume, setIsSavingResume] = useState(false);
  const [savedJobId, setSavedJobId] = useState<string | null>(null);

  // Editable cover letter content
  const [editableCoverLetterContent, setEditableCoverLetterContent] = useState('');
  const [isSavingCoverLetter, setIsSavingCoverLetter] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      handleReset();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleJobSubmit = async (data: JobFormData) => {
    if (!resumeContent || !coverLetterContent) {
      setError('Please provide both resume and cover letter');
      return;
    }

    setIsLoading(true);
    setError(null);
    setJobData(data);

    try {
      // Step 1: Analyze job description
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: data.description }),
      });

      if (!analyzeRes.ok) {
        throw new Error('Failed to analyze job description');
      }

      const { analysis: jobAnalysis } = await analyzeRes.json();
      setAnalysis(jobAnalysis);
      setStep('analysis');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!analysis || !jobData) return;

    setIsLoading(true);
    setError(null);

    try {
      // Optimize resume
      const resumeRes = await fetch('/api/optimize-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeContent,
          jobAnalysis: analysis,
          jobDescription: jobData.description,
        }),
      });

      if (!resumeRes.ok) {
        throw new Error('Failed to optimize resume');
      }

      const { optimization, baseAtsScore: baseScore, optimizedAtsScore: optimizedScore } = await resumeRes.json();
      setResumeOptimization(optimization);
      setEditableResumeContent(optimization.optimizedContent);
      setBaseAtsScore(baseScore);
      setOptimizedAtsScore(optimizedScore);

      // Generate cover letter
      const coverLetterRes = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalCoverLetter: coverLetterContent,
          resumeContent,
          jobAnalysis: analysis,
          jobDescription: jobData.description,
          companyName: jobData.company,
          jobTitle: jobData.title,
        }),
      });

      if (!coverLetterRes.ok) {
        throw new Error('Failed to generate cover letter');
      }

      const { coverLetter: generatedCoverLetter } = await coverLetterRes.json();
      setCoverLetter(generatedCoverLetter);
      setEditableCoverLetterContent(generatedCoverLetter.content);

      setStep('optimize');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setJobData(null);
    setAnalysis(null);
    setResumeOptimization(null);
    setCoverLetter(null);
    setBaseAtsScore(null);
    setOptimizedAtsScore(null);
    setEditableResumeContent('');
    setEditableCoverLetterContent('');
    setError(null);
    setSaveSuccess(false);
  };

  const handleSaveApplication = async () => {
    if (!jobData || !analysis || !resumeOptimization || !coverLetter || !baseAtsScore || !optimizedAtsScore) {
      setError('Missing required data to save application');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jobData.title,
          company: jobData.company,
          description: jobData.description,
          url: jobData.url,
          analysis,
          baseResumeContent: resumeContent,
          optimizedResumeContent: editableResumeContent,
          optimizedCoverLetterContent: editableCoverLetterContent,
          baseAtsScore,
          optimizedAtsScore,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save application');
      }

      const result = await response.json();
      setSavedJobId(result.job.id);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save application');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  // Autosave resume changes
  const saveResumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveCoverLetterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const autosaveResume = useCallback(async (content: string) => {
    if (!savedJobId) return;

    setIsSavingResume(true);
    try {
      await fetch(`/api/jobs/${savedJobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optimizedResumeContent: content }),
      });
    } catch (error) {
      console.error('Failed to autosave resume:', error);
    } finally {
      setIsSavingResume(false);
    }
  }, [savedJobId]);

  const autosaveCoverLetter = useCallback(async (content: string) => {
    if (!savedJobId) return;

    setIsSavingCoverLetter(true);
    try {
      await fetch(`/api/jobs/${savedJobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optimizedCoverLetterContent: content }),
      });
    } catch (error) {
      console.error('Failed to autosave cover letter:', error);
    } finally {
      setIsSavingCoverLetter(false);
    }
  }, [savedJobId]);

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
    if (!jobData || !analysis) return;

    setIsReanalyzing(true);
    try {
      const response = await fetch('/api/reanalyze-ats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: savedJobId,
          optimizedResumeContent: editableResumeContent,
          jobDescription: jobData.description,
          jobAnalysis: analysis,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to re-analyze resume');
      }

      const { atsScore } = await response.json();

      // Update the optimized ATS score
      setOptimizedAtsScore(atsScore);
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
          <title>Resume - ${jobData?.company || ''} ${jobData?.title || ''}</title>
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

  if (isCheckingAuth) {
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
            <h1 className="inline-block text-2xl font-bold px-6 py-3 bg-green-600 dark:bg-green-600 text-white dark:text-white rounded-xl shadow-md hover:bg-green-700 dark:hover:bg-green-700 transition-colors">
              Easy Apply
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">
              Optimize your job applications with AI
            </p>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
                {user.email}
              </span>
              <Link
                href="/dashboard"
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                My Applications
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {!user ? (
          <AuthForm onSuccess={checkAuth} />
        ) : (
          <>

        {/* Step 1: Input */}
        {step === 'input' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Job Details</h2>
              <JobForm onSubmit={handleJobSubmit} isLoading={isLoading} />
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Your Documents</h2>
                <DocumentUpload
                  label="Current Resume"
                  type="resume"
                  onTextChange={setResumeContent}
                  placeholder="Paste your current resume here..."
                  required
                  user={user}
                />
              </div>

              <div className="mt-8">
                <DocumentUpload
                  label="Generic Cover Letter"
                  type="coverLetter"
                  onTextChange={setCoverLetterContent}
                  placeholder="Paste your generic cover letter template here..."
                  required
                  user={user}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Analysis */}
        {step === 'analysis' && analysis && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Job Analysis Complete</h2>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Start Over
              </button>
            </div>

            <AnalysisDisplay analysis={analysis} />

            <div className="flex justify-center">
              <button
                onClick={handleOptimize}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-8 rounded-lg transition-colors"
              >
                {isLoading ? 'Optimizing...' : 'Optimize Resume & Cover Letter'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Optimized Results */}
        {step === 'optimize' && resumeOptimization && coverLetter && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Optimized Application</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveApplication}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm rounded-lg transition-colors"
                >
                  {isSaving ? 'Saving...' : saveSuccess ? '✓ Saved!' : 'Save Application'}
                </button>
                <button
                  onClick={handlePrintPDF}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                >
                  Print to PDF
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  New Application
                </button>
              </div>
            </div>

            {/* ATS Score Comparison */}
            {baseAtsScore && optimizedAtsScore && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
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
                    <ATSScoreCard score={baseAtsScore} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Optimized Resume ATS Score</h3>
                    <ATSScoreCard score={optimizedAtsScore} />
                    {optimizedAtsScore.overall > baseAtsScore.overall && (
                      <div className="mt-3 text-center">
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          +{optimizedAtsScore.overall - baseAtsScore.overall} point improvement!
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {resumeOptimization.suggestions.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Additional Suggestions</h4>
                    <ul className="space-y-1 text-sm">
                      {resumeOptimization.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Optimized Resume Text */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Optimized Resume</h3>
                <ExportButtons
                  content={editableResumeContent}
                  filename={`${jobData.company}-${jobData.title}-Resume`}
                />
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

              {resumeOptimization.changes.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Changes Made</h4>
                  <div className="space-y-2">
                    {resumeOptimization.changes.slice(0, 5).map((change, idx) => (
                      <div key={idx} className="text-sm border-l-2 border-blue-500 pl-3">
                        <div className="font-medium">{change.section}</div>
                        <div className="text-gray-600 dark:text-gray-400">{change.reason}</div>
                      </div>
                    ))}
                    {resumeOptimization.changes.length > 5 && (
                      <div className="text-sm text-gray-500">
                        +{resumeOptimization.changes.length - 5} more changes
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Formatted Optimized Resume */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Formatted Optimized Resume</h3>
                <div className="flex gap-2">
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
                  jobTitle={jobData.title}
                  company={jobData.company}
                  printable={false}
                />
              </div>

              {/* Hidden printable version */}
              <div id="printable-resume" className="hidden">
                <FormattedResume
                  content={editableResumeContent}
                  jobTitle={jobData.title}
                  company={jobData.company}
                  printable={true}
                />
              </div>
            </div>

            {/* Cover Letter */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Tailored Cover Letter</h3>
                <ExportButtons
                  content={editableCoverLetterContent}
                  filename={`${jobData.company}-${jobData.title}-CoverLetter`}
                />
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

              {coverLetter.keyPoints.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Key Points Highlighted</h4>
                  <ul className="space-y-1">
                    {coverLetter.keyPoints.map((point, idx) => (
                      <li key={idx} className="text-sm flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        </>
        )}
      </main>

      <style jsx global>{`
        @media print {
          button {
            display: none !important;
          }
          .max-h-96 {
            max-height: none !important;
          }
        }
      `}</style>
    </div>
  );
}
