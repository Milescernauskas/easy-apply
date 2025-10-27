'use client';

import { ATSScore } from '@/lib/ats';

interface ATSScoreCardProps {
  score: ATSScore;
}

export default function ATSScoreCard({ score }: ATSScoreCardProps) {
  const getScoreColor = (value: number) => {
    if (value >= 80) return 'text-green-600 dark:text-green-400';
    if (value >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreLabel = (value: number) => {
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">ATS Optimization Score</h3>
        <div className={`text-6xl font-bold ${getScoreColor(score.overall)}`}>
          {score.overall}
        </div>
        <div className="text-sm text-gray-500 mt-2">
          {getScoreLabel(score.overall)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Keyword Match</div>
          <div className={`text-2xl font-semibold ${getScoreColor(score.breakdown.keywordMatch)}`}>
            {score.breakdown.keywordMatch}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Formatting</div>
          <div className={`text-2xl font-semibold ${getScoreColor(score.breakdown.formatting)}`}>
            {score.breakdown.formatting}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Length</div>
          <div className={`text-2xl font-semibold ${getScoreColor(score.breakdown.length)}`}>
            {score.breakdown.length}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Sections</div>
          <div className={`text-2xl font-semibold ${getScoreColor(score.breakdown.sections)}`}>
            {score.breakdown.sections}
          </div>
        </div>
      </div>

      {score.recommendations.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-2">Recommendations</h4>
          <ul className="space-y-2">
            {score.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {score.matchedKeywords.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-2">
            Matched Keywords ({score.matchedKeywords.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {score.matchedKeywords.map((keyword, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {score.missingKeywords.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-2">
            Missing Keywords ({score.missingKeywords.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {score.missingKeywords.map((keyword, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm rounded-full"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
