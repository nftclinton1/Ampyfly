# AMPYFLY — Production Deployment Guide

## Quick Start (Local)
1. Install Node.js 22+ LTS.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Generate your private Admin bcrypt password hash (never store plaintext):
   ```bash
   node -e "import('bcryptjs').then(b => console.log(b.default.hashSync('YOUR_STRONG_PASSWORD', 12)))"
   ```
5. Paste the `$2b$12$...` hash into `ADMIN_PASSWORD_HASH` in `.env`, and set a 64-character random string for `JWT_SECRET`.
6. Start the server: `npm start`
7. Public site: `http://localhost:3000`
8. Hidden Admin Ops Gate (no public link on site): `http://localhost:3000/#ops`

## Production Deploy (Render / Railway / Fly.io + Supabase)
1. Create a PostgreSQL database on Supabase or Render and execute `schema.sql` once.
2. Push this folder to a **private** GitHub repository (`.env` is gitignored).
3. Connect the repository to Render or Railway:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Configure Environment Variables in your host dashboard:
   - `NODE_ENV=production`
   - `DATABASE_URL=<your-postgres-uri>`
   - `ADMIN_EMAIL=ampyflybusiness@gmail.com`
   - `ADMIN_PASSWORD_HASH=<your-bcrypt-hash>`
   - `JWT_SECRET=<64-char-random-hex>`
   - `BRIEF_TO_EMAIL=ampyflybusiness@gmail.com`
   - Optional SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) for direct server-side email forwarding.
5. Attach your custom domain (`ampyfly.com`) and verify `https://ampyfly.com/#ops`.
