# EasyCoop Technical Architecture

This document provides a deep, objective technical analysis of the EasyCoop codebase. It details the system architecture, design patterns, directory structure, data flows, and technical debt.

---

## 1. System Overview

EasyCoop is an enterprise-grade platform designed to digitize and manage the legal, administrative, and financial workflows of cooperative societies (Genossenschaften) in compliance with German Cooperative Law (Genossengesetz - GenG). 

### Primary Use Cases
* **Cooperative Member Registry Management**: Tracking member details, share subscriptions, transfers, and exits.
* **Legal and Auditing Workflows**: Conducting founding audits (Gründungsprüfung pursuant to §11 Abs. 2 Nr. 3 GenG) through a structured multi-phase compliance wizard.
* **Democratic Governance and Decision Making**: Management of general assemblies (Generalversammlung / Jahreshauptversammlung), proxy assignments, quorum evaluation, and poll creation/voting.
* **Financial Ledger and Transactions**: Processing share purchase transactions, payouts, subscription plan payments, and billing details.
* **Administrative Operations**: Support ticket systems, notice boards, secure file directories, and automated notifications/mailing.

---

## 2. Architectural Patterns & Design Principles

The application is structured as a **hybrid Next.js Monolith** combining a backend REST API layer and a React client app. It delegates core state and storage to a third-party Backend-as-a-Service (BaaS) provider (Appwrite) while routing telemetry and log writes to a separate document database (MongoDB).

```
                      +------------------------------------------+
                      |               Client App                 |
                      |  (React components, i18next translation) |
                      +--------------------+---------------------+
                                           |
                                           | HTTP Requests
                                           v
                      +--------------------+---------------------+
                      |           Next.js Server                 |
                      |  - App Router / Pages Router wrappers    |
                      |  - API Route Handlers                    |
                      |  - Edge-safe logger & Winston logger     |
                      +----------+--------------------+----------+
                                 |                    |
                  SDK / API Calls|                    | Mongoose / Net
                                 v                    v
                      +----------+---------+    +-----+------------------+
                      |      Appwrite      |    |        MongoDB         |
                      |  (User, DB, Bucket |    |    (System, Audit,     |
                      |      Storage)      |    |    Analytics Logs)     |
                      +--------------------+    +------------------------+
```

### Core Design Patterns

#### 1. Hybrid App/Pages Router Wrapper Pattern
To transition between routing paradigms, the App Router directories act as thin metadata and server layout wrappers around component-rich pages from the older Pages Router model.
* *Example*: `src/app/(public)/choose-role/page.jsx` imports and renders `src/pages/AccountTypePage.jsx` inside a Suspense block.
* *Benefit*: Enables gradual migration of route hierarchies without refactoring massive component logic.

#### 2. Logging Interception via Winston Proxy Wrapper
To enforce telemetry logging across the backend without cluttering service files, the server-side Appwrite client creation executes a proxy interception pattern.
* *Mechanism*: `createAdminClient` passes instances of Appwrite classes (`Account`, `Databases`, `Users`, `Storage`) through a `wrapWithLogging` Proxy. The `get` trap intercepts function invocations, automatically extracting metadata (e.g., entity type and ID mapped from collection IDs) and logging initiating, success, and failure events using a custom Winston transport (`MongoTransport`).

#### 3. Split-Runtime Edge Logger Redirection Pattern
Next.js middleware and request proxies execute inside Vercel’s Edge Runtime or custom runtimes where traditional Node.js modules (like `net` and filesystem tools) are unsupported. 
* *Mechanism*: A dual-transport strategy is employed. The Edge-safe `edgeLogger` intercepts requests and issues non-blocking `fetch()` POSTs to `/api/internal/log`. This endpoint runs in the standard Node.js server environment, where it pipes logs directly into the full-featured Winston engine and MongoDB.

#### 4. Schema Mismatch Tolerance Fallback Pattern
Due to the strict schema validation settings of Appwrite, payload updates containing attributes missing from the target collection's configuration cause fatal exceptions.
* *Mechanism*: Write operations run inside helper functions (`updateDocumentWithUnknownAttributeFallback` and `createDocumentWithUnknownAttributeFallback` in `src/lib/helpers/_helpers.js`). If an "Unknown attribute" error occurs, a regex parser matches the key, deletes it from the payload, and retries the database write iteratively (up to 50 times).

#### 5. Rollback Orchestration Pattern
Operations spanning multiple storage engines or requiring multi-step database changes implement an ad-hoc rollback registration registry.
* *Mechanism*: Methods (such as `uploadKycDocument` in `src/lib/kycDocumentService.js`) accept an optional `rollback` manager. When files are written to Appwrite Storage or document metadata is created, respective deletion callbacks are appended. If subsequent steps fail, the transaction context triggers the accumulated rollbacks in reverse order.

---

## 3. Directory Structure & Module Boundaries

### Tree Representation
```
easycoop-english/
├── package.json
├── next.config.js
├── tailwind.config.js
├── src/
│   ├── app/                    # Next.js App Router folders
│   │   ├── (authenticated)/    # Layouts & pages wrapping protected views
│   │   ├── (public)/           # Layouts & pages wrapping guest views
│   │   ├── [coopId]/           # Dynamic cooperative-scoped sub-routes
│   │   ├── api/                # REST API routes (NextJS Route Handlers)
│   │   │   ├── auth/           # Login, registration, and OTP handlers
│   │   │   ├── internal/       # System bridging (e.g. /log endpoints)
│   │   │   └── ...             # Feature-specific REST endpoints
│   │   └── layout.jsx          # Root App Router layout
│   ├── pages/                  # Core view pages (Pages Router heritage)
│   ├── components/             # Reusable UI component modules
│   ├── contexts/               # React Context Providers (Auth, Language, Theme)
│   ├── hooks/                  # Custom hooks (Cache management, UI actions)
│   ├── lib/                    # Server-side business logic and SDK setups
│   │   ├── db/                 # Database initialization (Mongoose)
│   │   ├── logger/             # Winston setup and custom Mongo transport
│   │   ├── models/             # Mongoose/MongoDB schemas
│   │   ├── founding-audit/     # Founding audit schema validation & logic
│   │   ├── stripe/             # Stripe config and subscription helpers
│   │   ├── helpers/            # Authentication, permissions, and auxiliary helpers
│   │   └── *Service.js         # Domain-specific client/server services
│   ├── services/               # Feature sub-services (Onboarding, Assembly, etc.)
│   ├── layouts/                # Base UI page frames (Main, Dashboard, etc.)
│   ├── theme/                  # Color configurations and component style rules
│   └── utils/                  # Utility scripts (SMTP Mailers, etc.)
```

### Major Modules and Boundaries

| Module | Location | Inputs | Outputs | Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Appwrite Server Client** | `src/lib/appwrite-server.js` | Env variables, session token cookies | Instrumented SDK Client instances, collection constants | Instantiates public, session, and administrative Appwrite SDK connections wrapped with Winston logging proxies. |
| **Founding Audit Validator** | `src/lib/founding-audit/schema.js` | Phase data payloads | Zod Validation Result / Errors | Enforces strict legal rules on cooperative setups (e.g., minimum 3 founding members, suitability audits for board members based on age, CV presence, and share-holding). |
| **System Logger** | `src/lib/logger/` | Structured Log payloads | MongoDB Log Documents, stdout | Decouples logging severity routing and manages Winston transport mappings depending on the node environment. |
| **Authentication Helper** | `src/lib/helpers/_helpers.js` | Request cookies | User profile context (`userId`, `role`, `email`, `profileId`) | Parses Appwrite session tokens, fetches `/account` details, and resolves the correct profile information from Appwrite database collections. |
| **Voting Engine** | `src/lib/votingService.js` | Cooperative settings, AGM configurations | Quorum compliance flag, active poll states | Resolves voting parameters (e.g. member-based vs share-based) to calculate quorum compliance for general assembly meetings. |
| **Transaction Ledger** | `src/lib/transactionService.js` | Share transaction details | Synced ledger database records | Coordinates member share purchases, validate purchase thresholds, and manages payments. |
| **Language Context** | `src/contexts/LanguageContext.jsx` | UI Keys, toggle triggers | Translation text strings | Initializes `i18next` translation engine and manages case-insensitive translation resolution. |

---

## 4. Execution Lifecycle & Data Flow

### Request-Response Execution Lifecycle

```
[ Client Request ] 
       │
       ▼
 [ src/proxy.js ] ──► (Edge Runtime: Generates trace ID, sets "x-request-id", runs edgeLogger)
       │
       ▼
[ Route Handler ] ──► (Reads x-request-id, validates cookies via getAuthenticatedProfile)
       │
       ▼
[ Service Logic ] ──► (Runs logic, writes DB calls through Appwrite SDK clients)
       │
       ├──► [ Proxy Logger ] ──► (Intercepts SDK call, writes event data via Winston)
       │                                                                │
       │                                                                ▼
       │                                                     [ MongoDB Mongoose Doc ]
       ▼
[ HTTP Response ] ──► (Sets header x-request-id, returns JSON data to client)
```

1. **Proxy & Interception**: 
   An incoming HTTP request triggers the Next.js edge proxy (`src/proxy.js`). A UUID is generated and injected into request headers as `x-request-id`. The non-blocking `edgeLogger` writes the request path and method metadata to the console or POSTs it to the internal logging api.
2. **Endpoint Execution & Authentication**: 
   The request reaches the respective route handler in `src/app/api/`. If auth is required, `getAuthenticatedProfile()` parses the fallback session cookies and queries the Appwrite user directory. If labels contain `teamMember`, it loads configuration data from `COLLECTION_ID_AUDITTEAM_MEMBERS`, otherwise `COLLECTION_ID_PROFILE`.
3. **Database & SDK Operations**: 
   The service class performs databases/storage updates using an instrumented client. The Winston `MongoTransport` listens to proxy events asynchronously and writes log telemetry directly to the designated collection (`system_logs`, `audit_logs`, or `analytics_logs`) via Mongoose.
4. **Response**: 
   The route handler returns the JSON payload. The edge proxy attaches the matching `x-request-id` header to the response, allowing clients to trace logs from inception to output.

### Ledger Balance and Transaction Flow

1. A member requests a share subscription or purchase via `transactionService.js`.
2. The service queries `/api/cooperative/settings/[coopId]` to check boundary conditions (e.g. `min_shares`, `max_shares`, `share_price_cents`).
3. If valid, the price cents are calculated: `shares * share_price_cents`.
4. A transaction document is committed to Appwrite `COLLECTION_ID_TRANSACTION` with status `PENDING`.
5. Upon payment completion (tracked via Stripe Connect webhooks), the status shifts to `VERIFIED` and a record is committed to `COLLECTION_ID_TRANSACTIONS_LEDGER`.

---

## 5. Core Technologies & Dependencies

| Technology | Role | Version Range | Rationale |
| :--- | :--- | :--- | :--- |
| **Next.js** | Core Framework | `^16.1.2` | Implements server-side rendering, routing boundaries, and API route handlers. |
| **React** | Front-end Library | `^18.3.1` | Renders client UI components and manages state. |
| **Appwrite & node-appwrite** | Primary Database & BaaS | SDK `^18` / `^22` | Handles user authentication, object storage, and core schema databases. |
| **Mongoose & MongoDB** | Telemetry Database | `^9.7.1` | Selected for structural logging, storing rich event payloads as `Mixed` types. |
| **Winston** | Logging Middleware | `^3.19.0` | Orchestrates server-side logs and supports custom pipeline transports. |
| **Stripe** | Payment Processor | `^22.2.2` | Manages subscription licensing for cooperatives and Connect onboarding payouts for members. |
| **Zod** | Schema Validation | `^4.4.3` | Performs strict legal parsing and checks for multi-phase auditing documents. |
| **jsPDF & jsPDF-AutoTable** | PDF Report Generator | `^4` / `^5` | Renders official certificates and tables on the server and client. |

---

## 6. Interfaces, APIs & Integration Points

* **Appwrite API Boundary**: Server-side modules communicate via the `node-appwrite` SDK. Authentication uses Cookie-based session extraction since Appwrite relies on session tokens passed through standard headers.
* **Stripe Connect & Billing**:
  * *Connected Accounts*: Cooperative platforms integrate Stripe to accept payments from their members.
  * *Platform Subscriptions*: Cooperatives pay platform usage fees mapped to plans defined in the `COLLECTION_ID_SUBSCRIPTION_PLANS` collection.
  * *Webhooks*: `/api/payments/webhooks/connect` and `/api/payments/webhooks/platform` parse events to verify status changes.
* **Internal Log Pipeline**: `/api/internal/log` accepts POST requests from the Edge proxy to bridge logs safely into Winston.
* **SMTP Notifications**: Node Mailer and Mailgun are accessed via `src/utils/mailer.js` to dispatch transaction status updates, invitation links, and password resets.
* **Captcha Verification**: Integration with `@trustcomponent/trustcaptcha-nodejs` verifies user authentication submissions on sign-in and registration forms.

---

## 7. Known Constraints & Technical Debt

### 1. Hybrid Router Latency and Maintenance Overhead
Maintaining two separate routing architectures (App Router under `src/app` and Pages Router under `src/pages`) creates duplicate files and routing layers. Navigating between routes incurs suspense block delays as page components are loaded, wrapped, and mounted.

### 2. Recursive Attribute Removal on Schema Mismatch
The fallback update mechanisms in `_helpers.js` (`updateDocumentWithUnknownAttributeFallback` and `createDocumentWithUnknownAttributeFallback`) use a retry loop (up to 50 iterations) to delete unmapped fields.
* *Risk*: In production, if the local code models diverge significantly from the remote Appwrite schemas, updates will incur massive CPU and network overhead by triggering dozens of failed HTTP requests before succeeding.

### 3. Duplicate Service Methods
The codebase contains duplicate logic routes, such as `getMembersOfCoop` and `getMembersOfCoopOld` in `transactionService.js`. This creates technical debt and increases the risk of deploying obsolete code pathways.

### 4. Commented-out Client Configuration
The file `src/lib/appwrite.js` (intended for client-side SDK usage) is entirely commented out. As a result, the client app cannot connect directly to Appwrite. Instead, it must proxy all database queries and auth operations through backend Next.js API endpoints, increasing server load and latency.
