# Setey Brhaney Haftie - Professional Portfolio

A responsive React portfolio with a private CV-management dashboard. The public portfolio is a frontend application; protected Vercel serverless API routes handle administrator sign-in and CV uploads. The CV is stored in Vercel Blob as a public PDF so portfolio visitors can download the current version. No database is used.

## What visitors can do

- View the portfolio, education, skills, internship, training, project areas, and contact details.
- Download the current public CV.
- Use the contact form, which validates the message and opens their email application. It does not store or send messages through a server.

Visitors do not receive an upload control. The `/admin` page is not linked in the public navigation. Someone who types `/admin` can reach the sign-in screen, but cannot see the authenticated dashboard or upload anything without the administrator password.

## How CV publishing works

1. The administrator opens `https://your-domain.vercel.app/admin`.
2. They enter the password configured only in Vercel environment variables.
3. The server issues a signed, HTTP-only, secure session cookie that expires after eight hours. The password and Blob credentials are never included in the browser bundle.
4. The administrator selects a PDF up to 50 MB and chooses **Upload and publish CV**.
5. The protected API validates the session, same-origin request, allowed CV path, PDF content type, and maximum size before issuing a short-lived upload token.
6. The browser uploads directly to Vercel Blob. Files larger than 4 MB use multipart transfer, so the file does not pass through the serverless function request-body limit.
7. Vercel Blob validates the restricted token and upload completion. The previous CV at the fixed path is overwritten.
8. The public portfolio reads the file's download URL from `/api/cv`. Visitors can download the new CV; they cannot upload or change it. After uploading, reload the public page if it was already open.

The CV itself is intentionally public. Anyone with the portfolio can download it. The dashboard is private, not the CV.
The Blob file uses a 60-second cache lifetime, so a recently cached download may take up to about a minute to reflect a replacement.

The included `public/Setey-Brhaney-Haftie-CV.pdf` is the fallback CV generated from the details supplied for this project. A CV uploaded through the dashboard is stored in Blob and takes precedence over that fallback. Older versions are overwritten at the same Blob path.

## One-time Vercel setup

### 1. Deploy the project

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Use the standard Vite settings:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`

### 2. Create public CV storage

1. Open the Vercel project's **Storage** tab and create a **Blob** store.
2. Choose **Public** access because visitors need to download the CV.
3. During setup, enable **Add a read-write token env var to this connection**. `handleUpload` needs this server-side token to create restricted upload tokens. The token stays in Vercel environment variables and is never included in the website bundle.
4. Connect the store to this Vercel project for Production and Preview. Vercel also supplies the store connection credentials used by the server API.

### 3. Add administrator secrets

In Vercel **Project Settings → Environment Variables**, add:

- `ADMIN_PASSWORD`: a unique password with at least 20 characters. Use a password manager to create and store it.
- `SESSION_SECRET`: a randomly generated secret with at least 32 characters. Generate one with:

  ```bash
  node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
  ```

Apply these secrets to the environments you will use (Production and, if needed, Preview). Never use `VITE_` in these variable names: `VITE_` values are exposed to the browser. Do not commit real credentials or `.env.local`.
Changing `SESSION_SECRET` invalidates existing admin sessions.

### 4. Redeploy and test

After connecting Blob and adding secrets, redeploy so the serverless functions receive the configuration. Then:

1. Visit `/admin` and sign in with `ADMIN_PASSWORD`.
2. Upload a PDF up to 50 MB.
3. Open the public portfolio and click **Download CV** to confirm the new file is served.
4. Sign out. Without the password, upload requests are rejected.

The login route is not linked from the public site and is marked `noindex`, but do not rely on an obscure URL as security. The password and API authorization are the access controls. Use a strong unique password; consider enabling Vercel Firewall rate limiting for `POST /api/admin/login` where available.

## Run and test locally

Requirements: Node.js 20.19+ or 22.12+, and npm.

```bash
npm install
npm run dev
```

`npm run dev` starts the Vite website. Vercel API routes require the Vercel development server. To test the complete admin/upload flow locally:

1. Sign in to Vercel and link this folder:

   ```bash
   npx vercel login
   npx vercel link
   ```

2. Connect a Blob store to the project's Development environment and configure the admin secrets in Vercel.
3. Pull Development environment values and start the full app:

   ```bash
   npx vercel env pull .env.local
   npm run dev:vercel
   ```

4. Open the local URL printed by Vercel (typically `http://localhost:3000`) and add `/admin`.

Keep `.env.local` private; it is ignored by Git. The `npm run dev` Vite preview on port 5173 does not serve the serverless API routes, so admin sign-in and uploads cannot work from that preview.

Run the code checks with:

```bash
npm test
npm run lint
npm run build
```

## Project structure

- `src/App.jsx` - Public portfolio page and visitor CV download links.
- `src/AdminDashboard.jsx` - Unlinked administrator login and upload interface.
- `src/data/content.js` - Portfolio content.
- `api/admin/` - Password login, session check, logout, and protected upload endpoints.
- `api/cv.js` - Provides the current public CV download URL.
- `server/adminAuth.js` - Signed session and origin-validation helpers.
- `public/images/setey.jpg` - Provided portrait.
- `public/Setey-Brhaney-Haftie-CV.pdf` - Included fallback CV.
- `.env.example` - Names and minimum requirements for administrator secrets; it contains no real credentials.
- `tests/adminAuth.test.js` - Authentication, origin, and invalid-upload tests.
- `vercel.json` - Rewrites `/admin` to the React app and prevents indexing that path.

The project does not use a database. Vercel Blob stores the public CV; server-side Vercel environment variables hold the administrator and Blob credentials.
