'use client';

import { ATSScore } from '@/lib/ats';
import { useState } from 'react';

interface ATSScoreCardProps {
  score: ATSScore;
  excludedKeywords?: string[];
  onRemoveKeyword?: (keyword: string) => void;
}

export default function ATSScoreCard({ score, excludedKeywords = [], onRemoveKeyword }: ATSScoreCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getScoreColor = (value: number, max: number = 100) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreLabel = (value: number) => {
    if (value >= 80) return 'Excellent';
    if (value >= 60) return 'Good';
    if (value >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const getKeywordScoreColor = (relativeScore: number) => {
    if (relativeScore >= 80) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
    if (relativeScore >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
    if (relativeScore > 0) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
    return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
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
          <div className={`text-2xl font-semibold ${getScoreColor(score.breakdown.keywordMatch, 70)}`}>
            {score.breakdown.keywordMatch}<span className="text-sm text-gray-400">/70</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Formatting</div>
          <div className={`text-2xl font-semibold ${getScoreColor(score.breakdown.formatting, 10)}`}>
            {score.breakdown.formatting}<span className="text-sm text-gray-400">/10</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Length</div>
          <div className={`text-2xl font-semibold ${getScoreColor(score.breakdown.length, 10)}`}>
            {score.breakdown.length}<span className="text-sm text-gray-400">/10</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Sections</div>
          <div className={`text-2xl font-semibold ${getScoreColor(score.breakdown.sections, 10)}`}>
            {score.breakdown.sections}<span className="text-sm text-gray-400">/10</span>
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

      {/* Top Keywords Section */}
      {score.topKeywords && score.topKeywords.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-3">
            Top Priority Keywords
            <span className="text-xs text-gray-500 ml-2">(from required qualifications)</span>
          </h4>
          <div className="space-y-2">
            {score.topKeywords.map((keywordScore, idx) => {
              const isExcluded = excludedKeywords.includes(keywordScore.keyword.term);
              return (
                <div key={idx} className={`flex items-center justify-between text-sm ${isExcluded ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2 flex-1">
                    <span className={`font-medium ${isExcluded ? 'line-through' : ''}`}>
                      {keywordScore.keyword.term}
                    </span>
                    {isExcluded ? (
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                        Excluded
                      </span>
                    ) : (
                      keywordScore.keyword.sectionType === 'required' && (
                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                          Required
                        </span>
                      )
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      Importance: {keywordScore.keyword.importance.toFixed(1)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${getKeywordScoreColor(keywordScore.relativeScore)}`}>
                      {keywordScore.relativeScore === 0 ? 'Missing' : `${Math.round(keywordScore.relativeScore)}%`}
                    </span>
                    {onRemoveKeyword && !isExcluded && (
                      <button
                        onClick={() => onRemoveKeyword(keywordScore.keyword.term)}
                        className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Exclude this keyword"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Keywords Section */}
      {score.otherKeywords && score.otherKeywords.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-3">
            Other Keywords
            <span className="text-xs text-gray-500 ml-2">(lower priority)</span>
          </h4>
          <div className="space-y-2">
            {score.otherKeywords.slice(0, 10).map((keywordScore, idx) => {
              const isExcluded = excludedKeywords.includes(keywordScore.keyword.term);
              return (
                <div key={idx} className={`flex items-center justify-between text-sm ${isExcluded ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-2 flex-1">
                    <span className={`font-medium ${isExcluded ? 'line-through' : ''}`}>
                      {keywordScore.keyword.term}
                    </span>
                    {isExcluded ? (
                      <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                        Excluded
                      </span>
                    ) : (
                      keywordScore.keyword.sectionType === 'preferred' && (
                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                          Preferred
                        </span>
                      )
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      Importance: {keywordScore.keyword.importance.toFixed(1)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${getKeywordScoreColor(keywordScore.relativeScore)}`}>
                      {keywordScore.relativeScore === 0 ? 'Missing' : `${Math.round(keywordScore.relativeScore)}%`}
                    </span>
                    {onRemoveKeyword && !isExcluded && (
                      <button
                        onClick={() => onRemoveKeyword(keywordScore.keyword.term)}
                        className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Exclude this keyword"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Show Details Button */}
      {score.detailedScores && score.detailedScores.length > 0 && (
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            {showDetails ? 'Hide Details' : 'Show Detailed Breakdown'}
          </button>

          {showDetails && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-2">Keyword</th>
                    <th className="text-left py-2 px-2">Section</th>
                    <th className="text-right py-2 px-2">Importance</th>
                    <th className="text-right py-2 px-2">Resume %</th>
                    <th className="text-right py-2 px-2">JD %</th>
                    <th className="text-right py-2 px-2">Context</th>
                    <th className="text-right py-2 px-2">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {score.detailedScores
                    .sort((a, b) => b.keyword.importance - a.keyword.importance)
                    .map((keywordScore, idx) => (
                      <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 px-2 font-medium">{keywordScore.keyword.term}</td>
                        <td className="py-2 px-2 text-gray-600 dark:text-gray-400">
                          {keywordScore.keyword.section}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {keywordScore.keyword.importance.toFixed(1)}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {keywordScore.resumeFrequency.toFixed(2)}%
                        </td>
                        <td className="py-2 px-2 text-right">
                          {keywordScore.keyword.frequency.toFixed(2)}%
                        </td>
                        <td className="py-2 px-2 text-right">
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            keywordScore.contextWeight === 1.0
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : keywordScore.contextWeight === 0.5
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          }`}>
                            {keywordScore.contextWeight === 1.0 ? 'High' : keywordScore.contextWeight === 0.5 ? 'Skills' : 'None'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getKeywordScoreColor(keywordScore.relativeScore)}`}>
                            {Math.round(keywordScore.relativeScore)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p><strong>Context:</strong> High = keyword used in Experience/Summary (weight 1.0), Skills = keyword only in Skills section (weight 0.5)</p>
                <p><strong>Score:</strong> How well your resume matches the job description frequency for this keyword</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback for legacy scores without enhanced keywords */}
      {(!score.topKeywords || score.topKeywords.length === 0) && score.matchedKeywords.length > 0 && (
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

      {(!score.topKeywords || score.topKeywords.length === 0) && score.missingKeywords.length > 0 && (
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
