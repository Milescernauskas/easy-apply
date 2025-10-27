'use client';

import { JobAnalysis } from '@/lib/openai';

interface AnalysisDisplayProps {
  analysis: JobAnalysis;
}

export default function AnalysisDisplay({ analysis }: AnalysisDisplayProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      <h3 className="text-xl font-semibold">Job Analysis</h3>

      <div>
        <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">
          Summary
        </h4>
        <p className="text-sm">{analysis.summary}</p>
      </div>

      <div>
        <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">
          Experience Level
        </h4>
        <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
          {analysis.experienceLevel}
        </span>
      </div>

      <div>
        <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">
          Key Skills ({analysis.keySkills.length})
        </h4>
        <p className="text-sm text-green-800 dark:text-green-200">
          {analysis.keySkills.join(', ')}
        </p>
      </div>

      <div>
        <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">
          Required Qualifications
        </h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {analysis.requiredQualifications.map((qual, idx) => (
            <li key={idx}>{qual}</li>
          ))}
        </ul>
      </div>

      {analysis.preferredQualifications.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">
            Preferred Qualifications
          </h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {analysis.preferredQualifications.map((qual, idx) => (
              <li key={idx}>{qual}</li>
            ))}
          </ul>
        </div>
      )}

      {analysis.companyValues.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">
            Company Values
          </h4>
          <p className="text-sm text-purple-800 dark:text-purple-200">
            {analysis.companyValues.join(', ')}
          </p>
        </div>
      )}

      <div>
        <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-2">
          ATS Keywords ({analysis.keywords.length})
        </h4>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {analysis.keywords.join(', ')}
        </p>
      </div>
    </div>
  );
}
