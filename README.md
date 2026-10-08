# iDentify: Philippine DepEd Multi-Tenant School Management & Attendance SaaS

[![DepEd Order No. 8, s. 2015](https://img.shields.io/badge/DepEd-Order%20No.%208%2C%20s.%202015-blue.svg)](https://www.deped.gov.ph)
[![RA 10173 Compliant](https://img.shields.io/badge/Philippine%20DPA-RA%2010173-emerald.svg)](https://privacy.gov.ph)
[![SOC 2 Type 2](https://img.shields.io/badge/SOC%202-Type%202%20HMAC%20Chain-purple.svg)]()
[![License](https://img.shields.io/badge/License-Enterprise%20Proprietary-slate.svg)]()

> A production-grade, multi-tenant School Management and Automated Attendance SaaS platform compliant with Philippine Department of Education (DepEd) standards, complete with dynamic white-label branding, DepEd interoperability, and a self-healing, zero-friction, cross-environment 1-command startup bootstrap.

---

## 🚀 ZERO-CONFIGURATION 1-COMMAND BOOTSTRAP

The platform is engineered to run seamlessly across **Windows (PowerShell/WSL2)**, **macOS**, and **Linux (Ubuntu/Debian, Fedora/RHEL)** with zero manual environment preparation.

### Windows (Command Prompt or PowerShell)
Double-click `launch.bat` or run:
```powershell
.\launch.bat
# Or directly via PowerShell
.\launch.ps1
```

### macOS & Linux (Ubuntu, Debian, Fedora, Arch)
```bash
chmod +x ./launch.sh
./launch.sh
```

### What the 1-Command Bootstrap Does Automatically:
1. **Automated Prerequisite Detection & Provisioning:**
   - Detects OS family (`darwin`, `linux-gnu`, `msys`, `win32`).
   - Checks presence of prerequisites: Node.js (LTS), npm/pnpm, Docker, Docker Compose, PostgreSQL tools.
   - If missing, auto-installs them via native package managers (`winget` / `choco` on Windows; `brew` on macOS; `apt-get` / `dnf` on Linux).
2. **Environment & Cryptographic Secrets Generation:**
   - Checks if `.env` exists; if missing, copies `.env.example` and automatically generates 32-byte cryptographically secure random secrets for:
     - `JWT_SECRET`, `JWT_REFRESH_SECRET`, `HMAC_AUDIT_SALT`, `ENCRYPTION_KEY`.
   - Runs port collision detection for PostgreSQL (`5432`), Redis (`6379`), Backend API (`4000`), and Frontend (`3000`).
3. **Database Health & Migration Auto-Check:**
   - Spins up PostgreSQL 16 and Redis 7 via Docker Compose (with resilient local fallback).
   - Executes readiness probe (`pg_isready`) before loading database DDL, triggers, and seeders.
   - Executes all DDL migrations, trigger attachments, and initial seeders (default `SUPER_ADMIN` credentials, sample demo schools, and mock DepEd grade levels/sections).
4. **Service Launch & Interactive Credentials Banner:**
   - Launches both Backend and Frontend and displays access URLs and role test credentials in the console.

---

## 🏛️ MULTI-TENANT ARCHITECTURE & BRANDING

- **Tenant Boundary Isolation:** Multi-tenancy keyed by `school_id`. Implements strict database **Row-Level Security (RLS)** policies enforcing tenant boundary isolation across every query and mutation (`SET LOCAL app.current_school_id = ...`).
- **Subdomain & Slug Routing:** Resolve tenant via subdomain (`schoolname.saasdomain.ph`) or route prefix (`/schools/[slug]`).
- **Dynamic White-Label Branding:**
  - **Custom Login Screen:** Isolates tenant branding, dynamically loading the tenant's official School Name, high-resolution Logo (SVG/PNG), and 6-digit DepEd School ID.
  - **Authenticated App Shell:** Persistent layout (navbar, headers, report cards) dynamically renders active school branding.
- **Safe Testing / Teardown Engine (`PURGE_SCHOOL_CASCADE`):**
  - Protected by a **Dual-Token Confirmation Protocol**:
    1. Super Admin Password Re-Verification
    2. Dynamic TOTP / OTP Token Validation (`DEPED-PURGE-CONFIRM` or numeric TOTP).
  - Completely wipes test-tenant data (students, teachers, enrollments, RFID token links, and attendance ledgers) cleanly after sandbox/trial runs.
- **SOC 2 Type 2 Append-Only Audit Ledger:**
  - Tamper-evident audit ledger (`audit_logs`) tracking: Actor ID, School ID, Role, Action, Target Entity, millisecond timestamp, Client IP, and SHA-256 HMAC hash chains linked to the previous log entry.
  - PostgreSQL trigger and permissions permanently revoking `UPDATE`, `DELETE`, and `TRUNCATE` operations on audit logs.

---

## 📟 KIOSK STATION (GATE / TURNSTILE SYSTEM)

- **Visual Layout & UI Blueprint:**
  - **Top Banner:** Display official tenant School Name clearly rendered at the top header with a clean, high-contrast digital clock (`YYYY-MM-DD HH:mm:ss`).
  - **Center Hero Area:** Centered prominently in the middle of the screen, renders the tenant's School Logo spanning **50% of the viewport width/height at exactly 30% opacity** (`opacity: 0.30; w-[50vw] max-w-[500px] pointer-events-none`).
  - **Active Scanning Zone:** Ambient listening overlay centered over the watermark indicating scan readiness (supporting USB HID keyboard emulation RFID readers, manual keypad, and webcam scanner).
- **Scan Workflow & Debounce Engine:**
  - Upon RFID/Barcode tap: Instantly captures timestamp with seconds (`YYYY-MM-DD HH:mm:ss`).
  - Flashes Student Name, Grade/Section, Photo, and Clock-In / Clock-Out status for **exactly 2 seconds**, then resets immediately to the ambient listening state with the centered 30% opacity logo.
- **State Machine Rules:**
  - **First tap of the day:** `Clock-In`.
  - **Any tap occurring within the next 30 minutes:** duplicate/debounce event (logs event, maintains `Clock-In` status, prevents accidental double-tap).
  - **First tap executed after the 30-minute window:** `Clock-Out`.
- **SMS Gateway Integration:**
  - Asynchronous background worker dispatch to Semaphore or PhilSMS API upon valid gate scan.
  - SMS template dispatched to parent's registered mobile number:
    `"[Student Name] has safely clocked [IN/OUT] at [School Name] at [Time]."`

---

## 📊 DEPED SYSTEM INTEGRATION & STANDARD FORMS

- **Integration Service (`DepEdIntegrationService`):**
  - **Direct API Mode:** OAuth2 / API Key client connecting with DepEd Central Office LIS API endpoints. Two-way sync: Pull officially validated LRNs and demographics; push section assignments and End-of-School-Year (EOSY) status codes.
  - **Bi-directional Excel/CSV Engine:** Ingest and export official DepEd-compliant bulk datasets matching LIS export/import layouts.
- **Automated School Form Generators:**
  - **School Form 1 (SF1):** School Register (populated from Enhanced BEEF data).
  - **School Form 2 (SF2):** Daily Attendance Report of Learners (aggregated automatically from kiosk turnstiles and in-room attendance logs).
  - **School Form 5 (SF5):** Report on Promotion and Learning Progress & Achievement.

---

## 👥 ROLE-BASED ACCESS & CREDENTIALS

| Role Scope | Pre-Seeded Email | Password | Access Highlights |
|---|---|---|---|
| **SUPER_ADMIN** | `superadmin@deped.gov.ph` | `SuperAdmin123!` | School Provisioning, BEEF Bulk Import, RFID Mapper, Dual-Token Purge, SOC 2 Audit Ledger |
| **PRINCIPAL** | `principal@mabini.deped.gov.ph` | `Principal123!` | Holistic K-12 Enrollment Charts, Passing vs At-Risk cohorts, Section allocations |
| **HEAD_TEACHER** | `ht.jhs@mabini.deped.gov.ph` | `HeadTeacher123!` | Scoped to assigned tier (Junior High: Grades 7-10), Teacher & scheduling oversight |
| **TEACHER** | `teacher.santos@mabini.deped.gov.ph` | `Teacher123!` | Section roster roll call, Present/Late/Absent/Excused (with mandatory note), live SF2 daily tracker |
| **TURNSTILE KIOSK**| `kiosk1@mabini.deped.gov.ph` | `KioskPass123!` | Main Gate Turnstile Terminal with 50% scale 30% opacity watermark & 2s flash feedback |
| **STUDENT** | `juan.delacruz@student.deped.gov.ph` | `Student123!` | Read-only DepEd Enhanced BEEF profile card, 4Ps beneficiary badge, attendance diary |

---

## 🛠️ TECH STACK

- **Backend:** Node.js (NestJS / TypeScript) with modular architecture.
- **Frontend:** Next.js (App Router), Tailwind CSS, Lucide Icons.
- **Database:** PostgreSQL 16+ with Row-Level Security (RLS) enabled on all tenant tables.
- **Cache / Job Queue:** Redis 7+ with BullMQ for scan debouncing, async SMS dispatch, and DepEd sync.
- **SMS Gateway Adapters:** Pluggable Semaphore API & PhilSMS API client with local mock mode.
- **File Storage:** AWS S3 / Cloudflare R2 client with local MinIO fallback.
- **Security:** JWT HTTP-only cookies, refresh token rotation, TOTP 2FA, SOC 2 SHA-256 HMAC hash chains.

---

## 📄 COMPLIANCE & LEGAL NOTICES
- **DepEd Order No. 8, s. 2015**: Policy Guidelines on Classroom Assessment & Attendance Reporting.
- **Republic Act No. 10173**: Philippine Data Privacy Act of 2012 (DPA).
- **SOC 2 Type 2**: Append-only, tamper-evident audit trails with cryptographic hash chaining.
