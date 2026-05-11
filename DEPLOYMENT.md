# Deploying to cPanel (Node.js App)

This site is a Next.js 16 application that needs a Node.js runtime. cPanel
supports this via the **Setup Node.js App** tool (Phusion Passenger under the
hood). This guide walks through a clean first deploy.

## Prerequisites

- cPanel account with Node.js support (Node 20 or later recommended).
- A MongoDB Atlas cluster (free M0 tier is fine).
- A Cloudinary account (free tier).
- A domain pointed at your cPanel host with AutoSSL enabled.

## 1. Build locally

```bash
npm ci
npm run build:cpanel
```

`build:cpanel` runs `next build` and then copies `public/` and `.next/static/`
into the standalone bundle so the runtime is self-contained.

Verify locally:

```bash
PORT=3000 npm run start:standalone
# → http://localhost:3000 should serve the site
```

## 2. Upload the project

Two options:

**A. cPanel Git Version Control** (recommended)

1. cPanel → **Git Version Control** → **Create**.
2. Point at your remote repo, clone path e.g. `~/repos/atharnur-travels`.
3. Edit `.cpanel.yml` in this repo — change `DEPLOYPATH` to your live folder
   (e.g. `/home/<cpanel-user>/atharnurtravels.com`).
4. Use cPanel's "Pull or Deploy" button. The `.cpanel.yml` `deployment.tasks`
   block will copy files, `npm ci --omit=dev`, run `build:cpanel`, and touch
   `tmp/restart.txt` to trigger a Passenger restart.

**B. Manual upload**

1. Zip everything **except** `node_modules/`, `.next/`, `.env.local`, `.git/`.
2. Upload via cPanel File Manager and extract into your app folder.

## 3. Configure the Node.js App

cPanel → **Setup Node.js App** → **Create Application**:

| Field | Value |
|---|---|
| Node.js version | 20.x or higher |
| Application mode | Production |
| Application root | Path to the uploaded project (e.g. `atharnurtravels.com`) |
| Application URL | Your domain (e.g. `atharnurtravels.com`) |
| Application startup file | `server.js` |
| Passenger log file | leave default |

Click **Create**. cPanel will inject Passenger directives into your
`.htaccess` automatically.

## 4. Install dependencies

In the Node.js App page click **Run NPM Install** (or from cPanel Terminal):

```bash
cd ~/atharnurtravels.com
npm ci --omit=dev
```

## 5. Set environment variables

In the Node.js App page, expand **Environment variables**. Add every value
from `.env.example` that applies — at minimum:

- `MONGODB_URI`
- `NEXTAUTH_SECRET` (generate fresh — never reuse the dev one)
- `NEXTAUTH_URL` (your real HTTPS domain)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_WHATSAPP_NUMBER`

Click **Save**.

## 6. Build on the server

If you used Git Version Control, the build already happened. Otherwise, from
cPanel Terminal (inside the app's virtualenv):

```bash
cd ~/atharnurtravels.com
npm run build:cpanel
```

## 7. Restart and verify

Node.js App page → **Restart** (or `touch tmp/restart.txt`).

Visit:

- `https://yourdomain.com` — public site loads.
- `https://yourdomain.com/admin/login` — login form (no infinite redirect).
- Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` → dashboard.
- Try creating a package with an image upload — Cloudinary should receive it.
- Submit a public enquiry form → row appears under `/admin/enquiries`.

## Troubleshooting

- **`Missing required environment variable: NEXTAUTH_SECRET`** — set it in
  the Node.js App env vars and restart.
- **Login form does nothing** — verify `NEXTAUTH_URL` matches the exact
  protocol + domain you're using. Cookie domain mismatches kill sign-in.
- **`Image upload is not configured`** — Cloudinary env vars missing.
- **Build runs out of memory** — add `NODE_OPTIONS=--max-old-space-size=1024`
  to the env vars (cPanel containers are typically RAM-constrained).
- **Static assets 404** — make sure `build:cpanel` ran successfully and
  `.next/standalone/public/` plus `.next/standalone/.next/static/` exist.

## Updating the site

```bash
# Local
git push

# On cPanel (Git VC users)
# → cPanel → Git Version Control → "Pull or Deploy"

# Or via SSH
cd ~/atharnurtravels.com
git pull
npm ci --omit=dev
npm run build:cpanel
touch tmp/restart.txt   # Passenger graceful restart
```

## Security hardening (recommended follow-ups)

- Enable AutoSSL on the domain (cPanel → SSL/TLS Status).
- Rotate `NEXTAUTH_SECRET` and `ADMIN_PASSWORD` periodically.
- Whitelist your cPanel IP in MongoDB Atlas Network Access; remove the
  `0.0.0.0/0` allow-all entry after first connection.
- Add rate limiting on `/api/auth/*` (e.g. via Cloudflare in front of the
  domain) — not bundled with the app for portability.
