# iDentify: Philippine DepEd Multi-Tenant School Management & Attendance SaaS

[![DepEd Order No. 8, s. 2015](https://img.shields.io/badge/DepEd-Order%20No.%208%2C%20s.%202015-blue.svg)](https://www.deped.gov.ph)
[![RA 10173 Compliant](https://img.shields.io/badge/Philippine%20DPA-RA%2010173-emerald.svg)](https://privacy.gov.ph)
[![SOC 2 Type 2](https://img.shields.io/badge/SOC%202-Type%202%20HMAC%20Chain-purple.svg)]()
[![Android APK](https://img.shields.io/badge/Android-v3.0.0%20Embedded%20APK-green.svg)](file:///android/README.md)
[![License](https://img.shields.io/badge/License-Enterprise%20Proprietary-slate.svg)]()

> **iDentify** is an enterprise-grade, multi-tenant School Management, Biometric/RFID Turnstile Attendance, and DepEd Compliance SaaS platform built specifically for Philippine public and private schools. Designed to comply with Philippine Department of Education (DepEd) mandates, the platform features dynamic white-label multi-tenancy, an immutable SOC 2 Type 2 audit ledger, official DepEd School Forms generation (SF1, SF2, SF5, CS Form 48), a 6-theme adaptive design system, and an offline-first embedded Android distribution.

---

## 📑 TABLE OF CONTENTS

- [✨ Core Highlights & Capabilities](#-core-highlights--capabilities)
- [🎨 Design System & Aesthetics (6 Themes)](#-design-system--aesthetics-6-themes)
- [📱 Android Embedded Distribution](#-android-embedded-distribution)
- [🚀 Zero-Configuration 1-Command Bootstrap](#-zero-configuration-1-command-bootstrap)
- [🏛️ Multi-Tenant Architecture & White-Labeling](#️-multi-tenant-architecture--white-labeling)
- [📟 Gate RFID Turnstile Kiosk Terminal](#-gate-rfid-turnstile-kiosk-terminal)
- [📊 DepEd Official School Forms & Compliance](#-deped-official-school-forms--compliance)
- [💼 Civil Service Form No. 48 (CS Form 48 / DTR)](#-civil-service-form-no-48-cs-form-48--dtr)
- [📈 Academic & Attendance Analytics Engine](#-academic--attendance-analytics-engine)
- [📋 Student Database & Enhanced BEEF](#-student-database--enhanced-beef)
- [👥 Role-Based Access Control (RBAC) & Test Credentials](#-role-based-access-control-rbac--test-credentials)
- [🔐 Security & Immutable SOC 2 Type 2 Audit Ledger](#-security--immutable-soc-2-type-2-audit-ledger)
- [🛠️ Technology Stack](#️-technology-stack)
- [📄 Philippine Regulatory Compliance](#-philippine-regulatory-compliance)

---

## ✨ CORE HIGHLIGHTS & CAPABILITIES

| Feature Module | Key Functional Highlights |
|---|---|
| **Gate Turnstile Kiosk** | Ambient listening screen with 50% scale / 30% opacity watermark, USB HID RFID autofocus, 30-min auto debounce, 2s flash feedback, audio chime, and instant Parent SMS dispatch. |
| **DepEd Standard Forms** | 1-click pixel-perfect generation and printing for **SF1** (School Register), **SF2** (Daily Attendance with calendar grid), and **SF5** (Report on Promotion & Learning Progress). |
| **Faculty & Staff DTR** | **Civil Service Form No. 48 (CS Form 48)** supporting both official **DepEd eHRIS** and **DepEd SARAH** biometrics formats with automated undertime and tardiness calculation. |
| **Enhanced BEEF Database** | Full Basic Education Enrollment Form (BEEF) support: 12-digit LRN modulo-10 validation, PSA birth certificate, Mother Tongue, 4Ps CCT Household ID, IP community, and webcam photo capture. |
| **Unified Student Timeline** | Consolidated chronological ledger merging Turnstile gate scans (Clock In/Out/Debounced) and in-room classroom roll calls with filterable audit details. |
| **Classroom Roll Call** | Section roll call with real-time Gate status cross-referencing, Present / Absent / Tardy / Excused (mandatory reason note) / Dropped markers, and batch actions. |
| **Academic Loads & Sections** | Multi-tier curriculum configuration (Junior High & Senior High STEM, HUMSS, ABM, TVL, GAS), teacher load schedules, and section capacity monitoring. |
| **RPMS / IPCRF Teacher Ratings** | DepEd Results-Based Performance Management System evaluation modal (Pedagogy, Classroom Management, Attendance Compliance, Learner Engagement, Forms Compliance). |
| **Multi-Gateway Parent SMS** | Pluggable support for **EasySMS**, **Semaphore**, and **PhilSMS** APIs with test modal, live balance checks, and sender ID masking. |
| **Super Admin Persona Spoofing** | Super Admin simulation tool to instantly test and impersonate any Principal, Head Teacher, Teacher, or Admin Assistant view with 1-click revert. |
| **Offline Android APK** | Standalone Android distribution featuring an embedded Kotlin HTTP REST server on port 4000 and local SQLite engine, operable in 100% offline environments or as a Wi-Fi hotspot. |

---

## 🎨 DESIGN SYSTEM & AESTHETICS (6 THEMES)

iDentify features an adaptive, high-contrast design system crafted to look stunning in both daylight administrative offices and low-light gate guard posts. The system provides **6 curated themes** (3 Light Modes and 3 Dark Modes) accessible via the top navigation bar or the School Settings panel:

```
+---------------------------------------------------------------------------------------+
|                                6-THEME COLOR ENGINE                                   |
+-------------------------------------------+-------------------------------------------+
|               LIGHT MODES                 |                DARK MODES                 |
+-------------------------------------------+-------------------------------------------+
| ☀️ Facebook Light (Default)               | 🌙 Facebook Dark                          |
|    - Clean canvas: #F0F2F5, surface: #FFF |    - Canvas: #18191A, surface: #242526     |
|    - Primary: Facebook Blue (#1877F2)     |    - Primary: Vibrant Blue (#2D88FF)      |
|    - High-contrast, minimal eye strain    |    - Classic social dark mode aesthetic   |
|                                           |                                           |
| 🌿 DepEd Light                            | 🌌 Obsidian Dark                          |
|    - Canvas: #F8FAFC, surface: #FFF       |    - Canvas: #020617, surface: #0F172A     |
|    - Primary: DepEd Emerald (#059669)     |    - Primary: Royal Blue (#2563EB)        |
|    - Official DepEd institutional feel    |    - Deep space contrast with neon glows  |
|                                           |                                           |
| 🏛️ Slate Light                            | 🌲 Emerald Dark                           |
|    - Canvas: #F1F5F9, surface: #FFF       |    - Canvas: #061412, surface: #0B221E     |
|    - Primary: Academic Indigo (#4F46E5)   |    - Primary: Mint Emerald (#059669)      |
|    - Structured administrative layout     |    - Organic dark palette for kiosks      |
+-------------------------------------------+-------------------------------------------+
```

### Visual Experience Design Features:
- **Glassmorphic App Shell (`BrandedShell`)**: Frosted backdrop blur, ambient neon glows, and custom scrollbars.
- **Micro-Animations & Keyframe Motion**: Subtle scaling on hover, tab transitions, and pulsing scan indicators.
- **Live Theme Toggle**: Instant switch between light and dark modes with a single click in the top navigation bar.
- **DepEd Typography**: Optimized system typography with fallback font stacks matching official DepEd circulars and publications.

---

## 📱 ANDROID EMBEDDED DISTRIBUTION

For remote school campuses, mobile guard stations, or areas with unstable internet connectivity, iDentify includes a **standalone Android distribution** located in the [`android/`](file:///android/README.md) directory:

```
+-----------------------------------------------------------------------+
|                       Android Device / Tablet                         |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |                 Native Android Shell & WebView                  |  |
|  |   - Status bar: Local IP, Port 4000, SQLite Status              |  |
|  |   - Fullscreen Kiosk Immersive Mode (Turnstiles)                |  |
|  |   - Haptic feedback & audio chime on card tap                   |  |
|  +--------------------------------+--------------------------------+  |
|                                   | HTTP localhost:4000               |
|  +--------------------------------v--------------------------------+  |
|  |                   Embedded Kotlin HTTP Server                   |  |
|  |   - Listens on 0.0.0.0:4000 & 127.0.0.1:4000                   |  |
|  |   - Complete REST API (/api/*) + bundled frontend assets        |  |
|  |   - Operates as a LAN server for other devices over Wi-Fi       |  |
|  +--------------------------------+--------------------------------+  |
|                                   | Local SQL Queries                 |
|  +--------------------------------v--------------------------------+  |
|  |                 Android SQLite Database Engine                  |  |
|  |   - Database file: identify_android.db                          |  |
|  |   - Pre-seeded with Sawat ES DepEd records and test users       |  |
|  |   - SHA-256 HMAC hash chaining audit trail                      |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------------------------------------------+
```

### Android Package Details:
- **Pre-Built APK:** [`dist/iDentify-v3.0.0-android.apk`](file:///dist/iDentify-v3.0.0-android.apk) (~11.9 MB)
- **Local Hotspot Wi-Fi Support:** Binds to `0.0.0.0:4000` — other tablets, turnstiles, or PCs on the school's local network can navigate to `http://<device-ip>:4000` to interact with the database.
- **Rebuilding the APK:**
  ```bash
  npm run build:android
  ```

---

## 🚀 ZERO-CONFIGURATION 1-COMMAND BOOTSTRAP

The platform is engineered to start with a single command across **Windows**, **macOS**, and **Linux**, automatically detecting the OS and installing missing dependencies.

### Windows (PowerShell or Command Prompt)
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

### What the Bootstrap Script Does Automatically:
1. **Prerequisite Provisioning:** Detects OS and provisions Node.js (LTS), Docker, Docker Compose, and PostgreSQL client if missing (via `winget`/`choco`, `brew`, or `apt-get`/`dnf`).
2. **Cryptographic Secrets Generation:** Copies `.env.example` to `.env` if missing and generates 32-byte cryptographically secure random keys (`JWT_SECRET`, `JWT_REFRESH_SECRET`, `HMAC_AUDIT_SALT`, `ENCRYPTION_KEY`).
3. **Database Health & Seed:** Boots PostgreSQL 16 and Redis 7 via Docker Compose (with resilient local fallbacks), runs schema migrations, and seeds default DepEd schools, sections, and user accounts.
4. **Service Launch & Credentials Banner:** Spawns both Backend (port 4000) and Frontend (port 3000) concurrently and displays an interactive console banner with test credentials.

---

## 🏛️ MULTI-TENANT ARCHITECTURE & WHITE-LABELING

- **Tenant Isolation:** Multi-tenancy keyed by `school_id`. Every SQL operation is protected by database **Row-Level Security (RLS)** (`SET LOCAL app.current_school_id = ...`), ensuring data isolation between schools.
- **Subdomain & Slug Routing:** Schools can access their portal via dedicated subdomains (`schoolname.saasdomain.ph`) or standard route prefixes (`/schools/[slug]`).
- **Dynamic White-Label Branding:**
  - School Name, 6-digit DepEd School ID, Division, and Region dynamically populate all navigation bars, report cards, and kiosk screens.
  - School Logo upload with image preview and fallback handlers.
- **Safe Testing / Teardown Engine (`PURGE_SCHOOL_CASCADE`):**
  - Protected by a **Dual-Token Confirmation Protocol**:
    1. Super Admin Password Re-Verification.
    2. Dynamic confirmation token validation (`DEPED-PURGE-CONFIRM`).
  - Securely wipes test-tenant data (learners, faculty, attendance logs, RFID mappings) after pilot deployments without leaving orphan records.

---

## 📟 GATE RFID TURNSTILE KIOSK TERMINAL

Designed for high-throughput school gate terminals, turnstiles, and security guard posts (`/kiosk`):

```
+-----------------------------------------------------------------------------------+
|  SAWAT ELEMENTARY SCHOOL                     2026-10-08 07:15:22 AM  •  THURSDAY  |
|  DepEd School ID: 101692                                    Gate 1 Terminal       |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                                                                                   |
|                        [  OFFICIAL SCHOOL SEAL WATERMARK  ]                       |
|                          (50% Viewport Scale, 30% Opacity)                        |
|                                                                                   |
|                                                                                   |
|                      +-------------------------------------+                      |
|                      |         RFID SCANNING READY         |                      |
|                      |  Tap your DepEd ID Card on scanner  |                      |
|                      +-------------------------------------+                      |
|                                                                                   |
+-----------------------------------------------------------------------------------+
|  RECENT TAP ACTIVITY (LIVE AUDIT FEED)                                            |
|  - Juan Dela Cruz (Grade 10 Bonifacio) -> CLOCKED IN @ 07:14:58 AM [SMS DISPATCHED] |
|  - Maria Santos (Faculty - Math)       -> CLOCKED IN @ 07:13:42 AM                |
+-----------------------------------------------------------------------------------+
```

### Kiosk Features:
1. **Visual Watermark Layout:** Centered official school logo rendered at **50% of viewport width/height at exactly 30% opacity** behind the active scan zone.
2. **Continuous Autofocus:** Background listener captures keystrokes from USB HID RFID / barcode scanners without requiring user clicks.
3. **Smart Debounce State Machine:**
   - **First tap of the day:** Recorded as `CLOCK_IN`.
   - **Taps within 30 minutes (configurable):** Recorded as `DEBOUNCED` duplicate event (prevents accidental double-swipes).
   - **First tap after the debounce window:** Recorded as `CLOCK_OUT`.
4. **2-Second Visual Flash Feedback:** Displays student/faculty photo, full name, LRN, grade & section, timestamp, and status badge before resetting to scan readiness.
5. **Parent SMS Notification Dispatch:** Automatically dispatches an SMS alert to the registered parent/guardian mobile number (e.g., *"Juan Dela Cruz has safely clocked IN at Sawat Elementary School at 07:15 AM"*).

---

## 📊 DEPED OFFICIAL SCHOOL FORMS & COMPLIANCE

iDentify includes an automated reporting engine (`/deped-forms`) conforming to official Department of Education orders:

### 1. School Form 1 (SF1) — School Register
- Complies with DepEd Enhanced BEEF standards.
- Detailed learner demographics: 12-digit LRN, PSA Birth Certificate Number, Name (Last, First, Middle, Extension), Sex, Birthdate, Age, Mother Tongue, IP Community, Complete Address, Parents' and Guardians' names and contact numbers.
- Automated tagging of **4Ps beneficiaries** (Pantawid Pamilyang Pilipino Program).

### 2. School Form 2 (SF2) — Daily Attendance Report of Learners
- Full monthly calendar matrix matching the official DepEd SF2 grid layout.
- Daily attendance codes: **P** (Present), **A** (Absent), **L** (Tardy/Late), **E** (Excused).
- Automatic calculation of:
  - Total Monthly Present, Absent, and Tardy per learner.
  - Percentage of Attendance for the month.
  - Consecutive 5-day absence detection (early warning for dropout risk).
  - Male and Female demographic subtotals.

### 3. School Form 5 (SF5) — Report on Promotion and Learning Progress
- End-of-School-Year (EOSY) promotion tracking:
  - **Promoted** (General Average >= 75 with no failed learning areas).
  - **Conditionally Promoted** (Passed general average but failed 1-2 learning areas).
  - **Retained** (Failed 3 or more learning areas).
- Automatic Honor Roll categorization:
  - *With Highest Honors* (98.00 – 100.00)
  - *With High Honors* (95.00 – 97.99)
  - *With Honors* (90.00 – 94.99)

---

## 💼 CIVIL SERVICE FORM NO. 48 (CS FORM 48 / DTR)

Built directly into the Faculty & Staff module (`/dashboard?nav=users` -> DTR Tab), iDentify generates official **Civil Service Form No. 48 Daily Time Records**:

```
+-------------------------------------------------------------+
|                CIVIL SERVICE FORM NO. 48                    |
|                    DAILY TIME RECORD                        |
|                                                             |
| Name: MARIA FE SANTOS, LPT         Employee No: 4892011     |
| Position: Teacher III              Plantilla: TCH3-0912-2018|
| Station: Sawat Elementary School   Salary Grade: SG-13      |
| Month: October 2026                School ID: 101692        |
+-------------------------------------------------------------+
| Day |     A.M.      |     P.M.      |    UNDERTIME / LATE   |
|     | In    |  Out  | In    |  Out  |  Hours  |   Minutes   |
|-----+-------+-------+-------+-------+---------+-------------|
|  1  | 07:15 | 12:00 | 13:00 | 17:00 |    -    |      -      |
|  2  | 07:28 | 12:00 | 13:00 | 17:00 |    -    |     13      |
| ... |  ...  |  ...  |  ...  |  ...  |   ...   |     ...     |
+-------------------------------------------------------------+
| I certify on my honor that the above is a true and correct  |
| record of the hours of work performed...                    |
|                                                             |
| __________________________       __________________________ |
| Personnel Signature              DR. RICO IDOS, Principal I |
+-------------------------------------------------------------+
```

### CS Form 48 Features:
- **Dual Format Support:** Switchable between **DepEd eHRIS** (Self-Service) and **DepEd SARAH** (Biometrics host) formats.
- **Accurate Time Computation:** Calculates exact daily AM and PM ins and outs, aggregating monthly total hours, undertime minutes, and tardiness.
- **Official Print Layout:** Fully formatted with official Philippine Civil Service Commission certification verbiage and signature blocks for the employee and school head.

---

## 📈 ACADEMIC & ATTENDANCE ANALYTICS ENGINE

The executive dashboard (`/dashboard`) provides real-time telemetry tailored to the authenticated role:

- **Role-Based Scoping:** Teachers view metrics strictly for their assigned sections; Principals and Super Admins view holistic school-wide datasets.
- **Interactive Attendance Trends:** Visual day-by-day charts comparing male vs. female attendance, tardiness, and unexcused absences.
- **Demographic Breakdown & Drill-Down Modal:**
  - 4Ps CCT Beneficiaries, Balik-Aral, IP Learners, and Children with Disabilities (CWD).
  - Clickable modal allowing administrators to search and filter students within any demographic group.
- **Academic Cohort Distribution:** Real-time breakdown of students by academic standing (With Highest Honors, With High Honors, With Honors, Passing, At-Risk).
- **Intervention Dispatch for Chronic Absenteeism:** Immediate action triggers allowing advisers and principals to dispatch parent SMS notices or refer learners to Guidance Counselors with live toast feedback.
- **DepEd RPMS / IPCRF Teacher Performance Ratings:** Formal evaluation modal measuring Pedagogy, Classroom Management, Attendance Compliance, Learner Engagement, and Forms Compliance.

---

## 📋 STUDENT DATABASE & ENHANCED BEEF

The Learner Database (`/dashboard?nav=students`) serves as the single source of truth for student demographics:

- **Official BEEF Schema:** Supports PSA birth cert number, LRN, mother tongue, 4Ps household ID, disability indicators, and complete parent/guardian contact details.
- **LRN Modulo-10 Checksum Validator:** Built-in validation algorithm ensuring 12-digit Learner Reference Numbers match official DepEd formatting rules.
- **Webcam Photo Capture:** In-browser camera capture to snap and attach learner ID photos directly to their digital profile.
- **RFID Card Assignment:** Instant tap-to-assign modal linking physical 13.56 MHz / 125 kHz RFID badges to learner profiles with duplicate tag detection.
- **DepEd CSV / Excel Bulk Import:** Bulk ingest LIS-exported learner rosters with field-by-field validation and error reporting.

---

## 👥 ROLE-BASED ACCESS CONTROL (RBAC) & TEST CREDENTIALS

The platform features pre-seeded accounts configured with realistic DepEd roles and permissions:

| Role Scope | Pre-Seeded Email | Password | Access Highlights |
|---|---|---|---|
| **SUPER_ADMIN** | `superadmin@deped.gov.ph` | `SuperAdmin123!` | Multi-School Provisioning, BEEF Bulk Import, RFID Mapper, Dual-Token Purge, Persona Spoofing, SOC 2 Audit Ledger |
| **PRINCIPAL** | `principal.sawat@deped.gov.ph` | `Principal123!` | Holistic K-12 Enrollment & Attendance Charts, Faculty Roster, CS Form 48 Verification, RPMS/IPCRF Teacher Ratings |
| **ADMIN_ASSISTANT (AO)** | `ao.sawat@deped.gov.ph` | `AdminPass123!` | Faculty & Student CRUD, DepEd CSV/Excel Ingestion, Section & Subject Roster Management |
| **MASTER_TEACHER** | `mt.aquino@deped.gov.ph` | `Teacher123!` | Assigned Section Roll Call, Subject Load Oversight, Personal CS Form 48 DTR, SF2 Attendance Validation |
| **TEACHER** | `teacher.santos@deped.gov.ph` | `Teacher123!` | Daily Classroom Roll Call with Turnstile cross-check, SF2 Generation, Personal CS Form 48 DTR |
| **HEAD_TEACHER** | `ht.jhs@mabini.deped.gov.ph` | `HeadTeacher123!` | Secondary School Tier Oversight (Junior High Grades 7-10), Faculty Scheduling, Attendance Aggregations |
| **TURNSTILE KIOSK** | `kiosk1@mabini.deped.gov.ph` | `KioskPass123!` | Dedicated Gate Turnstile Station with 50% scale 30% opacity watermark, USB RFID listener, and Parent SMS dispatch |
| **STUDENT** | `juan.delacruz@student.deped.gov.ph` | `Student123!` | Read-only DepEd Enhanced BEEF profile, 4Ps beneficiary badge, personal gate attendance log |

---

## 🔐 SECURITY & IMMUTABLE SOC 2 TYPE 2 AUDIT LEDGER

- **Cryptographic Hash Chaining:** Every administrative action is written to an append-only ledger (`audit_logs`) linked via **SHA-256 HMAC hash chains** (`previous_hash` -> `current_hash`).
- **Tamper Detection Engine:** Built-in validator checks ledger integrity on load, highlighting any altered, inserted, or deleted records.
- **Database Immutability:** PostgreSQL triggers and permissions strictly prevent `UPDATE`, `DELETE`, and `TRUNCATE` operations on audit tables.
- **Session Security:** HTTP-only cookies, JWT access tokens with refresh token rotation, and TOTP 2FA support.
- **Data Privacy:** Full compliance with the Philippine Data Privacy Act of 2012 (RA 10173).

---

## 🛠️ TECHNOLOGY STACK

```
+-----------------------------------------------------------------------------------+
|                                 FRONTEND                                          |
|  Next.js 14 (App Router)  •  React 18  •  TypeScript  •  Tailwind CSS             |
|  Lucide Icons  •  6-Theme Dynamic Engine  •  Print CSS Media Engine               |
+-----------------------------------------------------------------------------------+
|                                 BACKEND                                           |
|  Node.js LTS  •  NestJS Architecture  •  Express  •  TypeScript                   |
|  JWT & Refresh Token Rotation  •  Crypto HMAC SHA-256 Engine                      |
+-----------------------------------------------------------------------------------+
|                           DATABASE & CACHE                                        |
|  PostgreSQL 16 (Row-Level Security RLS)  •  Redis 7 (BullMQ Jobs & Debouncing)     |
|  Docker & Docker Compose Orchestration  •  In-Memory / SQLite Fallback            |
+-----------------------------------------------------------------------------------+
|                          MOBILE & EMBEDDED                                        |
|  Standalone Android APK (Kotlin)  •  Embedded HTTP Server (Port 4000)             |
|  Local SQLite Database Engine  •  LAN Wi-Fi Hotspot Server Mode                   |
+-----------------------------------------------------------------------------------+
|                         THIRD-PARTY INTEGRATIONS                                  |
|  EasySMS API  •  Semaphore SMS API  •  PhilSMS API                                |
|  DepEd LIS (Learner Information System) CSV & API Connectors                      |
+-----------------------------------------------------------------------------------+
```

---

## 📄 PHILIPPINE REGULATORY COMPLIANCE

- **DepEd Order No. 8, s. 2015:** Policy Guidelines on Classroom Assessment & Attendance Reporting for the K to 12 Basic Education Program.
- **Republic Act No. 10173 (Data Privacy Act of 2012):** Strict encryption of student PII, parent contact details, and biological markers.
- **Civil Service Commission Memorandum Circular No. 21, s. 1991:** Standard rules governing the maintenance and certification of Daily Time Records (CS Form 48).
- **DepEd Order No. 58, s. 2017:** Adoption of New School Forms for Kindergarten, Senior High School, and Alternative Learning System (ALS).

---

<p align="center">
  <b>iDentify Platform</b> &bull; Built with pride for Philippine Public and Private Schools.<br>
  <sub>Copyright &copy; 2026 iDentify Team. All rights reserved.</sub>
</p>
