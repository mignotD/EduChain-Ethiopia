# EduChain Ethiopia

A digital credential verification platform that combats fake academic credentials by providing a trusted, tamper-proof system for universities, employers, and students across Ethiopia.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Authentication & Authorization](#authentication--authorization)
- [API & Database](#api--database)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Academic credential fraud is a growing challenge in Ethiopia. EduChain Ethiopia provides a secure, verifiable, and student-friendly platform where:

- **Universities** issue digitally signed certificates with unique IDs and QR codes.
- **Employers & Institutions** verify credentials in real time — no paperwork, no delays.
- **Students** access a personal dashboard to view, share, and manage their academic records.

The platform supports bulk issuance via CSV/Excel, certificate revocation and expiry management, email notifications, detailed analytics, and customizable university branding.

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                   Client (React)                  │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Auth UI  │  │ Admin    │  │ Public         │  │
│  │          │  │ Dashboard│  │ Verification   │  │
│  └──────────┘  └──────────┘  └────────────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Issue    │  │ Bulk     │  │ Student Portal │  │
│  │ Certificate│ │ Issue    │  │                │  │
│  └──────────┘  └──────────┘  └────────────────┘  │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│             Supabase (Backend)                    │
│  ┌──────────────┐  ┌────────────────────────────┐│
│  │ PostgreSQL    │  │ Row Level Security         ││
│  │ + RPCs       │  │ (RLS)                      ││
│  └──────────────┘  └────────────────────────────┘│
│  ┌──────────────┐  ┌────────────────────────────┐│
│  │ Auth         │  │ Storage (logos)            ││
│  │ (email/OAuth)│  │                            ││
│  └──────────────┘  └────────────────────────────┘│
│  ┌──────────────┐  ┌────────────────────────────┐│
│  │ Edge Functions│  │ Email (Resend)            ││
│  └──────────────┘  └────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Supabase** provides a unified backend — database, authentication, file storage, and serverless edge functions — eliminating the need for a separate API server.
- **Row Level Security (RLS)** enforces data isolation at the database level; each university can only access its own records.
- **React + Vite** provides a fast, modern frontend with SWC compilation for rapid development.
- **shadcn/ui** delivers accessible, themeable UI primitives that ship as local source code — fully customizable.

---

## Features

### Certificate Lifecycle Management

| Feature | Description |
|---------|-------------|
| **Single Issuance** | Issue individual certificates with student details, degree, GPA, honors, graduation date, and expiry. |
| **Bulk Issuance** | Upload CSV or Excel files with automatic field mapping, preview, and batch issuance. |
| **Unique IDs** | Auto-generated certificate IDs in the format `EC-YYYY-XXXXXX`. |
| **QR Codes** | Each certificate includes an inline QR code linking to its verification page. |
| **Revocation** | Revoke certificates with a reason; revoked certificates display a clear revoked state. |
| **Expiry** | Set an expiry date; expired certificates are flagged on verification. |

### Verification & Public Access

- **Real-Time Verification** — Enter a certificate ID to instantly validate its authenticity and status.
- **QR Scanner** — Scan a certificate's QR code directly from the camera for instant verification.
- **Deep Links** — Shareable verification URLs (`/verify/:certificateId`) and student portal links (`/student/:studentId`).
- **Student Portal** — Public-facing lookup where students can find all their issued certificates by student ID.

### University Administration

- **Dashboard** — Overview of total certificates, active counts, recent issuances, and activity feed.
- **University Settings** — Configure logo, primary/accent colors, certificate theme (Classic, Modern, Ethiopian Heritage), and email templates.
- **Profile Management** — Update university name and code.
- **Activity Log** — Full audit trail of all certificate-related actions.

### Analytics

- **Issuance Trends** — Bar and line charts showing certificate issuance over time.
- **Status Breakdown** — Pie chart visualizing active, revoked, and expired certificate distributions.
- **Date Range Filtering** — Filter analytics by custom date ranges.

### Notifications

- **Confirmation Emails** — Automated email notifications sent via Resend when certificates are issued, with customizable university-branded templates.

### User Experience

- **Dark Mode** — Light, dark, and system theme options persisted locally.
- **Responsive Design** — Fully functional on desktop and mobile devices.
- **Page Transitions** — Smooth animated transitions between routes.

---

## Tech Stack

### Frontend

| Category | Technology |
|----------|-----------|
| Language | TypeScript |
| UI Framework | React 18 |
| Bundler | Vite 5 (SWC) |
| Styling | Tailwind CSS 3 |
| UI Components | shadcn/ui (Radix primitives) |
| Routing | react-router-dom v6 |
| Forms | react-hook-form + zod |
| Charts | Recharts |
| PDF Generation | html2canvas + jsPDF |
| QR Code | qrcode + qr-scanner |
| Icons | Lucide React |

### Backend & Infrastructure

| Category | Technology |
|----------|-----------|
| Database | PostgreSQL (via Supabase) |
| Authentication | Supabase Auth (email/password, Google OAuth) |
| File Storage | Supabase Storage (university logos) |
| Serverless Functions | Supabase Edge Functions |
| Email | Resend API |
| State Management | TanStack React Query |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (ships with Node.js)
- A **Supabase** project (see [Configuration](#configuration))

### Installation

```bash
git clone https://github.com/mignotD/EduChain-Ethiopia.git
cd EduChain-Ethiopia
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> **Note:** The Supabase URL and anon key are currently hardcoded in `src/integrations/supabase/client.ts` for development convenience. Move them to environment variables before deploying to production.

For the email notification edge function, configure the `RESEND_API_KEY` environment variable in your Supabase dashboard.

### Database Setup

Run the SQL migrations in [`supabase/migrations/`](./supabase/migrations/) against your Supabase project. These migrations create all tables, enums, RLS policies, triggers, and database functions.

Apply them via the Supabase dashboard SQL editor or the Supabase CLI:

```bash
supabase db push
```

### Development Server

```bash
npm run dev
```

The app runs at `http://localhost:8080`.

### Production Build

```bash
npm run build
npm run preview
```

The build output is written to `dist/`.

### Linting

```bash
npm run lint
```

---

## Project Structure

```
├── public/                          # Static assets (favicon)
├── supabase/
│   ├── config.toml                  # Supabase project configuration
│   └── migrations/                  # Database migration files
├── src/
│   ├── components/
│   │   ├── ui/                      # ~45 shadcn/ui primitives (Button, Dialog, Table, etc.)
│   │   ├── CertificateTemplate.tsx   # Visual certificate with 3 themes + QR code
│   │   ├── EmptyState.tsx           # Reusable empty state placeholder
│   │   ├── PageTransition.tsx       # Route transition animation wrapper
│   │   ├── QRCodeDisplay.tsx        # QR code dialog with download/share
│   │   ├── QRScanner.tsx            # Camera-based QR scanner
│   │   ├── ThemeProvider.tsx        # Light/dark/system theme context
│   │   └── ThemeToggle.tsx          # Theme switcher dropdown
│   ├── hooks/
│   │   ├── useAuth.tsx              # Supabase auth context + provider
│   │   ├── useCertificates.tsx      # Certificate CRUD, verification, bulk operations
│   │   ├── useUniversitySettings.tsx # University branding and settings
│   │   ├── useActivityLog.ts        # Activity audit trail
│   │   ├── use-mobile.tsx           # Mobile breakpoint detection
│   │   └── use-toast.ts             # Toast notification system
│   ├── integrations/supabase/
│   │   ├── client.ts               # Supabase client initialization
│   │   └── types.ts                 # Auto-generated TypeScript types
│   ├── lib/
│   │   └── utils.ts                 # Utility functions (cn classname helper)
│   ├── pages/
│   │   ├── Index.tsx                # Landing page
│   │   ├── Auth.tsx                 # Login/Register
│   │   ├── Dashboard.tsx            # Admin dashboard
│   │   ├── IssueCertificate.tsx     # Single certificate issuance
│   │   ├── BulkIssue.tsx            # CSV/Excel bulk issuance
│   │   ├── MyCertificates.tsx       # Certificate management
│   │   ├── Verify.tsx               # Public certificate verification
│   │   ├── StudentPortal.tsx        # Public student lookup
│   │   ├── Analytics.tsx            # Charts and statistics
│   │   ├── UniversitySettings.tsx   # University branding config
│   │   ├── Profile.tsx              # User profile
│   │   └── NotFound.tsx             # 404 page
│   ├── utils/
│   │   ├── csvParser.ts             # CSV/Excel parsing with auto field mapping
│   │   ├── emailNotifications.ts    # Email template generation
│   │   └── pdfGenerator.ts          # PDF certificate generation
│   ├── App.tsx                      # Root component with routing
│   ├── App.css
│   ├── index.css                    # Global styles, animations, Tailwind directives
│   └── main.tsx                     # Application entry point
├── components.json                  # shadcn/ui configuration
├── index.html                       # HTML entry point
├── vite.config.ts                   # Vite configuration
├── tailwind.config.ts               # Tailwind theme customization
├── tsconfig.json                    # TypeScript configuration
├── tsconfig.app.json
├── tsconfig.node.json
├── postcss.config.js
├── eslint.config.js
└── package.json
```

---

## Configuration

### Vite

- Dev server on port `8080` with host `::` (IPv6 compatible).
- Path alias `@` → `./src` for clean imports.
- SWC compiler plugin for fast React refresh.

### Tailwind CSS

- Dark mode via `class` strategy.
- Custom fonts: **Inter** (body), **Plus Jakarta Sans** (headings).
- Extended color palette with CSS variable support for dynamic theming.
- Plugin: `tailwindcss-animate` for animation utilities.

### TypeScript

- Target: ES2020.
- JSX: `react-jsx`.
- Module resolution: bundler mode.
- Relaxed strictness (`noImplicitAny: false`, `strictNullChecks: false`) for gradual adoption.

---

## Authentication & Authorization

### User Roles

| Role | Description |
|------|-------------|
| `super_admin` | Full system access — can manage all universities, view all certificates, and access analytics across the platform. |
| `university_admin` | University-level access — can issue certificates, manage settings, and view data for their own university only. |

### Authentication Methods

- **Email & Password** — Standard registration and login via Supabase Auth.
- **Google OAuth** — One-click sign-in with Google accounts.

### Row Level Security

All database tables enforce RLS policies:

- **Profiles** — Users can read/write their own profile; super_admins can read all.
- **Certificates** — University_admins can only access certificates matching their `university_code`. Public verification queries bypass RLS via secure database functions (`verify_certificate_public`, `get_student_certificates`).
- **Activity Logs** — Scoped to the user's university.
- **University Settings** — Each university manages its own settings; super_admins can manage all.

---

## API & Database

### Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts linked to universities |
| `certificates` | Academic certificates with status lifecycle |
| `activity_logs` | Audit trail for all certificate actions |
| `university_settings` | Branding, theme, and email template configuration |

### Key Database Functions

| Function | Description |
|----------|-------------|
| `generate_certificate_id()` | Generates unique IDs in format `EC-YYYY-XXXXXX` |
| `verify_certificate_public(cert_id)` | Public verification endpoint returning validity, all fields, and expiry status |
| `get_student_certificates(student_id)` | Public student portal lookup by student ID |
| `is_super_admin(user_id)` | Recursion-safe super_admin check |
| `handle_new_user()` | Auto-creates profile on user signup |

### Storage

- **Bucket:** `university-logos` — stores university branding logos.
- **Access:** Public read, authenticated write.
- **Limits:** 2 MB max file size, PNG/JPEG/WebP only.

### Edge Functions

- **`send-confirmation-email`** — Triggered on certificate issuance. Sends branded confirmation emails via the Resend API with customizable university templates.

---

## Deployment

### Build

```bash
npm run build
```

Outputs an optimized production bundle to `dist/`.

### Hosting

Deploy the `dist/` folder to any static hosting provider:

- **Vercel** — Zero-config deployment. Connect your GitHub repo and Vercel auto-detects Vite.
- **Netlify** — Set build command to `npm run build` and publish directory to `dist`.
- **GitHub Pages** — Build locally and deploy the `dist/` folder.
- **Custom Server** — Serve `dist/` with any HTTP server (Nginx, Caddy, etc.).

### Supabase Production Checklist

1. Move Supabase credentials to environment variables.
2. Enable email confirmation in Supabase Auth settings.
3. Configure `RESEND_API_KEY` in Supabase Edge Function secrets.
4. Review and adjust RLS policies for production traffic.
5. Set up database backups and point-in-time recovery.

---

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

Please ensure your code follows the existing linting and formatting conventions.

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

---

<p align="center">

</p>
