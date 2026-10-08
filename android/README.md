# iDentify v3.0 - Android Embedded Distribution

This directory contains the standalone Android APK distribution of the **iDentify DepEd School Management & Attendance SaaS Platform**.

---

## 📱 Architecture Overview

Unlike standard mobile wrappers that rely entirely on an external cloud server, this Android build runs **completely self-contained**:

```
+-------------------------------------------------------------+
|                 Android Device / Tablet                     |
|                                                             |
|  +-------------------------------------------------------+  |
|  |           Native Android Shell & WebView              |  |
|  |   - Status bar: Port 4000, Local IP, SQLite Status    |  |
|  |   - Fullscreen Kiosk Mode (Hardware turnstiles)       |  |
|  |   - Haptic Feedback & Audio Chime on Card Tap         |  |
|  +---------------------------+---------------------------+  |
|                              | HTTP localhost:4000          |
|  +---------------------------v---------------------------+  |
|  |           Embedded Kotlin HTTP Server                 |  |
|  |   - Listens on 0.0.0.0:4000 & 127.0.0.1:4000         |  |
|  |   - Serves complete REST API (/api/*)                 |  |
|  |   - Serves bundled web UI assets (HTML, CSS, JS)      |  |
|  |   - Allows LAN devices (Wi-Fi) to connect to server   |  |
|  +---------------------------+---------------------------+  |
|                              | Local SQL Queries            |
|  +---------------------------v---------------------------+  |
|  |           Android SQLite Database Engine              |  |
|  |   - File: identify_android.db                         |  |
|  |   - Tables: schools, users, sections, students,       |  |
|  |     attendance_logs, audit_logs, system_settings      |  |
|  |   - SHA-256 Hash Chaining Audit Trail                 |  |
|  |   - Fully pre-seeded with Sawat ES DepEd records      |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

---

## 📦 APK Artifact Locations

- **Primary Distribution Package:** `dist/iDentify-v3.0.0-android.apk` (11.9 MB)
- **Android Module Build Output:** `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🚀 How to Install on Android

### Method 1: Using ADB (Command Line)
Connect your Android tablet or phone via USB with USB Debugging enabled:
```bash
adb install -r dist/iDentify-v3.0.0-android.apk
```

### Method 2: Direct Device Install (Sideloading)
1. Transfer `dist/iDentify-v3.0.0-android.apk` to your Android device via USB, Google Drive, or local file share.
2. Tap the APK file in the Android File Manager to install.
3. Grant required permissions (Camera for barcode scanning, Vibration, and Network access).

---

## 🛠 Features in this Distribution

1. **Standalone Offline Execution:** Runs anywhere with zero external server dependencies. Works in airplane mode or remote DepEd school campuses without internet connectivity.
2. **Embedded Port 4000 REST API:**
   - `GET /api/schools`
   - `POST /api/auth/login`
   - `GET /api/students` & `POST /api/students`
   - `GET /api/attendance/roster`
   - `POST /api/kiosk/tap` (processes RFID badge taps, records turnstile entry/exit, triggers simulated SMS)
   - `GET /api/analytics/summary`
   - `GET /api/audit`
   - `GET /api/system/status`
3. **Local Wi-Fi / LAN Hotspot Access:**
   - The embedded server binds to `0.0.0.0:4000`.
   - The top status bar displays the device's local network IP (e.g., `http://192.168.1.50:4000`).
   - Other tablets, PCs, or turnstile scanners on the same school Wi-Fi network can open this URL in their browser to interact with the database!
4. **Turnstile Fullscreen Kiosk Mode:**
   - Immersive mode hides Android navigation and status bars for dedicated gate turnstile kiosk installations.
5. **Pre-Seeded Data:**
   - Sawat Elementary School (School ID: 101692, Division of Pangasinan II)
   - Super Admin, Principal Dr. Rico Idos, Faculty, and Staff accounts
   - Sections (Bonifacio, Rizal, Archimedes)
   - Sample learners with RFID cards and 4Ps beneficiary statuses
   - Genesis cryptographic audit block

---

## 🔄 How to Rebuild the APK

To recompile the Android distribution from the root repository:
```bash
npm run build:android
```
Or directly using Gradle:
```bash
cd android
./gradlew.bat assembleDebug
```
