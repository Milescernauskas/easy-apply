# Easy Apply - Job Application Optimizer

An AI-powered web application that helps job seekers optimize their resumes and cover letters for specific job applications using GPT-5.

## Features

- **Job Description Analysis**: Extract key skills, qualifications, and keywords from job postings
- **Resume Optimization**: Automatically tailor your resume to match job requirements
- **Cover Letter Generation**: Create personalized cover letters for each application
- **ATS Scoring**: Get real-time feedback on how well your resume matches ATS requirements
- **Multiple Export Formats**: Export optimized documents as PDF, DOCX, or plain text
- **Version Management**: Database schema supports saving and comparing multiple versions

## Tech Stack

- **Frontend**: Next.js 14+ with React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Vercel AI SDK with AI Gateway (GPT-5)
- **Deployment**: Vercel
- **Export**: jsPDF, docx libraries

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or hosted)
- Vercel AI Gateway API key (get from https://vercel.com/dashboard)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd easy-apply
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `AI_GATEWAY_API_KEY`: Your Vercel AI Gateway API key (starts with `vck_`)

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Enter Job Details**: Paste the job description, title, and company name
2. **Upload Documents**: Provide your current resume and generic cover letter
3. **Analyze**: Click to analyze the job description with AI
4. **Optimize**: Review the analysis and click to optimize your documents
5. **Export**: Download optimized resume and cover letter in your preferred format

## Deployment to Vercel

1. Push your code to GitHub

2. Import the project in Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. Set up Vercel AI Gateway:
   - Go to Vercel Dashboard → AI → Gateway
   - Create a new API key
   - Configure it to route to OpenAI

4. Configure environment variables in Vercel:
   - `DATABASE_URL`: Your production PostgreSQL connection string
   - `AI_GATEWAY_API_KEY`: Your Vercel AI Gateway API key

5. Deploy! Vercel will automatically build and deploy your application

## Database Schema

The application includes models for:
- `User`: User accounts (for future authentication)
- `Job`: Job postings and their AI analysis
- `Resume`: Resume versions with ATS scores
- `CoverLetter`: Cover letter versions
- `ResumeVersion` & `CoverLetterVersion`: Version history tracking

To view the schema:
```bash
npx prisma studio
```

## Development Commands

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

## License

ISC
