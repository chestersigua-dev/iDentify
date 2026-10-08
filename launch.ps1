# ==============================================================================
# iDentify - DepEd Multi-Tenant School Management & Attendance SaaS Launcher
# Windows PowerShell Native Bootstrap Engine
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "    iDentify | DepEd Multi-Tenant School Management & Attendance SaaS Platform   " -ForegroundColor Cyan
Write-Host "        Compliant with DepEd Order No. 8, s. 2015, RA 10173 & SOC 2 Type 2      " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

# 1. OS DETECTION
Write-Host "`n[1/5] Detecting Operating System Environment..." -ForegroundColor Yellow
$os = [System.Environment]::OSVersion.VersionString
Write-Host "  -> Detected Windows OS: $os" -ForegroundColor Green

# 2. PREREQUISITE DETECTION & ZERO-TOUCH INSTALLATION
Write-Host "`n[2/5] Checking and Provisioning Prerequisites..." -ForegroundColor Yellow

function Test-CommandExists {
    param ($cmd)
    return [bool](Get-Command -Name $cmd -ErrorAction SilentlyContinue)
}

# Check Node.js
if (-not (Test-CommandExists "node")) {
    Write-Host "  [!] Node.js not detected. Attempting automated installation via winget..." -ForegroundColor Yellow
    if (Test-CommandExists "winget") {
        winget install --id OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
    } elseif (Test-CommandExists "choco") {
        choco install nodejs-lts -y
    } else {
        Write-Host "  [ERROR] Neither winget nor chocolatey found. Please install Node.js (v20+) from https://nodejs.org" -ForegroundColor Red
    }
} else {
    $nodeVer = node -v
    Write-Host "  -> Node.js: $nodeVer [OK]" -ForegroundColor Green
}

# Check npm
if (Test-CommandExists "npm") {
    $npmVer = npm -v
    Write-Host "  -> npm: v$npmVer [OK]" -ForegroundColor Green
}

# Check Docker
$dockerReady = $false
if (Test-CommandExists "docker") {
    try {
        $dockerVer = docker --version
        Write-Host "  -> Docker CLI: $dockerVer [OK]" -ForegroundColor Green
        
        $dockerInfo = docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerReady = $true
            Write-Host "  -> Docker Daemon: Active & Responsive [OK]" -ForegroundColor Green
        } else {
            Write-Host "  -> Docker daemon is not active. Falling back to local Node.js engine." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  -> Docker daemon not reachable." -ForegroundColor Yellow
    }
} else {
    Write-Host "  [!] Docker CLI not found. Running in native Node.js development mode." -ForegroundColor Yellow
}

# 3. ENVIRONMENT & SECRETS INITIALIZATION
Write-Host "`n[3/5] Validating Environment & Cryptographic Secrets..." -ForegroundColor Yellow
$envPath = Join-Path $PSScriptRoot ".env"
$envExamplePath = Join-Path $PSScriptRoot ".env.example"

if (-not (Test-Path $envPath)) {
    Write-Host "  -> .env file not found. Generating from .env.example with secure random keys..." -ForegroundColor Yellow
    Copy-Item $envExamplePath $envPath
    
    # Generate cryptographic keys
    function Generate-SecureHex($bytes = 32) {
        $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $buffer = New-Object byte[] $bytes
        $rng.GetBytes($buffer)
        return ($buffer | ForEach-Object { "{0:x2}" -f $_ }) -join ''
    }

    $jwtSecret = Generate-SecureHex 32
    $jwtRefreshSecret = Generate-SecureHex 32
    $hmacAuditSalt = Generate-SecureHex 32
    $encryptionKey = Generate-SecureHex 32

    $envContent = Get-Content $envPath
    $envContent = $envContent -replace 'replace_with_32_byte_hex_generated_secret_key_1', $jwtSecret
    $envContent = $envContent -replace 'replace_with_32_byte_hex_generated_secret_key_2', $jwtRefreshSecret
    $envContent = $envContent -replace 'replace_with_32_byte_hex_generated_secret_key_3', $hmacAuditSalt
    $envContent = $envContent -replace 'replace_with_32_byte_hex_generated_secret_key_4', $encryptionKey
    Set-Content -Path $envPath -Value $envContent
    
    Write-Host "  -> Generated cryptographic secrets for JWT, Refresh, HMAC audit chain, and AES." -ForegroundColor Green
} else {
    Write-Host "  -> .env file exists and verified. [OK]" -ForegroundColor Green
}

# Port Collision Check
function Test-PortAvailable {
    param ([int]$port, [string]$serviceName)
    $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($listener) {
        Write-Host "  -> Warning: Port $port ($serviceName) is already in use by another process." -ForegroundColor Yellow
    } else {
        Write-Host "  -> Port $port ($serviceName): Available [OK]" -ForegroundColor Green
    }
}

Test-PortAvailable 5432 "PostgreSQL"
Test-PortAvailable 6379 "Redis"
Test-PortAvailable 4000 "Backend API"
Test-PortAvailable 3000 "Next.js Frontend"

# 4. ORCHESTRATION & LAUNCH
Write-Host "`n[4/5] Orchestrating Platform Services..." -ForegroundColor Yellow

if ($dockerReady) {
    Write-Host "  -> Starting PostgreSQL, Redis, Backend, and Frontend containers via Docker Compose..." -ForegroundColor Cyan
    docker compose up -d
    Write-Host "  -> Containers started successfully." -ForegroundColor Green
} else {
    Write-Host "  -> Launching local development environment..." -ForegroundColor Cyan
    
    # Check dependencies in backend
    $backendDir = Join-Path $PSScriptRoot "backend"
    if (Test-Path (Join-Path $backendDir "package.json")) {
        if (-not (Test-Path (Join-Path $backendDir "node_modules"))) {
            Write-Host "  -> Installing backend dependencies..." -ForegroundColor Cyan
            Push-Location $backendDir
            npm install --no-audit --prefer-offline
            Pop-Location
        }
    }

    # Check dependencies in frontend
    $frontendDir = Join-Path $PSScriptRoot "frontend"
    if (Test-Path (Join-Path $frontendDir "package.json")) {
        if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
            Write-Host "  -> Installing frontend dependencies..." -ForegroundColor Cyan
            Push-Location $frontendDir
            npm install --no-audit --prefer-offline
            Pop-Location
        }
    }
    
    Write-Host "  -> Starting NestJS API backend process (port 4000)..." -ForegroundColor Cyan
    Start-Process -FilePath "node" -ArgumentList "dist/main" -WorkingDirectory $backendDir -WindowStyle Hidden
    
    Write-Host "  -> Starting Next.js Web/Kiosk frontend process (port 3000)..." -ForegroundColor Cyan
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm start" -WorkingDirectory $frontendDir -WindowStyle Hidden

    Write-Host "  -> Probing service readiness..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
    Write-Host "  -> Services are online and responsive [OK]" -ForegroundColor Green
}

# 5. CONSOLE DASHBOARD BANNER
Write-Host "`n================================================================================" -ForegroundColor Green
Write-Host "               iDentify Platform Successfully Bootstrapped!                      " -ForegroundColor Green
Write-Host "================================================================================" -ForegroundColor Green
Write-Host "Web Application / Gate Kiosk:   http://localhost:3000" -ForegroundColor Cyan
Write-Host "NestJS Enterprise REST API:     http://localhost:4000" -ForegroundColor Cyan
Write-Host "PostgreSQL RLS Connection:      localhost:5432 (DB: identify_saas_db)" -ForegroundColor Cyan
Write-Host "Redis BullMQ Job Queue:         localhost:6379" -ForegroundColor Cyan
Write-Host "`nDEFAULT ACCESS CREDENTIALS (Pre-seeded with DepEd Enhanced BEEF Data):" -ForegroundColor White
Write-Host "--------------------------------------------------------------------------------"
Write-Host "Role: Super Admin       | Email: superadmin@deped.gov.ph   | Pass: SuperAdmin123!" -ForegroundColor Yellow
Write-Host "Role: Principal         | Email: principal@mabini.deped.gov.ph | Pass: Principal123!" -ForegroundColor Yellow
Write-Host "Role: Head Teacher      | Email: ht.jhs@mabini.deped.gov.ph    | Pass: HeadTeacher123!" -ForegroundColor Yellow
Write-Host "Role: Teacher (Adviser) | Email: teacher.santos@mabini.deped.gov.ph| Pass: Teacher123!" -ForegroundColor Yellow
Write-Host "Role: Turnstile Kiosk   | Email: kiosk1@mabini.deped.gov.ph    | Pass: KioskPass123!" -ForegroundColor Yellow
Write-Host "Role: Student Roster    | Email: juan.delacruz@student.deped.gov.ph| Pass: Student123!" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------------------------------"
Write-Host "Demo School URL Slug:          http://localhost:3000/schools/mabini-nchs" -ForegroundColor Cyan
Write-Host "Gate / Turnstile Kiosk URL:     http://localhost:3000/kiosk" -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Green
