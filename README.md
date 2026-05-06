# AI FM (aifm.ro)

Radio non-stop, condus de un AI care nu doarme. Gazda: **Vio**.

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind
- Neon Postgres (Drizzle ORM)
- Cloudflare R2 (audio storage)
- Vercel hosting

## Local dev
```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

## Backend Setup

### 1. Neon Postgres
1. In Vercel project → **Storage → Create Database → Neon**.
2. Vercel auto-injects `DATABASE_URL` into all environments.
3. Run schema migration locally (with the same `DATABASE_URL` in `.env.local`):
   ```bash
   npx drizzle-kit push
   ```
4. Seed the 20 starter songs via the admin-protected route after first deploy:
   ```
   POST https://aifm.ro/api/admin/seed   (with admin cookie)
   ```

### 2. Cloudflare R2
1. Cloudflare dashboard → **R2 → Create bucket** → name it `aifm-tracks`.
2. **R2 → Manage R2 API Tokens → Create API Token** with read/write access to the bucket.
3. Set in Vercel env vars:
   - `R2_ACCOUNT_ID` — Cloudflare account id
   - `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` — token credentials
   - `R2_BUCKET=aifm-tracks`
   - `R2_PUBLIC_URL` — either the bucket's public dev URL or a custom domain (e.g. `https://tracks.aifm.ro`). Bucket must allow public reads for streaming.

### 3. Admin auth
- `ADMIN_PASSWORD` — your password (single admin).
- `ADMIN_SECRET` — random 32+ byte hex; signs the admin cookie. Generate:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- Login at `/admin/login`.

See `.env.example` for the full list.

## Roadmap
- v2 ✅ Live synchronized timeline (this build)
- v3: AI host script generator + ElevenLabs voice
- v4: Telegram bot intake → host reads on-air
- v5: Spotify channel + jingle releases
