# Easy-Coop

A comprehensive cooperative management platform that streamlines administration, auditing, and member engagement for cooperatives.

## Overview

EasyCoop is an enterprise platform with role-based dashboards and domain-specific workflows for:

- **Super Admin**: Platform administrators who oversee domains, moderate cooperatives, and assign main auditors
- **Coop Admin**: Cooperative organizers who manage members, track deposits/transactions, issue e-signatures/invoices, and execute audit pipelines
- **Auditor Manager**: Governance personnel reviewing cooperative behaviors, financials, and requests; assigns sub-auditors
- **Sub Auditor**: Internal governance agents resolving cooperative audits and marking checkpoints
- **Member**: Cooperative users who view announcements, verify payments, read invoices, and participate in governance

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **UI & Styling**: [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Backend**: [Appwrite](https://appwrite.io/) (Authentication, Database, Storage)
- **Data Viz**: [Recharts](https://recharts.org/)
- **Motion**: [Framer Motion](https://www.framer.com/motion/), [@rive-app/react-canvas](https://rive.app/)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/          # Public routes: sign-in, sign-up, about
│   ├── (authenticated)/   # Protected routes: dashboard, profile, explore
│   ├── api/               # API endpoints: auth, coops, transactions, votes
│   ├── layout.jsx         # Root layout
│   └── providers.jsx      # Context providers (Auth, Theme)
├── components/
│   ├── coopadmin/         # Coop admin features: invoices, members, audits, polls
│   ├── subAuditor/        # Sub auditor tools: assigned audits, tickets
│   ├── memberPage/        # Member views: shares, transactions, voting
│   ├── superadmin/        # Super admin: verification, contacts
│   └── ui/                # Atomic components: buttons, cards, badges
├── lib/
│   ├── appwrite-server.js # Server-side Appwrite utilities
│   └── *.service.js       # Data service modules (audit, voting, transaction)
└── pages/                 # Page wrappers: AdminPage, MemberPage, SuperAdminPage
```

## Getting Started

### Prerequisites

- Node.js v18+
- npm (or yarn/pnpm)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd easy-coop

# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs on [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `.env.example` to `.env`:

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_DATABASE_ID=your_database_id
```

**Note**: Only `NEXT_PUBLIC_*` variables are exposed to the client. Never bind secret keys to `NEXT_PUBLIC_*`.

## Authentication Flow

1. App loads → `AuthContext` runs `checkSessionAndFetchDetails` targeting `/api/auth/session`
2. If `appwrite-session` cookie exists, server verifies identity via node-appwrite
3. User profile is merged with Appwrite session to formulate scopes
4. Dashboard routing dispatches based on `user.role`:
   - `coopadmin` → `AdminPage.jsx`
   - `superuser` → `SuperAdminPage.jsx`
   - `member` → `MemberPage.jsx`
   - `auditer` → `GovAuditerPage.jsx`
   - `aud_E` → `SubAuditerPage.jsx`

## Core Features

### Coop Admin (`src/components/coopadmin/`)

| Feature | Description |
|---------|-------------|
| Member Directory | Table view of members, status toggles, invitations |
| Transactions | Logging and tracking member shares and fees |
| Audit Compliance | Upload accounting documents (GL, Balance Sheets) |
| Polling | Create internal elections with start/end timelines |
| eSignature | Process internal document signing |
| Financial Analysis | Revenue model visualization and reporting |
| Invoices | Issue standardized invoices |
| Calendar | Track deadlines and meetings |
| Integrations | DATEV exports and external compliance bridging |

### Audit Workflows

**Auditor Manager** (`src/components/AuditerPage/`):
- Reviews cooperative filings
- Generates tickets/alerts for missing documents
- Assigns workload to Sub Auditors
- Generates final audit reports

**Sub Auditor** (`src/components/subAuditor/`):
- Reviews assigned case files
- Verifies specific criteria sequentially
- Tracks personal throughput via stats dashboard

### Member View (`src/components/memberPage/`)

- **Shares & Wealth**: Track member equity and personal ledger
- **Voting**: Interface for active surveys launched by Coop Admin

### Super Admin (`src/components/superadmin/`)

- **Verification**: Global verification queue for new cooperatives
- **Contact Channels**: Central hub for alerts and inquiries

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Debugging Tips

- **Session missing after login**: Ensure `appwrite-session` cookie is not intercepted on localhost. Debug `/api/auth/session`.
- **Wrong dashboard/routes**: Verify `user.role` payload structure matches expected enums (`superuser`, `coopadmin`, `auditer`, etc.)
- **API permission errors**: Ensure write-access requests pass Appwrite permissions logic; use server APIs for strict checks.

## License

Proprietary software.
