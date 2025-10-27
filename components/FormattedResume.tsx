'use client';

interface FormattedResumeProps {
  content: string;
  jobTitle?: string;
  company?: string;
  printable?: boolean;
}

interface ParsedResume {
  name: string;
  title?: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
  website?: string;
  summary?: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    bullets: string[];
  }>;
  education: Array<{
    degree: string;
    school: string;
    year: string;
  }>;
  skills: string[];
  languages: string[];
  skillCategories: Array<{
    category: string;
    skills: string[];
  }>;
}

export default function FormattedResume({ content, printable = false }: FormattedResumeProps) {
  const parseResume = (text: string): ParsedResume => {
    const lines = text.split('\n').map(l => l.trim()); // Don't filter out blank lines

    const result: ParsedResume = {
      name: '',
      title: '',
      email: '',
      phone: '',
      experience: [],
      education: [],
      skills: [],
      languages: [],
      skillCategories: [],
    };

    // Extract name (first line)
    result.name = lines[0] || 'Your Name';

    // Extract title (second line, if it's not email/phone/linkedin/location)
    if (lines[1] && !lines[1].match(/[\w.-]+@[\w.-]+\.\w+/) && !lines[1].match(/\+?\d/) && !lines[1].match(/linkedin\.com/i) && !lines[1].match(/^[A-Z][a-z]+,?\s*[A-Z]{2}/)) {
      result.title = lines[1];
    }

    // Extract contact info from first 10 lines only
    const headerText = lines.slice(0, 10).join('\n');

    // Extract email
    const emailMatch = headerText.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) result.email = emailMatch[0];

    // Extract phone
    const phoneMatch = headerText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) result.phone = phoneMatch[0];

    // Extract LinkedIn
    const linkedinMatch = headerText.match(/linkedin\.com\/in\/[\w-]+/i);
    if (linkedinMatch) result.linkedin = linkedinMatch[0];

    // Extract GitHub
    const githubMatch = headerText.match(/github\.com\/[\w-]+/i);
    if (githubMatch) result.github = githubMatch[0];

    // Extract personal website (look for common patterns, excluding linkedin/github/email providers)
    const emailProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'protonmail.com', 'aol.com'];
    const websiteMatch = headerText.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+\.[a-z]{2,})/i);
    if (websiteMatch && websiteMatch[0]) {
      const domain = websiteMatch[0].toLowerCase();
      const isEmailProvider = emailProviders.some(provider => domain.includes(provider));
      const isLinkedIn = domain.includes('linkedin');
      const isGitHub = domain.includes('github');

      if (!isEmailProvider && !isLinkedIn && !isGitHub) {
        result.website = websiteMatch[0];
      }
    }

    // Parse sections
    let currentSection = '';
    let currentExp: any = null;
    let currentEdu: any = null;
    let previousLineWasBlank = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();

      // Skip blank lines but track them
      if (!line) {
        previousLineWasBlank = true;
        continue;
      }

      // Detect section headers
      // Only treat as section header if there was a blank line before it AND it contains keywords
      if (previousLineWasBlank && line.length < 100) {
        if (lowerLine.includes('experience') || lowerLine.includes('work history')) {
          currentSection = 'experience';
          previousLineWasBlank = false;
          continue;
        } else if (lowerLine.includes('education')) {
          currentSection = 'education';
          previousLineWasBlank = false;
          continue;
        } else if (lowerLine.includes('skill') || lowerLine.includes('competenc')) {
          currentSection = 'skills';
          previousLineWasBlank = false;
          continue;
        } else if (lowerLine.includes('summary') || lowerLine.includes('about') || lowerLine.includes('profile')) {
          currentSection = 'summary';
          previousLineWasBlank = false;
          continue;
        }
      }

      // Special handling for "Skills:" or "Languages:" with colon at end
      if (line.trim().match(/^(Skills?|Languages?|Competenc(y|ies)|Core Skills?):?\s*$/i)) {
        const cleanLine = line.trim().replace(/:?\s*$/, '').toLowerCase();
        if (cleanLine.includes('skill') || cleanLine.includes('competenc')) {
          currentSection = 'skills';
        } else if (cleanLine.includes('language')) {
          currentSection = 'languages';
        }
        previousLineWasBlank = false;
        continue;
      }

      // If we haven't found any section yet and this is after name/contact, assume it's summary
      if (!currentSection && i > 0 && i < 10 && line.length > 50 && !line.match(/[\w.-]+@[\w.-]+\.\w+/) && !line.match(/\d{3}/) && !lowerLine.includes('linkedin')) {
        currentSection = 'summary';
      }

      previousLineWasBlank = false;

      // Parse experience
      if (currentSection === 'experience') {
        // Check if it's a line with dates (company/duration line)
        if (line.match(/\d{4}/)) {
          // If we already have a title but no company, this is the company/date line
          if (currentExp && !currentExp.company) {
            // Extract date range (e.g., "2022 - 2025" or "2022-2025")
            const dateMatch = line.match(/(\d{4})\s*[-–]\s*(\d{4}|Present|present|Current|current)/);
            if (dateMatch) {
              currentExp.duration = `${dateMatch[1]} - ${dateMatch[2]}`;
              // Remove the date range from the company string
              currentExp.company = line.replace(/,?\s*\d{4}\s*[-–]\s*(?:\d{4}|Present|present|Current|current)\s*$/, '').trim();
            } else {
              // Fallback: try to extract just a single year
              const singleYearMatch = line.match(/(\d{4})/);
              if (singleYearMatch) {
                currentExp.duration = singleYearMatch[1];
                currentExp.company = line.replace(/,?\s*\d{4}\s*$/, '').trim();
              } else {
                currentExp.company = line;
              }
            }
          } else {
            // This might be a single-line format: Title | Company | Date
            if (line.includes('|') || line.includes('–')) {
              if (currentExp) {
                result.experience.push(currentExp);
              }
              const parts = line.split(/\s*[|–]\s*/);
              currentExp = {
                title: parts[0]?.trim() || '',
                company: parts[1]?.trim() || '',
                duration: parts[2]?.trim() || parts[parts.length - 1]?.trim() || '',
                bullets: [],
              };
            }
          }
        } else if (line && !line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*') && !line.match(/^[A-Z\s]+$/)) {
          // This might be a job title (non-bullet, non-section-header line without dates)
          if (currentExp && currentExp.title && currentExp.company) {
            // We have a complete job, save it and start a new one
            result.experience.push(currentExp);
          }
          currentExp = {
            title: line,
            company: '',
            duration: '',
            bullets: [],
          };
        } else if (currentExp && (line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))) {
          currentExp.bullets.push(line.replace(/^[•\-*]\s*/, ''));
        }
      }

      // Parse education
      if (currentSection === 'education') {
        if (line.match(/\d{4}/)) {
          // This line contains a year - it's the last line of an education entry
          if (currentEdu) {
            currentEdu.year = line.trim();
            result.education.push(currentEdu);
            currentEdu = null;
          } else {
            // Single-line format with pipe or en-dash delimiters
            const parts = line.split(/\s*[|–]\s*/);
            result.education.push({
              degree: parts[0]?.trim() || line,
              school: parts[1]?.trim() || '',
              year: parts[2]?.trim() || parts[parts.length - 1]?.trim() || '',
            });
          }
        } else if (line && !currentEdu) {
          // First line after Education header - this is the school name
          currentEdu = {
            degree: '',
            school: line.trim(),
            year: '',
          };
        } else if (line && currentEdu) {
          // Subsequent lines - add to degree (combine all degree-related info)
          if (currentEdu.degree) {
            currentEdu.degree += '\n' + line.trim();
          } else {
            currentEdu.degree = line.trim();
          }
        }
      }

      // Parse skills
      if (currentSection === 'skills') {
        // Check if this is a category line (has a colon followed by skill items)
        const categoryMatch = line.match(/^-?\s*([^:]+):\s*(.+)$/);
        if (categoryMatch) {
          const category = categoryMatch[1].trim();
          const skillsText = categoryMatch[2].trim();
          const skillsList = skillsText
            .split(/[,;]/)
            .map(s => s.trim())
            .filter(s => s);

          result.skillCategories.push({
            category,
            skills: skillsList,
          });
          previousLineWasBlank = false;
          continue;
        }

        // Parse regular skills (comma or semicolon separated) - fallback for uncategorized
        if (line && !line.startsWith('-')) {
          const skillsList = line
            .split(/[,;]/)
            .map(s => s.trim())
            .map(s => s.replace(/^[-\s]+/, '')) // Remove leading dashes and spaces
            .filter(s => s);
          result.skills.push(...skillsList);
        }
      }

      // Parse languages (when it's a dedicated section)
      if (currentSection === 'languages') {
        if (line && !lowerLine.includes('language')) {
          const languagesList = line
            .split(/[,;]/)
            .map(s => s.trim())
            .map(s => s.replace(/^[-\s]+/, '')) // Remove leading dashes and spaces
            .filter(s => s);
          result.languages.push(...languagesList);
        }
      }

      // Parse summary
      if (currentSection === 'summary') {
        if (line && !lowerLine.includes('summary') && !lowerLine.includes('about') && !lowerLine.includes('profile')) {
          result.summary = (result.summary || '') + line + ' ';
        }
      }
    }

    // Add last experience if exists
    if (currentExp) {
      result.experience.push(currentExp);
    }

    return result;
  };

  const resume = parseResume(content);

  const sidebarBgColor = printable
    ? 'bg-gray-100 print:bg-gray-50'
    : 'bg-orange-50/60';

  const skillBgColor = printable
    ? 'bg-gray-200 text-gray-800'
    : 'bg-green-100 text-green-800';

  return (
    <div className="bg-white text-gray-900 shadow-lg max-w-[8.5in] mx-auto print:shadow-none print:max-w-none relative">
      {/* Page Break Indicator */}
      <div className="absolute left-0 right-0 h-0 border-t-2 border-dashed border-red-500 print:hidden" style={{ top: '11in' }}>
        <span className="absolute -top-3 right-4 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
          Page Break
        </span>
      </div>
      <div className="grid grid-cols-[1fr_236px] gap-0 min-h-screen print:min-h-0">
        {/* Left Column - Main Content */}
        <div className="p-6 pr-4 pt-6">
          {/* Name, Title, and Summary */}
          <div className="mb-4">
            <h1 className="text-4xl font-bold text-gray-900 mb-1">
              {resume.name}
            </h1>
            {resume.title && (
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                {resume.title}
              </h2>
            )}
            {resume.summary && (
              <p className="text-sm text-gray-700 leading-snug">
                {resume.summary}
              </p>
            )}
          </div>

          {/* Experience */}
          {resume.experience.length > 0 && (
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3 pb-1 border-b-2 border-gray-900">
                EXPERIENCE
              </h2>
              <div className="space-y-4">
                {resume.experience.map((exp, idx) => (
                  <div key={idx}>
                    <div className="mb-1">
                      <h3 className="font-bold text-base text-gray-900">{exp.title}</h3>
                      <div className="flex justify-between items-baseline">
                        <p className="text-sm text-gray-700">
                          {exp.company}
                        </p>
                        {exp.duration && (
                          <span className="text-sm text-gray-600 ml-4 flex-shrink-0">{exp.duration}</span>
                        )}
                      </div>
                    </div>
                    {exp.bullets.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {exp.bullets.map((bullet, bidx) => (
                          <li key={bidx} className="text-sm text-gray-700 flex items-start">
                            <span className="mr-2 mt-1.5 w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></span>
                            <span className="leading-tight">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column - Sidebar */}
        <div className={`${sidebarBgColor} p-6 pt-6`}>
          {/* Contact Info */}
          <div className="mb-4">
            <div className="space-y-1 text-sm">
              {resume.email && (
                <div>
                  <p className="text-gray-700 break-words">{resume.email}</p>
                </div>
              )}
              {resume.phone && (
                <div>
                  <p className="text-gray-700 break-words">{resume.phone}</p>
                </div>
              )}
              {resume.linkedin && (
                <div>
                  <p className="text-gray-700 break-words">{resume.linkedin}</p>
                </div>
              )}
              {resume.github && (
                <div>
                  <p className="text-gray-700 break-words">{resume.github}</p>
                </div>
              )}
              {resume.website && (
                <div>
                  <p className="text-gray-700 break-words">{resume.website}</p>
                </div>
              )}
            </div>
          </div>

          {/* Skills Categories */}
          {resume.skillCategories.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                Skills
              </h2>
              <div className="space-y-2">
                {resume.skillCategories.map((category, idx) => (
                  <div key={idx}>
                    <h3 className="text-xs font-semibold text-gray-900 mb-1">
                      {category.category}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {category.skills.map((skill, skillIdx) => (
                        <span
                          key={skillIdx}
                          className={`px-2 py-0.5 ${skillBgColor} text-xs rounded w-fit`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uncategorized Skills (fallback) */}
          {resume.skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                Skills
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {resume.skills.slice(0, 30).map((skill, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 ${skillBgColor} text-xs rounded w-fit`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {resume.languages.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                Languages
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {resume.languages.map((language, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 ${skillBgColor} text-xs rounded w-fit`}
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resume.education.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">
                Education
              </h2>
              <div className="space-y-2">
                {resume.education.map((edu, idx) => (
                  <div key={idx}>
                    {edu.school && (
                      <h3 className="font-semibold text-gray-900 text-sm">{edu.school}</h3>
                    )}
                    <p className="text-xs text-gray-700 whitespace-pre-line leading-tight">{edu.degree}</p>
                    {edu.year && (
                      <p className="text-xs text-gray-600">{edu.year}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
