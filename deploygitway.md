# Deploy Athar Nur Travels to cPanel with GitHub CI/CD

A hand-holding, top-to-bottom walkthrough. Follow it in order — every step is
a thing you do in a shell, in the cPanel UI, or in the GitHub UI.

**What you'll have at the end:** push a commit to GitHub's `main` branch →
the live site at `https://atharnurtravels.com` updates automatically within
2–4 minutes. No manual cPanel clicks.

The guide is in seven parts:

- Part 0 — Before you start (what you need)
- Part 1 — Set up external services (MongoDB, Cloudinary, secrets)
- Part 2 — First manual deploy to cPanel (one-time, to prove it works)
- Part 3 — Wire up GitHub Actions CI/CD (the automation)
- Part 4 — Fallback: cPanel Git Version Control (if Part 3 isn't an option)
- Part 5 — Day-to-day workflow (developing, rolling back)
- Part 6 — Troubleshooting
- Part 7 — Security hardening

Throughout the guide, replace these placeholders with your real values:

| Placeholder | Example |
|---|---|
| `<cpanel-user>` | Your cPanel login username, e.g. `atharnur` |
| `<cpanel-host>` | The SSH hostname for your cPanel server, e.g. `atharnurtravels.com` or `serverNN.host.com` |
| `<cpanel-port>` | SSH port shown in cPanel → SSH Access (often `22`, sometimes `2083`) |

---

## Part 0 — Before you start

You need:

- A **cPanel hosting account** that includes:
  - **Setup Node.js App** (Phusion Passenger) — Node 20 or newer.
  - **SSH Access** — some shared hosts require a support ticket to enable
    shell access. If you're not sure, ask your host now; the rest of this
    guide assumes SSH works.
- A **GitHub repo** with the code already pushed. This guide uses
  `https://github.com/proffesergio/an-travel-agency.git`.
- A **MongoDB Atlas** account (free M0 tier is enough).
- A **Cloudinary** account (free tier).
- The **domain** `atharnurtravels.com` already pointed at your cPanel host,
  with AutoSSL turned on (cPanel → SSL/TLS Status).

What we'll touch over the course of the guide:

- **Local machine:** generate an SSH key, add one GitHub Actions workflow file.
- **cPanel UI:** enable SSH, create a Node.js App, paste environment variables.
- **GitHub UI:** add four repository secrets.

---

## Part 1 — Set up external services (do once)

These services hold the data your site needs. Collect the values as you go —
you'll paste them into cPanel in Part 2.

Open a scratch text file and fill in each row as you complete that step:

```
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://atharnurtravels.com
ADMIN_EMAIL=
ADMIN_PASSWORD=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_APP_URL=https://atharnurtravels.com
NEXT_PUBLIC_WHATSAPP_NUMBER=8801843431743
```

(The full list is in `.env.example` in this repo — use that as your reference.)

### 1.1 MongoDB Atlas

1. Sign up / log in at <https://www.mongodb.com/cloud/atlas>.
2. **Build a Database** → **M0** (free) → choose a region close to your cPanel
   host → **Create Cluster**.
3. **Database Access** (left sidebar) → **Add New Database User** → username
   + strong password → role **Read and write to any database** → Add User.
4. **Network Access** → **Add IP Address** → for now click **Allow Access
   from Anywhere** (`0.0.0.0/0`). You will tighten this in Part 7.
5. Back on the cluster page → **Connect** → **Drivers** → copy the
   connection string. It looks like:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Edit it so the path includes the database name `atharnur-travels`:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/atharnur-travels?retryWrites=true&w=majority
   ```
   This is your `MONGODB_URI`.

### 1.2 Cloudinary

1. Sign up at <https://cloudinary.com/users/register/free>.
2. After login, go to the **Dashboard**. The top section shows:
   - **Cloud name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** (click "reveal") → `CLOUDINARY_API_SECRET`

### 1.3 NextAuth signing secret

Run this locally:

```bash
openssl rand -base64 32
```

Paste the output as your `NEXTAUTH_SECRET`. It must be at least 32 characters
and unique to production — do not reuse your dev value.

### 1.4 Admin credentials

Choose values for:

- `ADMIN_EMAIL` — e.g. `admin@atharnurtravels.com` (does not need to be a real
  inbox; it's just the login identifier).
- `ADMIN_PASSWORD` — a long passphrase. Save it in a password manager.

### 1.5 Confirm domain

- `NEXTAUTH_URL=https://atharnurtravels.com`
- `NEXT_PUBLIC_APP_URL=https://atharnurtravels.com`

(If you eventually canonicalize on `www.`, use `https://www.atharnurtravels.com`
in both — they must match the URL users actually visit, or sign-in cookies
break.)

You should now have every value in your scratch file. Keep it open for Part 2.

---

## Part 2 — First manual deploy

This pass exists to prove the server can run the app at all. Once it works,
Part 3 automates the rest.

### 2.1 Verify the build works locally

```bash
cd ~/atharnur-travels
npm ci
npm run build:cpanel
PORT=3000 npm run start:standalone
```

Visit <http://localhost:3000> — the site should render. Stop the server
(Ctrl-C).

If this step fails, fix it before continuing — the cPanel build will fail the
same way.

### 2.2 Enable SSH on cPanel

1. cPanel → **SSH Access**.
2. **Manage SSH Keys** → **Generate a New Key**:
   - Key Name: `deploy_key`
   - Type: `RSA`, Size: `4096`
   - Passphrase: **leave blank**. (A passphrase would force you to type it
     every time you SSH in, and CI/CD can't type it. The key's security comes
     from keeping the private file secret.)
3. Click **Manage** next to the new key → **Authorize**.
4. Go back to **SSH Access** (top of the page). Note the **hostname** and
   **port** shown — this is your `<cpanel-host>` and `<cpanel-port>`.
5. Click **Manage SSH Keys** → next to `deploy_key` click **View/Download** →
   **Download Key** (the private one, no `.pub` extension). Save it locally as
   `~/.ssh/cpanel_deploy_key` and protect it:

   ```bash
   chmod 600 ~/.ssh/cpanel_deploy_key
   ```

6. Test the connection from your local machine:

   ```bash
   ssh -i ~/.ssh/cpanel_deploy_key -p <cpanel-port> <cpanel-user>@<cpanel-host>
   ```

   You should land in a shell prompt on the server. If it asks "Are you sure
   you want to continue connecting?", type `yes`. If it fails with "Permission
   denied", recheck steps 2–3. If it times out, ask your host to enable shell
   access for your account.

   Type `exit` to leave when the connection works.

### 2.3 Create the Node.js App in cPanel

1. cPanel → **Setup Node.js App** → **Create Application**.
2. Fill in:

   | Field | Value |
   |---|---|
   | Node.js version | `20.x` (or newer) |
   | Application mode | `Production` |
   | Application root | `public_html` |
   | Application URL | `atharnurtravels.com` |
   | Application startup file | `server.js` |

3. Click **Create**. cPanel will inject Passenger directives at the top of
   `public_html/.htaccess`. **Do not edit between the BEGIN/END PASSENGER
   markers** — your existing rules below the markers are untouched.

### 2.4 Get the code onto the server

SSH in:

```bash
ssh -i ~/.ssh/cpanel_deploy_key -p <cpanel-port> <cpanel-user>@<cpanel-host>
```

Then on the server:

```bash
cd ~/public_html
# public_html may contain a default index.html — move it aside
mv index.html index.html.bak 2>/dev/null || true
# Clone the repo's contents into the current directory (note the trailing dot)
git clone https://github.com/proffesergio/an-travel-agency.git .
```

If the directory isn't empty, git will refuse to clone. Either remove the
default files (`rm index.html cgi-bin -rf` — careful, only remove things you
recognise) or clone elsewhere first and `mv`/`rsync` the contents in.

### 2.5 Enter the Node.js virtualenv

On the **Setup Node.js App** page, find the line at the top labelled "Enter to
the virtual environment". It looks like:

```
source /home/<cpanel-user>/nodevenv/public_html/20/bin/activate && cd /home/<cpanel-user>/public_html
```

Copy and run that exact line in your SSH session. Your prompt will gain a
prefix like `(public_html:20)` — this means `npm` and `node` now point at the
right Node version. **Always run this before `npm` commands over SSH.**

### 2.6 Install and build on the server

Still in the SSH session, virtualenv active:

```bash
npm ci --omit=dev
npm run build:cpanel
```

The build takes 1–3 minutes. If it runs out of memory, see Part 6.

### 2.7 Set environment variables in cPanel

cPanel → **Setup Node.js App** → click the pencil/edit icon next to your app
→ scroll to **Environment variables** → **Add Variable** for each row of your
scratch file from Part 1. After adding them all, click **Save**.

Why here and not in `.env.local`? Passenger only loads env vars from this
cPanel UI; a `.env.local` file checked into the repo wouldn't take effect, and
checking real secrets into git is unsafe regardless. The repo's `.gitignore`
already excludes `.env.local`.

### 2.8 Restart and verify

In your SSH session:

```bash
mkdir -p ~/public_html/tmp
touch ~/public_html/tmp/restart.txt
```

Then visit:

- `https://atharnurtravels.com` — homepage loads.
- `https://atharnurtravels.com/admin/login` — login form (no redirect loop).
- Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` → dashboard loads.
- From the homepage, submit a public enquiry form → appears under
  `/admin/enquiries`.

If any of those fail, jump to Part 6 (Troubleshooting). Once they all pass,
you have a working manual deploy — now automate it.

---

## Part 3 — GitHub Actions CI/CD (the main event)

After this section, every push to `main` triggers a live deploy automatically.

### 3.1 Generate a dedicated deploy keypair locally

Don't reuse `cpanel_deploy_key` from Part 2 — that one's for you. Generate a
separate keypair that lives only inside GitHub Actions, so you can revoke it
without losing your own SSH access.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/atharnur_deploy -N "" -C "github-actions-deploy"
```

Two files appear:

- `~/.ssh/atharnur_deploy` — private key (goes into GitHub Secrets).
- `~/.ssh/atharnur_deploy.pub` — public key (goes into cPanel).

### 3.2 Authorize the public key on cPanel

1. Print the public key locally:

   ```bash
   cat ~/.ssh/atharnur_deploy.pub
   ```

   Copy the entire single line (starts with `ssh-ed25519`).

2. cPanel → **SSH Access** → **Manage SSH Keys** → **Import Key**:
   - Choose: **Public Key**
   - Name: `github_actions`
   - Paste the public key into the **Public Key** box.
   - Click **Import**.
3. Back on the SSH key list, click **Manage** next to `github_actions` →
   **Authorize**.
4. Test from your local machine:

   ```bash
   ssh -i ~/.ssh/atharnur_deploy -p <cpanel-port> <cpanel-user>@<cpanel-host> 'echo ok'
   ```

   Output should be `ok`. If you see "Permission denied (publickey)", the
   public key wasn't authorised — repeat step 3.

### 3.3 Add the four GitHub repo secrets

1. Go to <https://github.com/proffesergio/an-travel-agency> →
   **Settings** → **Secrets and variables** → **Actions** → **New repository
   secret**.
2. Add each of these:

   | Name | Value |
   |---|---|
   | `CPANEL_HOST` | Your `<cpanel-host>` from Part 2.2 |
   | `CPANEL_PORT` | Your `<cpanel-port>` from Part 2.2 |
   | `CPANEL_USER` | Your cPanel username |
   | `CPANEL_SSH_KEY` | Entire contents of `~/.ssh/atharnur_deploy` — open the file, copy from `-----BEGIN OPENSSH PRIVATE KEY-----` through `-----END OPENSSH PRIVATE KEY-----` (inclusive), paste the whole block |

   To grab the private key contents on macOS/Linux:

   ```bash
   cat ~/.ssh/atharnur_deploy
   ```

   On Windows (PowerShell): `Get-Content $HOME\.ssh\atharnur_deploy`.

### 3.4 Create the workflow file

In your local clone of the repo:

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/deploy.yml` with this exact content:

```yaml
name: Deploy to cPanel

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-cpanel
  cancel-in-progress: false

jobs:
  deploy:
    name: SSH deploy
    runs-on: ubuntu-latest
    if: "!contains(github.event.head_commit.message, '[skip ci]')"
    steps:
      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.CPANEL_HOST }}
          port: ${{ secrets.CPANEL_PORT }}
          username: ${{ secrets.CPANEL_USER }}
          key: ${{ secrets.CPANEL_SSH_KEY }}
          script: |
            set -e
            cd ~/public_html
            git fetch --all --prune
            git reset --hard origin/main
            source /home/${USER}/nodevenv/public_html/20/bin/activate
            npm ci --omit=dev
            npm run build:cpanel
            mkdir -p tmp
            touch tmp/restart.txt
            echo "Deploy complete at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

Notes on the script:

- `git reset --hard origin/main` is intentional — it makes the server clone
  exactly match GitHub, even if a previous deploy left files dirty. GitHub is
  the source of truth; the server clone is disposable.
- The `nodevenv` path uses Node 20. If your cPanel app is on a different Node
  version, change `20` to match (see your cPanel Node.js App page).
- `appleboy/ssh-action@v1.0.3` is pinned to a specific version for
  reproducibility.

### 3.5 Push the workflow

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add cPanel deploy workflow"
git push origin main
```

### 3.6 Watch the first run

1. Go to <https://github.com/proffesergio/an-travel-agency/actions>.
2. You should see the **Deploy to cPanel** workflow running.
3. Click into it → click the `SSH deploy` job → expand each step.
4. Success looks like a green check and a final line `Deploy complete at ...`.
5. Visit `https://atharnurtravels.com` and confirm the site still works.

If the run fails, jump to Part 6 — the "Permission denied (publickey)" and
"build out of memory" errors are the usual suspects on a first run.

### 3.7 Verify end-to-end automation

This is the acceptance test that proves the whole pipeline works:

1. Edit something visible — open `app/[locale]/page.tsx` and tweak a heading.
2. Commit and push:

   ```bash
   git commit -am "test: verify CI/CD"
   git push origin main
   ```

3. Watch the Actions tab — workflow runs to green in ~2–4 minutes.
4. Reload `https://atharnurtravels.com` — new heading visible, with no manual
   cPanel action.
5. Sanity check Passenger restarted:

   ```bash
   ssh -i ~/.ssh/cpanel_deploy_key -p <cpanel-port> <cpanel-user>@<cpanel-host> \
     'ls -l ~/public_html/tmp/restart.txt'
   ```

   The mtime should be within the last few minutes.

You now have continuous deployment. The rest of this document is reference
material.

---

## Part 4 — Fallback: cPanel Git Version Control

Use this only if Part 3 isn't workable — for example, your host blocks
outbound SSH or your plan doesn't include shell access.

The trade-off: cPanel Git VC does not auto-pull on every GitHub push. It gives
you a **"Pull or Deploy"** button to click, or a webhook URL if your host
exposes one. So it's "one-click deploy" rather than "hands-off CI/CD".

### 4.1 Connect the repo

1. cPanel → **Git Version Control** → **Create**.
2. Clone URL: `https://github.com/proffesergio/an-travel-agency.git`.
   - **For a private repo**: use a GitHub fine-grained personal access token
     in the URL — `https://<token>@github.com/proffesergio/an-travel-agency.git`.
     Generate the token at <https://github.com/settings/personal-access-tokens/new>,
     scope it to **only this repo** with read-only access. The token will be
     stored on the cPanel filesystem, so keep its scope minimal.
3. Repository Path: `/home/<cpanel-user>/repos/atharnur-travels`.
4. Repository Name: `atharnur-travels`.
5. Click **Create**.

### 4.2 Wire up the `.cpanel.yml` deploy hook

The repo already contains `.cpanel.yml`, but the deploy path is a placeholder.
Edit it locally:

```yaml
---
deployment:
  tasks:
    - export DEPLOYPATH=/home/<cpanel-user>/public_html
    - /bin/cp -R ./* $DEPLOYPATH
    - /bin/cp -R ./.htaccess $DEPLOYPATH/.htaccess
    - cd $DEPLOYPATH && npm ci --omit=dev
    - cd $DEPLOYPATH && npm run build:cpanel
    - mkdir -p $DEPLOYPATH/tmp && touch $DEPLOYPATH/tmp/restart.txt
```

Replace `<cpanel-user>` with your actual username. Commit and push:

```bash
git add .cpanel.yml
git commit -m "ci: point cpanel deploy path at public_html"
git push origin main
```

### 4.3 Run the deploy

cPanel → Git Version Control → click **Manage** on the repo → **Pull or
Deploy** tab → **Update from Remote** → then **Deploy HEAD Commit**.

Every time you push to GitHub, return to this page and click those two
buttons. (Some hosts expose a webhook URL on this page that GitHub can call —
if yours does, add it as a GitHub webhook under your repo's Settings →
Webhooks, with content type `application/json`. Many shared-hosting plans
don't allow inbound webhooks, which is why Part 3 is recommended for true
automation.)

---

## Part 5 — Day-to-day workflow

Once Part 3 is set up, the loop looks like this:

```bash
# Make your changes
git checkout -b some-feature
# ...edit files...
npm run dev       # work locally at http://localhost:3000
git commit -am "feat: explain the change"
git push -u origin some-feature
# open a PR on GitHub, review, merge to main
# → Actions auto-deploys to atharnurtravels.com
```

### Skipping a deploy

Add `[skip ci]` anywhere in your commit message — the workflow's `if:` guard
will skip the run. Useful for doc-only commits.

### Manual Passenger restart (no rebuild)

If you only changed env vars in cPanel and want them picked up:

```bash
ssh -i ~/.ssh/cpanel_deploy_key -p <cpanel-port> <cpanel-user>@<cpanel-host> \
  'touch ~/public_html/tmp/restart.txt'
```

Or click **Restart** on the Node.js App page.

### Rolling back to a previous commit

You have two options.

**Option A — revert in git (preferred).** This keeps history clean and
re-triggers a normal deploy:

```bash
git revert <bad-sha>
git push origin main
```

**Option B — force the server to a known-good commit.** Quicker for "the site
is down right now":

```bash
ssh -i ~/.ssh/cpanel_deploy_key -p <cpanel-port> <cpanel-user>@<cpanel-host>
# on the server:
cd ~/public_html
source /home/$USER/nodevenv/public_html/20/bin/activate
git fetch origin
git reset --hard <good-sha>
npm ci --omit=dev
npm run build:cpanel
touch tmp/restart.txt
```

`reset --hard` is destructive locally on the server clone, but GitHub is the
source of truth, so it's safe.

---

## Part 6 — Troubleshooting

### `Missing required environment variable: NEXTAUTH_SECRET`
Env vars live in cPanel's **Setup Node.js App** → **Environment variables**.
A `.env.local` file on the server is ignored by Passenger. Add the missing
var there and restart.

### 502 Bad Gateway / Passenger error page
Check the Passenger error log:

```bash
tail -n 100 ~/public_html/stderr.log
```

Or cPanel → **Errors**. Common causes: missing env var crashed the boot,
build never completed, wrong Node version selected.

### Build runs out of memory
cPanel containers often have 512 MB–1 GB RAM. Add this env var in the Node.js
App page:

```
NODE_OPTIONS=--max-old-space-size=1024
```

Save and rerun `npm run build:cpanel`.

### Static assets (JS/CSS/images) return 404
The `build:cpanel` script copies `public/` and `.next/static/` into
`.next/standalone/`. Verify both exist:

```bash
ls .next/standalone/public/
ls .next/standalone/.next/static/
```

If they don't, the build's `cp` step didn't run — rerun `npm run build:cpanel`
and watch for errors.

### GitHub Action fails with `Permission denied (publickey)`
The deploy key isn't authorised on the server. Recheck Part 3.2:

1. Is the public key (`atharnur_deploy.pub`) imported in cPanel SSH Access?
2. Did you click **Authorize** on that key?
3. Did you paste the full private key — including `-----BEGIN ...-----` and
   `-----END ...-----` lines — into the `CPANEL_SSH_KEY` GitHub secret?

### `git pull` in the workflow fails with merge conflicts
The workflow uses `git reset --hard origin/main` specifically to avoid this.
If you see merge conflicts, someone edited files on the server directly. Find
out who, then let the next deploy overwrite their changes (or stash and
preserve them first if they're worth keeping).

### Login form does nothing / redirect loop on `/admin/login`
`NEXTAUTH_URL` must match the exact protocol + domain users visit. If you
load the site at `https://www.atharnurtravels.com` but `NEXTAUTH_URL` is
`https://atharnurtravels.com`, the cookie domain won't match and sign-in will
silently fail. Pick one canonical form and set both `NEXTAUTH_URL` and
`NEXT_PUBLIC_APP_URL` to it.

### Image upload fails with "Image upload is not configured"
Cloudinary env vars missing or wrong. Recheck `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in cPanel and restart.

### `npm ci` fails with "Cannot find module" after deploy
The server clone is in a weird state. SSH in and run a fresh install:

```bash
cd ~/public_html
source /home/$USER/nodevenv/public_html/20/bin/activate
rm -rf node_modules
npm ci --omit=dev
npm run build:cpanel
touch tmp/restart.txt
```

---

## Part 7 — Security hardening

Tackle these once the site is live and working. None of them block deployment.

- **Tighten MongoDB Atlas Network Access.** Replace the `0.0.0.0/0` rule from
  Part 1.1 with your cPanel server's public IP. You can find that IP by
  SSHing in and running `curl ifconfig.me`. Add it as a single-IP rule, then
  delete the `0.0.0.0/0` rule.
- **Rotate `NEXTAUTH_SECRET` and `ADMIN_PASSWORD` every few months.** Update
  the env vars in cPanel and restart.
- **Use a fine-grained GitHub PAT** if you ever switch to the Part 4 fallback
  with a private repo. Scope it to read-only on this one repo, set an expiry.
- **Confirm AutoSSL is active.** cPanel → SSL/TLS Status — every domain and
  subdomain should show a valid certificate. AutoSSL renews these for free
  every 90 days.
- **Consider Cloudflare in front of the domain** for rate limiting on
  `/api/auth/*`. The app does not bundle rate limiting itself; brute-force
  protection should sit at the edge.
- **Revoke the GitHub Actions deploy key when you no longer need it.**
  cPanel → SSH Access → Manage SSH Keys → **Deauthorize** + **Delete** for
  `github_actions`. Generate a fresh pair if you ever suspect the private key
  leaked.
