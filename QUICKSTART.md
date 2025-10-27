# Quick Start Guide

Get Easy Apply running in 5 minutes!

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```
DATABASE_URL="postgresql://user:password@localhost:5432/easyapply"
AI_GATEWAY_API_KEY="your-vercel-ai-gateway-key-here"
```

To get a Vercel AI Gateway API key:
- Go to https://vercel.com/dashboard
- Navigate to AI → Gateway
- Create a new API key (it will start with `vck_`)

## 3. Set Up Database

If you have PostgreSQL running locally:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

Don't have PostgreSQL? You can:
- Install locally: https://www.postgresql.org/download/
- Use a hosted service: https://neon.tech or https://supabase.com (free tiers available)

## 4. Run the Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## 5. Test the Application

1. Enter a job title, company, and paste a job description
2. Paste your resume and cover letter
3. Click "Analyze Job Description"
4. Review the analysis and click "Optimize Resume & Cover Letter"
5. View your optimized documents and ATS score
6. Export in your preferred format (PDF, DOCX, TXT)

## Deploy to Vercel

1. Push your code to GitHub
2. Go to https://vercel.com and import your repository
3. Set up Vercel AI Gateway in your Vercel dashboard (AI → Gateway)
4. Add environment variables in Vercel settings:
   - `DATABASE_URL` (use Vercel Postgres or external PostgreSQL)
   - `AI_GATEWAY_API_KEY`
5. Deploy!

## Troubleshooting

**"Missing AI_GATEWAY_API_KEY" error**
- Make sure you created `.env` file and added your Vercel AI Gateway API key
- Restart the dev server after adding environment variables

**Database connection errors**
- Verify PostgreSQL is running
- Check your DATABASE_URL format: `postgresql://user:password@host:port/database`
- Try `npx prisma db push` again

**GPT-5 not available**
- If you don't have GPT-5 access via Vercel AI Gateway, set the `AI_MODEL` environment variable to `openai/gpt-4-turbo` or `openai/gpt-4.1`
- Add this to your `.env` file: `AI_MODEL="openai/gpt-4-turbo"`

## Next Steps

- Read `README.md` for detailed documentation
- Check `CLAUDE.md` for architecture and development guidance
- Explore the Prisma schema in `prisma/schema.prisma`
