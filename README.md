# Athar Nur Travels

### A conversion-focused travel agency website with a powerful operations dashboard

Athar Nur Travels is a complete travel-agency website concept built to help agencies present their services professionally, generate qualified enquiries, and manage their day-to-day content from one place.

This project is also a showcase of what I can build for travel businesses: a custom website that combines premium visual design, multilingual content, package management, enquiry handling, hotel discovery, WhatsApp conversion paths, and secure administration.

> **Want a website like this for your agency?**
> I can customize the branding, pages, booking flow, languages, payment options, and admin tools around your business.

## Live experience

- **Public website:** [atharnurtravels.com](https://atharnurtravels.com)
- **Local development:** `http://localhost:3000/en`
- **Supported locales:** English, Bengali, and Arabic
- **Admin area:** `/admin/login`

## Why this works for a travel agency

The website is designed around the customer journey:

1. Build trust with a polished brand presentation, approval badges, social proof, and clear service categories.
2. Help visitors find the right Hajj, Umrah, tour, hotel, or ticketing service quickly.
3. Turn interest into action through enquiry forms, WhatsApp CTAs, package detail pages, and booking flows.
4. Give the agency team control over packages, enquiries, hotels, settings, and notices without editing code.

## Customer-facing features

| Experience | Included capability |
| --- | --- |
| Homepage | Hero section, service highlights, featured packages, hotel teaser, trust signals, CTA sections |
| Hajj and Umrah | Dedicated package pages with pricing, duration, inclusions, itinerary, and booking actions |
| International tours | Destination-focused tour packages with reusable detail layouts |
| Hotel discovery | Search and enquiry flow for hotels in destinations such as Makkah, Madinah, and Dubai |
| Air ticketing | Dedicated service page and enquiry path for flight assistance |
| Enquiries | Structured customer enquiry forms connected to the admin dashboard |
| WhatsApp conversion | Floating WhatsApp action and direct enquiry CTAs |
| Multilingual content | English, Bengali, and Arabic-ready page structure with RTL support |
| Responsive design | Optimized layouts for mobile, tablet, and desktop visitors |
| Maintenance mode | Temporarily show a branded maintenance notice while admins retain access |

## Admin dashboard

The administration area is built for real agency workflows rather than being a static demo.

- Secure credential-based admin authentication
- Dashboard overview with operational stats
- Create, edit, view, and delete travel packages
- Mark packages as available or featured
- Manage package categories, bilingual copy, pricing, images, inclusions, and itineraries
- Manage hotel listings and hotel details
- Review and filter customer enquiries
- View enquiry details and update enquiry status
- Activity logging for important admin actions
- Analytics and operational overview screens
- Site settings for brand information, contact details, social links, notices, and SEO
- Cloudinary-ready image uploads
- Production maintenance mode with admin bypass

## Built to be customized for each client

Every agency has a different sales process. This foundation can be adapted with:

- Your logo, colors, typography, photography, and brand voice
- Your destinations, package types, pricing model, and seasonal offers
- Custom booking forms and lead qualification questions
- Bengali, Arabic, Hindi, Urdu, or other language support
- WhatsApp, Messenger, email, or CRM integrations
- Online payment gateways and deposit collection
- Customer accounts, booking history, invoices, and follow-up workflows
- Blog, promotions, visa services, transport, and corporate travel sections
- Analytics, SEO, structured data, and conversion tracking

## Technology

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router and React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS and reusable UI components |
| Database | MongoDB with Mongoose |
| Authentication | NextAuth credentials authentication |
| Internationalization | next-intl |
| Media | Cloudinary-ready upload integration |
| Email | Nodemailer / SMTP-ready enquiry notifications |
| Payments | SSLCommerz and PipraPay integration points |
| Deployment | Vercel or standalone Node.js hosting |

## Run it locally

### Requirements

- Node.js 20+
- MongoDB database or MongoDB Atlas cluster
- npm

### Installation

```bash
git clone https://github.com/proffesergio/an-travel-agency.git
cd an-travel-agency
npm install
cp .env.example .env.local
```

Add the required values to `.env.local`, especially:

```env
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=your-long-random-secret
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=use-a-strong-password
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000/en](http://localhost:3000/en). The Bengali and Arabic versions are available at `/bn` and `/ar`.

## Useful commands

```bash
npm run dev         # Start local development
npm run build       # Create a production build
npm run start       # Start the production server
npm run typecheck   # Validate TypeScript
npm run lint        # Run ESLint
npm run test        # Run the test suite
```

## Production configuration

Never commit secrets to Git. Configure environment variables in Vercel, cPanel, or the selected hosting provider.

Common production variables include:

- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_APP_URL`
- Cloudinary credentials for media uploads
- SMTP credentials for email notifications
- Payment gateway credentials when online payments are enabled
- `MAINTENANCE_MODE=true` when the public website should temporarily show the maintenance notice

See [`.env.example`](.env.example) for the full configuration reference.

## Project structure

```text
app/                 Pages, layouts, admin screens, and API routes
components/          Reusable customer-facing and dashboard components
lib/                 Database services, validation, authentication, and helpers
models/              MongoDB models for packages, hotels, enquiries, and settings
messages/            Localized content
public/              Brand assets and static images
tests/               Automated tests for core settings and admin behavior
```

## A strong starting point for your agency

This project demonstrates a practical balance of design and business functionality. It can be delivered as:

- A brochure-style agency website
- A lead-generation website with WhatsApp and enquiry automation
- A package catalogue with an internal content dashboard
- A multilingual Hajj, Umrah, tours, hotel, or ticketing platform
- A full custom booking platform developed in stages

The scope can start small and grow with the agency, so clients can launch quickly without limiting future improvements.

## Let’s build your version

If you run a travel agency and want a website that looks trustworthy, works on mobile, brings in enquiries, and gives your team control over updates, this system can be tailored to your exact workflow.

**Available for custom travel websites, redesigns, admin dashboards, booking flows, multilingual experiences, and ongoing improvements.**
