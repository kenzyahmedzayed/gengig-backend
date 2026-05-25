# Gengig Backend

NestJS backend for Gengig, prepared for deployment on Vercel serverless functions.

## Local Setup

```bash
npm install
cp .env.example .env
npm run start:dev
```

## Required Environment Variables

Set these in Vercel Project Settings -> Environment Variables:

- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_EXPIRES_IN` (optional, default `7d`)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `MAIL_USER`
- `MAIL_PASS`
- `MAIL_FROM` (optional)
- `MAIL_HOST` (optional, default `smtp.gmail.com`)
- `MAIL_PORT` (optional, default `465`)
- `MAIL_SECURE` (optional, default `true`)
- `GROQ_API_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `PAYMOB_API_KEY`
- `PAYMOB_INTEGRATION_ID`
- `PAYMOB_IFRAME_ID`
- `CORS_ORIGINS` (comma-separated list)

## Deploy To Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. Import the project in Vercel.
3. Keep framework preset as `Other`.
4. Vercel will use `vercel.json` and deploy `api/index.ts` as a serverless function.
5. Add all environment variables listed above for `Production` (and `Preview` if needed).
6. Deploy.

## Notes

- WebSockets are disabled in the serverless handler path, since Vercel serverless functions are request/response based.
- Swagger will be available at `/api/docs`.
