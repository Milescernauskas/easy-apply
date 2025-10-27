# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Easy Apply is a Next.js 14+ web application that helps job seekers optimize their resumes and cover letters using AI (OpenAI GPT-5). Users paste a job description, their resume, and a generic cover letter, and the app analyzes the job requirements and tailors the documents to maximize interview chances.

## Architecture

### Tech Stack
- **Frontend**: Next.js 14+ App Router, React 19, TypeScript, TailwindCSS 4
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Vercel AI SDK with AI Gateway (GPT-5 via gateway)
- **Deployment**: Vercel
- **Export**: jsPDF (PDF), docx (DOCX), file-saver

### Directory Structure
```
/app                    # Next.js App Router pages and API routes
  /api                  # API route handlers
    /analyze            # Job description analysis endpoint
    /optimize-resume    # Resume optimization endpoint
    /generate-cover-letter  # Cover letter generation endpoint
    /ats-score          # ATS scoring endpoint
  layout.tsx           # Root layout with metadata
  page.tsx             # Main application page (client component)
  globals.css          # Global styles with Tailwind directives

/components            # React components
  JobForm.tsx          # Job details input form
  DocumentUpload.tsx   # Resume/cover letter upload component
  AnalysisDisplay.tsx  # Job analysis results display
  ATSScoreCard.tsx     # ATS score visualization
  ExportButtons.tsx    # Export to PDF/DOCX/TXT buttons

/lib                   # Core business logic
  openai.ts            # OpenAI GPT-5 integration and prompts
  ats.ts               # ATS optimization scoring engine
  export.ts            # Document export utilities
  prisma.ts            # Prisma client singleton

/prisma
  schema.prisma        # Database schema and models
```

## Key Concepts

### Application Flow
1. **Input Phase**: User enters job details (title, company, description) and pastes resume + cover letter
2. **Analysis Phase**: GPT-5 analyzes job description to extract:
   - Key skills (technical and soft)
   - Required/preferred qualifications
   - Company values
   - ATS keywords
   - Experience level
3. **Optimization Phase**: GPT-5 optimizes documents:
   - Resume: Reorders/emphasizes relevant experience, incorporates keywords
   - Cover Letter: Tailors to specific company/role, highlights matching experience
4. **Results Phase**: Display optimized documents with ATS scores and export options

### AI Prompts (lib/openai.ts)
Uses Vercel AI SDK's `generateText()` function with model identifier format (e.g., 'openai/gpt-5').
All prompts use structured JSON responses for reliability. Key functions:
- `analyzeJobDescription()`: Extracts structured data from job posting
- `optimizeResume()`: Returns optimized content + change log + suggestions
- `generateCoverLetter()`: Creates tailored cover letter with key points highlighted

Temperature settings:
- Analysis: 0.3 (deterministic)
- Resume optimization: 0.4 (balanced)
- Cover letter: 0.6 (creative but focused)

Model configuration:
- Default model: `openai/gpt-5` (configurable via `AI_MODEL` env var)
- API key automatically used from `AI_GATEWAY_API_KEY` environment variable

### ATS Scoring (lib/ats.ts)
Calculates a 0-100 score based on:
- Keyword Match (40%): Matches against job skills/qualifications/keywords
- Formatting (20%): Checks for ATS-friendly formatting (no special chars, tabs)
- Length (15%): Optimal word count (400-800 words)
- Sections (25%): Presence of required sections (Contact, Experience, Education, Skills)

Returns detailed breakdown, recommendations, and matched/missing keywords.

### Database Schema
The schema supports version management (currently not exposed in UI):
- `User`: For future multi-user support
- `Job`: Stores job postings and their AI analysis (JSON field)
- `Resume` / `CoverLetter`: Stores documents with ATS scores
- `ResumeVersion` / `CoverLetterVersion`: Tracks revision history

## Common Development Commands

### Setup and Database
```bash
npm install                    # Install dependencies
npx prisma generate           # Generate Prisma client
npx prisma db push            # Push schema to database (dev)
npx prisma migrate dev        # Create migration (production-ready)
npx prisma studio             # Open database GUI
```

### Development
```bash
npm run dev                    # Start dev server (localhost:3000)
npm run build                  # Production build (runs prisma generate first)
npm run start                  # Start production server
npm run lint                   # Run ESLint
```

## Environment Variables

Required:
- `DATABASE_URL`: PostgreSQL connection string (format: `postgresql://user:password@host:port/database`)
- `AI_GATEWAY_API_KEY`: Vercel AI Gateway API key (format: `vck_...`)

Optional:
- `AI_MODEL`: AI model to use (default: `openai/gpt-5`, alternatives: `openai/gpt-4-turbo`, `openai/gpt-4.1`)

Example (.env.example included):
```
DATABASE_URL="postgresql://user:password@localhost:5432/easyapply"
AI_GATEWAY_API_KEY="vck_..."
AI_MODEL="openai/gpt-5"
```

To get a Vercel AI Gateway API key:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → AI → Gateway
2. Create a new API key
3. Configure it to route to OpenAI with GPT-5 access

## Deployment to Vercel

The app is configured for Vercel deployment with `vercel.json`:
- Build command includes `prisma generate` before Next.js build
- Environment variables must be set in Vercel dashboard
- Uses Vercel Postgres or external PostgreSQL database
- Vercel AI Gateway is automatically configured when deployed to Vercel

### Deployment Steps
1. Push code to GitHub
2. Import project in Vercel
3. Set up Vercel AI Gateway in Vercel dashboard (AI → Gateway)
4. Set environment variables: `DATABASE_URL`, `AI_GATEWAY_API_KEY`
5. Deploy (automatic on future commits)

## Important Notes

### Vercel AI SDK Integration
- The app uses Vercel AI SDK's `generateText()` function (lib/openai.ts)
- Model identifier format: `openai/gpt-5` (provider/model pattern)
- All prompts request JSON responses, parsed with `JSON.parse(text)`
- To use a different model, set `AI_MODEL` env var (e.g., `openai/gpt-4-turbo`)
- Vercel AI Gateway provides caching, rate limiting, and cost tracking automatically

### Client vs Server Components
- `app/page.tsx` is a client component ('use client') for interactivity
- All `/app/api/*` routes are server-side only
- Components in `/components` are client components by default
- Prisma client is only used in API routes (server-side)

### TypeScript Types
- Shared types defined in lib files (e.g., `JobAnalysis`, `ResumeOptimization`)
- Import types from lib files, not from API routes
- All components use strict TypeScript

### Styling
- TailwindCSS 4.x with dark mode support
- Uses CSS variables for theming (--background, --foreground)
- Responsive design with mobile-first approach

## Future Enhancements (Not Yet Implemented)

The database schema supports but UI doesn't expose:
- User authentication and multi-user support
- Saving multiple job applications per user
- Version history and comparison
- Batch processing multiple applications

If implementing these features:
1. Add authentication (NextAuth.js recommended)
2. Update API routes to filter by authenticated user
3. Build UI for managing saved applications
4. Implement version comparison view
