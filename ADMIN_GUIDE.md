# Athar Nur Travels — Admin User Guide

A plain-English handbook for the admin who runs the website day to day.
You do **not** need any coding knowledge to use this panel.

---

## What this guide covers

1. [One-time setup before first use](#1-one-time-setup-before-first-use)
2. [Signing in](#2-signing-in)
3. [The dashboard at a glance](#3-the-dashboard-at-a-glance)
4. [Managing travel packages](#4-managing-travel-packages)
5. [Handling customer enquiries](#5-handling-customer-enquiries)
6. [Analytics](#6-analytics)
7. [Settings](#7-settings)
8. [Signing out](#8-signing-out)
9. [Common problems & fixes](#9-common-problems--fixes)
10. [When to call your developer](#10-when-to-call-your-developer)

---

## 1. One-time setup before first use

These steps only happen **once**, before the site goes live. If your developer
has already done them, skip to [section 2](#2-signing-in).

You need three things connected before the admin panel will work fully:

### a) A MongoDB Atlas database (free)

This is where the website stores your packages, customer enquiries, and
activity log.

1. Go to <https://www.mongodb.com/cloud/atlas/register> and create a free account.
2. Click **"Create a deployment"** → pick the **M0 (Free)** tier → keep the
   default region → click **Create**.
3. When prompted, create a **database user**:
   - Username: something simple like `atharnuradmin`
   - Password: a long random password — **save it somewhere safe**.
4. Under **"Where would you like to connect from?"**, choose **"Add my current
   IP"** for development. (For your live cPanel server, you'll later add
   `0.0.0.0/0` — your developer will do this.)
5. Click **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://atharnuradmin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with the password you saved. Add the database name
   `atharnur-travels` before the `?`:
   ```
   mongodb+srv://atharnuradmin:YourPassword@cluster0.abcde.mongodb.net/atharnur-travels?retryWrites=true&w=majority
   ```
7. Give this final string to your developer (or paste it into `.env.local` on
   your local machine, then into cPanel for the live site).

### b) A Cloudinary account (free) for package photos

1. Go to <https://cloudinary.com/users/register/free> → sign up.
2. After login, on the **Dashboard** you'll see three values:
   - **Cloud name** (e.g. `dxyzabc123`)
   - **API Key** (long number)
   - **API Secret** (click the eye icon to reveal — keep it private)
3. Give these three values to your developer (or paste them into `.env.local`).

### c) Your admin login credentials

1. Pick an email address you'll remember (e.g. `admin@atharnurtravels.com`).
2. Pick a **long, hard-to-guess password** — at least 16 characters.
3. Give the email + password to your developer to set in the environment.
4. **Save your password in a password manager**. There is no "forgot password"
   link — only your developer can reset it by editing the environment file.

> **Why is there no signup or password reset?** The admin panel is designed
> for **one** person (you). Credentials are managed through the server's
> environment file, not a database — this keeps the admin account secure
> and impossible to enumerate.

Once these three things are set up, your developer can deploy the site and
hand it over to you.

---

## 2. Signing in

1. Open your web browser and visit:
   ```
   https://yourdomain.com/admin/login
   ```
   (Replace `yourdomain.com` with your actual domain.)
2. Type your **email** and **password**.
3. Click **Sign In**.

**What you should see:** the dashboard with stats cards at the top and a
green sidebar on the left.

**If you see a red "Invalid email or password" message:** double-check your
credentials. They are case-sensitive. If you're sure they're right, contact
your developer to confirm the values in the environment file.

---

## 3. The dashboard at a glance

The first screen after signing in shows you the health of your site.

### Stats cards (top row)
- **Total Packages** — how many Hajj/Umrah/Tour packages you have published.
- **New Enquiries** — customer enquiries you haven't contacted yet.
- **Contacted** — enquiries where you've already reached out.
- **Closed** — completed enquiries (sale done, or customer not interested).

### Recent Activity (left panel)
A live log of the last 10 things that happened — packages created, enquiries
viewed, deletions, logins. Useful for spotting unusual activity.

### Setup Checklist (right panel)
Shows whether each integration (MongoDB, Cloudinary, Admin credentials, etc.)
is configured. **Every required item should be ticked green** before going
live. If something is unchecked, look at [section 7](#7-settings) for what's
missing.

### Sidebar navigation
- **Dashboard** — this page.
- **Packages** — manage your travel packages.
- **Enquiries** — see and respond to customer enquiries.
- **Analytics** — charts and 30-day activity.
- **Settings** — admin profile + integration health.

---

## 4. Managing travel packages

A "package" is a single travel offering — for example, "Premium Hajj 2025"
or "Istanbul 7-day Tour". Each package shows up on the public website.

### View all packages

1. Click **Packages** in the sidebar.
2. You'll see a table of every package with image, category, price, duration,
   and status.
3. Use the **search box** to find a package by title (English or Bengali).
4. Use the **category dropdown** to filter by Hajj / Umrah / Tour.

### Add a new package

1. From the Packages page, click **+ Add Package** (top right).
2. Fill in the form. Required fields are marked with `*`.

   - **Title (English)** — e.g. `Premium Hajj Package 2026`. The URL slug is
     filled in automatically based on this.
   - **Title (Bengali)** — same name in Bangla, e.g. `প্রিমিয়াম হজ্জ প্যাকেজ ২০২৬`.
   - **Slug** — auto-filled. Looks like `premium-hajj-package-2026`. You can
     edit it, but each package needs a unique slug. **Use only lowercase
     letters, numbers, and hyphens.**
   - **Category** — pick Hajj, Umrah, or Tour.
   - **Price** — in your chosen currency. Must be greater than 0.
   - **Currency** — usually BDT (Bangladeshi Taka).
   - **Duration (English / Bengali)** — e.g. `15 Days / 14 Nights` and
     `১৫ দিন / ১৪ রাত`.
   - **Description (English / Bengali)** — a paragraph about what the package
     includes. This appears on the public package detail page.

3. **Upload an image:**
   - Click **Upload Image** under "Package Image".
   - Pick a `.jpg`, `.png`, or `.webp` file from your computer. Maximum 5 MB.
   - Wait for "Uploading..." to disappear. The image preview appears.
   - **Recommended size:** 1200×800 pixels. The system automatically resizes
     and optimizes for web.
   - You can change or remove the image before saving.

4. **Inclusions** — list what's included (e.g. "5-star hotel in Makkah",
   "Round-trip flights"). Click **+ Add More** for additional items.
   You need **at least one** inclusion. Provide the Bengali version below.

5. **Itinerary** — day-by-day schedule. For each day, fill:
   - **Day title**: e.g. `Day 1`
   - **Activity title**: e.g. `Arrival in Jeddah`
   - **Description**: e.g. `Airport pickup, transfer to Makkah hotel.`

   You need at least one itinerary day. Click **+ Add Day** for more.

6. **Status** — at the bottom:
   - **Available for booking** — keep checked unless you want to hide it.
   - **Featured package** — check this if you want it shown on the homepage.

7. Click **Save Package**. You'll be sent back to the package list and your
   new package appears.

> **Tip:** Always preview a new package on the public site after saving:
> visit `https://yourdomain.com/en/<category>/<slug>` (e.g.
> `/en/hajj/premium-hajj-package-2026`).

### Edit an existing package

1. On the Packages list, find the package and click the **pencil icon** (Edit).
2. Update any field. The form behaves exactly like "Add New", but with the
   current values pre-filled.
3. Click **Save Changes**.

### View a package's full details

Click the **eye icon** on the list. This shows everything about the package
read-only, with an **Edit** button if you need to make changes.

### Delete a package

1. Click the **red trash icon** on the list (or the **Delete** button on the
   detail page).
2. A confirmation dialog asks you to confirm: "Delete package?".
3. Click **Delete package** to proceed, or **Cancel** to back out.

> ⚠️ Deletion is **permanent**. The package is removed from MongoDB. If you
> want to *temporarily* hide a package instead, edit it and uncheck **Available
> for booking** — that keeps the data but hides it from the public site.

---

## 5. Handling customer enquiries

Customers who fill the booking form on the public site land here.

### View all enquiries

1. Click **Enquiries** in the sidebar.
2. Each enquiry card shows the customer's name, phone, email, status, what
   they enquired about, and a "View Details" button.
3. Filter by **status** (`All / New / Contacted / Closed`) or by **category**
   (Hajj / Umrah / Tour / Air Ticketing / General).

### Open an enquiry

Click **View Details** on the card. You'll see:
- Customer name, phone, email
- Number of passengers
- The package they're interested in (if any)
- Their full message
- Status (new / contacted / closed)
- Action buttons

### Contact the customer

On the right side of the enquiry detail page, you have three buttons:

- **WhatsApp** (green) — opens WhatsApp with a pre-filled greeting message
  addressed to the customer. **This is the primary contact method.** Simply
  click and start the conversation.
- **Call** — opens your phone dialer with the customer's number ready.
- **Email** (only if they provided one) — opens your email client.

### Update enquiry status

As you work the enquiry, update the status so you know where each one stands:

- **Mark as contacted** — click after you've messaged or called them. This
  moves the enquiry into the "Contacted" tab on the dashboard.
- **Mark as closed** — click when the sale is done, or when the customer says
  no. Closed enquiries stay in the system for record-keeping.

The status badge at the top updates instantly.

### Delete an enquiry

If the enquiry is spam or duplicate, click the red **Delete** button at the
top right of the detail page. A confirmation will ask you to confirm. Deletion
is permanent.

> **Workflow suggestion:** every morning, open Enquiries filtered by `new`.
> Work through each one — WhatsApp the customer, then mark as contacted.
> At the end of the week, mark completed/lost ones as closed.

---

## 6. Analytics

Click **Analytics** in the sidebar to see:

- **Total Enquiries / New / Closed / Total Packages** — same numbers as
  the dashboard but in one place.
- **Enquiries by Category** — a bar showing what people most often ask about
  (Hajj vs Umrah vs Tour vs Air Ticketing). Useful for deciding what packages
  to promote.
- **Packages by Category** — how your inventory is split.
- **Recent Activity (30 days)** — every action taken in the panel.

This is purely informational — nothing here is clickable.

---

## 7. Settings

Click **Settings** in the sidebar.

### Admin Profile
Shows your name, email, and a note that credentials are set via environment
variables (you can't change your password from this screen — see [Section 9
"Forgot password"](#9-common-problems--fixes)).

### Integrations Health
Each integration is marked **Configured** (green), **Missing** (red), or
**Optional · Not set** (grey).

- **MongoDB Atlas, NextAuth Secret, Admin Credentials, Cloudinary, WhatsApp**
  must all be **green** before launch.
- **Email (SMTP)** and **SSLCommerz** are marked optional — you can launch
  without them. The site collects enquiries; you reach out via WhatsApp.

### Public WhatsApp Number
Shows the WhatsApp number that appears on the public site's floating chat
button. To change it, your developer must update the `NEXT_PUBLIC_WHATSAPP_NUMBER`
environment variable and redeploy.

---

## 8. Signing out

Click **Sign Out** at the bottom of the sidebar. You'll be sent back to the
login page and your session cookie is cleared.

For security, the panel **automatically signs you out after 24 hours** even
if you don't click sign out.

---

## 9. Common problems & fixes

### "Database not connected" yellow banner on the dashboard

The site can't reach MongoDB. Causes:
- The connection string is wrong or missing (most common).
- MongoDB Atlas paused your free cluster (it auto-pauses after 60 days of
  inactivity — log in to Atlas and click "Resume").
- Your cPanel server's IP is not whitelisted in MongoDB Atlas.

**What to do:** check Settings → Integrations Health. If MongoDB shows
"Missing", contact your developer with the exact text of the error message
shown under the banner.

### Login form rejects valid credentials

- Confirm caps lock is off and the email has no trailing spaces.
- The email and password are **case-sensitive**.
- If still failing, your developer needs to verify the `ADMIN_EMAIL` and
  `ADMIN_PASSWORD` environment variables.

### "Image upload is not configured" error when adding a package image

Cloudinary credentials are missing or wrong. Check Settings → Integrations
Health → Cloudinary. Your developer needs to set
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.

### Forgot password

There is no automated reset. Your developer must:
1. Pick a new password.
2. Update `ADMIN_PASSWORD` in the cPanel Node.js App environment variables.
3. Restart the app.

This is intentional — without a reset link, the admin account can't be
phished or hijacked.

### Package created but doesn't appear on the public site

- Check the package is **Available for booking** (Settings → edit package).
- Hard-refresh the public page (Ctrl + F5 / Cmd + Shift + R).
- Confirm the slug doesn't conflict — try `https://yourdomain.com/en/<category>/<slug>`
  directly.

### Status updates don't seem to save

Check the yellow "Database not connected" banner. If MongoDB is down, updates
are silently rejected. The banner is the first thing to look at when anything
"doesn't save".

### The site looks broken after I added a package

Refresh the page once. If still broken, sign out and back in. If still broken,
go to Packages, edit the last one you added, and look for anything unusual
(missing required field, broken image link).

### Sign-in page keeps reloading / "infinite redirect"

This was a bug in earlier builds — it's fixed in the production build. If you
see it again, clear your browser cache and cookies for the site, then try
again. If still broken, contact your developer.

---

## 10. When to call your developer

Reach out to your developer if:

- A red error message appears that doesn't resolve after a refresh.
- You need to change your admin email or password.
- You want to add another admin user.
- You want to enable email notifications, payment processing, or any new
  feature.
- The site is slow or returns "502 Bad Gateway" errors (Passenger / Node app
  needs restarting).
- You renewed the domain or changed DNS — the site may need its `NEXTAUTH_URL`
  updated.
- You see "MongoDB cluster paused" — they may want to switch you to a paid
  tier to prevent future pauses.

---

## Quick reference: daily admin checklist

Every morning:

- [ ] Open `/admin` → check **New Enquiries** count.
- [ ] Click **Enquiries**, filter by `new` → contact each one via WhatsApp.
- [ ] Mark contacted ones as **Contacted**.

Every week:

- [ ] Update prices or details on any package that changed.
- [ ] Mark old enquiries as **Closed** (sale done or customer lost).
- [ ] Skim **Analytics** to see what categories customers are asking about most.

Once a month:

- [ ] Open Settings → confirm all required integrations still show green.
- [ ] If you're on MongoDB Atlas free tier, log in to Atlas just to keep the
  cluster active (auto-pauses after 60 days of inactivity).

---

That's it. Welcome aboard. If anything in the panel ever feels confusing,
re-read the relevant section above — and remember: the panel can't break the
public site by mistake. Updates only go live when you save them, and there's
always a confirmation before deletes.
