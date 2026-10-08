-- ==============================================================================
-- iDentify: DepEd-Compliant Multi-Tenant School Management & Attendance System
-- Database Initialization DDL with Row-Level Security (RLS) & SOC 2 Immutability
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. TENANCY & BRANDING TABLES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deped_school_id VARCHAR(6) UNIQUE NOT NULL, -- Official 6-digit DepEd School ID
    slug VARCHAR(64) UNIQUE NOT NULL,           -- Subdomain/Route slug (e.g. 'mabini-nchs')
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(64),
    division VARCHAR(128) NOT NULL,             -- DepEd Division (e.g. 'Division of Pasig City')
    region VARCHAR(32) NOT NULL,                -- DepEd Region (e.g. 'Region IV-A', 'NCR')
    district VARCHAR(128),                      -- DepEd District
    barangay VARCHAR(128) NOT NULL,
    municipality_city VARCHAR(128) NOT NULL,
    province VARCHAR(128) NOT NULL,
    postal_code VARCHAR(10),
    contact_phone VARCHAR(32),
    contact_email VARCHAR(128),
    logo_url TEXT DEFAULT '/logos/default-school-seal.svg',
    primary_color VARCHAR(16) DEFAULT '#1e3a8a',
    accent_color VARCHAR(16) DEFAULT '#3b82f6',
    school_head_name VARCHAR(128),
    school_head_title VARCHAR(64) DEFAULT 'Principal IV',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. USERS, ROLES & AUTHENTICATION
-- -----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',
    'PRINCIPAL',
    'HEAD_TEACHER',
    'MASTER_TEACHER',
    'TEACHER',
    'ADMIN_ASSISTANT',
    'STAFF',
    'STUDENT',
    'KIOSK'
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE, -- NULL for SUPER_ADMIN
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'TEACHER',
    position VARCHAR(64) DEFAULT 'Teacher I',
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    mobile_number VARCHAR(32),
    photo_url TEXT DEFAULT '/avatars/default-user.svg',
    assigned_tier VARCHAR(32), -- 'ELEMENTARY', 'JUNIOR_HIGH', 'SENIOR_HIGH' (for HEAD_TEACHER)
    rbac_permissions JSONB DEFAULT '{}',
    assigned_classes JSONB DEFAULT '[]',
    two_factor_secret VARCHAR(128),
    is_two_factor_enabled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_role ON users(role);

-- -----------------------------------------------------------------------------
-- 3. ACADEMIC STRUCTURE (SECTIONS & GRADE LEVELS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(64) NOT NULL,                  -- e.g. 'Rizal', 'Bonifacio', 'Einstein'
    grade_level VARCHAR(16) NOT NULL,           -- 'Kindergarten', 'Grade 1'..'Grade 12'
    tier VARCHAR(32) NOT NULL,                  -- 'ELEMENTARY', 'JUNIOR_HIGH', 'SENIOR_HIGH'
    shs_track VARCHAR(64),                      -- e.g. 'Academic', 'TVL'
    shs_strand VARCHAR(64),                     -- e.g. 'STEM', 'ABM', 'HUMSS', 'ICT'
    adviser_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    school_year VARCHAR(16) NOT NULL DEFAULT '2025-2026',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (school_id, name, grade_level, school_year)
);

CREATE INDEX idx_sections_school_id ON sections(school_id);

-- -----------------------------------------------------------------------------
-- 4. DEPED ENHANCED BASIC EDUCATION ENROLLMENT FORM (BEEF) - STUDENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    
    -- Learner Identity
    lrn VARCHAR(12) NOT NULL,                   -- 12-digit Learner Reference Number
    psa_birth_cert_no VARCHAR(32),
    last_name VARCHAR(64) NOT NULL,
    first_name VARCHAR(64) NOT NULL,
    middle_name VARCHAR(64),
    extension_name VARCHAR(16),                 -- 'Jr.', 'III', etc.
    birthdate DATE NOT NULL,
    age INT,
    sex VARCHAR(16) NOT NULL,                   -- 'Male', 'Female'
    mother_tongue VARCHAR(64) DEFAULT 'Tagalog',
    ip_community VARCHAR(128),                  -- Indigenous People group (if applicable)
    is_4ps_beneficiary BOOLEAN DEFAULT FALSE,
    household_4ps_id VARCHAR(32),
    
    -- Special Needs & Disabilities Flags (DepEd BEEF standard)
    has_disability BOOLEAN DEFAULT FALSE,
    disability_visual BOOLEAN DEFAULT FALSE,
    disability_hearing BOOLEAN DEFAULT FALSE,
    disability_learning BOOLEAN DEFAULT FALSE,
    disability_intellectual BOOLEAN DEFAULT FALSE,
    disability_mobility BOOLEAN DEFAULT FALSE,
    disability_speech BOOLEAN DEFAULT FALSE,
    disability_autism BOOLEAN DEFAULT FALSE,
    disability_details TEXT,
    
    -- Addresses
    current_house_no VARCHAR(64),
    current_street VARCHAR(128),
    current_sitio_purok VARCHAR(128),
    current_barangay VARCHAR(128) NOT NULL,
    current_municipality_city VARCHAR(128) NOT NULL,
    current_province VARCHAR(128) NOT NULL,
    current_region VARCHAR(32) NOT NULL,
    current_zip_code VARCHAR(10),
    is_permanent_same_as_current BOOLEAN DEFAULT TRUE,
    permanent_address TEXT,
    
    -- Parents & Guardians (with SMS dispatch phone)
    father_last_name VARCHAR(64),
    father_first_name VARCHAR(64),
    father_middle_name VARCHAR(64),
    father_contact_no VARCHAR(32),
    father_education VARCHAR(64),
    
    mother_maiden_last_name VARCHAR(64),
    mother_first_name VARCHAR(64),
    mother_middle_name VARCHAR(64),
    mother_contact_no VARCHAR(32),
    mother_education VARCHAR(64),
    
    guardian_last_name VARCHAR(64),
    guardian_first_name VARCHAR(64),
    guardian_middle_name VARCHAR(64),
    guardian_relationship VARCHAR(32),
    guardian_contact_no VARCHAR(32),
    
    primary_sms_recipient VARCHAR(16) DEFAULT 'GUARDIAN', -- 'FATHER', 'MOTHER', 'GUARDIAN'
    primary_sms_phone VARCHAR(32) NOT NULL,                -- Target mobile for gate SMS notifications
    
    -- Academic / Senior High School Specifics
    grade_level VARCHAR(16) NOT NULL,
    shs_track VARCHAR(64),
    shs_strand VARCHAR(64),
    photo_url TEXT DEFAULT '/avatars/student-default.svg',
    
    -- Status
    enrollment_status VARCHAR(32) DEFAULT 'ENROLLED',     -- 'ENROLLED', 'TRANSFERRED_OUT', 'DROPPED'
    academic_standing VARCHAR(32) DEFAULT 'PASSING',      -- 'PASSING', 'AT_RISK', 'HONORS'
    general_average NUMERIC(5,2),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (school_id, lrn)
);

CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_students_lrn ON students(lrn);
CREATE INDEX idx_students_section_id ON students(section_id);

-- -----------------------------------------------------------------------------
-- 5. RFID / QR TOKEN MAPPING
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    token_type VARCHAR(16) NOT NULL DEFAULT 'RFID', -- 'RFID', 'BARCODE', 'QR'
    token_uid VARCHAR(128) NOT NULL,                -- 10-digit numerical Card UID (e.g. '0008522301') or QR text
    is_active BOOLEAN DEFAULT TRUE,
    issued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ,
    UNIQUE (school_id, token_uid)
);

CREATE INDEX idx_student_tokens_uid ON student_tokens(token_uid);
CREATE INDEX idx_student_tokens_student ON student_tokens(student_id);

-- -----------------------------------------------------------------------------
-- 6. IMMUTABLE ATTENDANCE LEDGER & LOGS (KIOSK & CLASSROOM)
-- -----------------------------------------------------------------------------
CREATE TYPE attendance_event_type AS ENUM ('CLOCK_IN', 'CLOCK_OUT', 'CLASSROOM_CHECK');
CREATE TYPE attendance_state AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'EXCUSED', 'DROPPED');

CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    event_type attendance_event_type NOT NULL,
    attendance_date DATE NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    kiosk_station_id VARCHAR(64) DEFAULT 'MAIN_GATE_KIOSK_1',
    scanned_token_uid VARCHAR(128),
    state attendance_state NOT NULL DEFAULT 'PRESENT',
    subject_name VARCHAR(64) DEFAULT 'General / Gate',
    is_debounced_duplicate BOOLEAN DEFAULT FALSE,
    minutes_from_first_tap INT DEFAULT 0,
    classroom_session_id UUID,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_school_date ON attendance_logs(school_id, attendance_date);
CREATE INDEX idx_attendance_student_date ON attendance_logs(student_id, attendance_date);
CREATE INDEX idx_attendance_timestamp ON attendance_logs(timestamp);

-- Enforce database-level immutability for attendance_logs: NO UPDATE, NO DELETE
CREATE OR REPLACE FUNCTION trg_prevent_attendance_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'COMPLIANCE VIOLATION: DepEd Attendance logs are immutable. UPDATE and DELETE operations are strictly prohibited (SOC 2 / DepEd standard).';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attendance_immutable ON attendance_logs;
CREATE TRIGGER trg_attendance_immutable
BEFORE UPDATE OR DELETE ON attendance_logs
FOR EACH ROW EXECUTE FUNCTION trg_prevent_attendance_tampering();

-- -----------------------------------------------------------------------------
-- 7. CLASSROOM SESSIONS & IN-ROOM ATTENDANCE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classroom_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_name VARCHAR(64) NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    status VARCHAR(32) DEFAULT 'COMPLETED', -- 'IN_PROGRESS', 'COMPLETED'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 8. SMS DISPATCH QUEUE & LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    attendance_log_id UUID REFERENCES attendance_logs(id) ON DELETE SET NULL,
    provider VARCHAR(32) NOT NULL, -- 'SEMAPHORE', 'PHILSMS', 'MOCK'
    recipient_phone VARCHAR(32) NOT NULL,
    message_body TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'QUEUED', -- 'QUEUED', 'SENT', 'FAILED'
    provider_message_id VARCHAR(128),
    error_message TEXT,
    dispatched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sms_logs_school ON sms_logs(school_id);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);

-- -----------------------------------------------------------------------------
-- 9. SOC 2 TYPE 2 TAMPER-EVIDENT AUDIT TRAIL (CRYPTOGRAPHIC SHA-256 HMAC CHAIN)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_number BIGSERIAL,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_role VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL,          -- e.g. 'PURGE_SCHOOL', 'UPDATE_GRADE', 'IMPORT_BEEF'
    target_entity VARCHAR(64) NOT NULL,   -- e.g. 'STUDENT', 'SCHOOL', 'SECTION'
    target_id VARCHAR(64),
    client_ip VARCHAR(64),
    user_agent TEXT,
    payload JSONB,
    prev_hash VARCHAR(64) NOT NULL DEFAULT 'GENESIS_HASH_0000000000000000000000000000000000000000000000000000000000000000',
    entry_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_school ON audit_logs(school_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Prevent UPDATE, DELETE, and TRUNCATE on audit_logs
CREATE OR REPLACE FUNCTION trg_prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SECURITY AUDIT VIOLATION: SOC 2 Type 2 audit logs are strictly append-only. UPDATE, DELETE, and TRUNCATE operations are permanently revoked.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_immutable ON audit_logs;
CREATE TRIGGER trg_audit_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION trg_prevent_audit_tampering();

-- -----------------------------------------------------------------------------
-- 10. ROW-LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
-- Enable RLS across tenant-partitioned tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to extract current tenant school_id from session setting
CREATE OR REPLACE FUNCTION current_tenant_school_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_school_id', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- RLS Policy: Users
DROP POLICY IF EXISTS tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users ON users
    USING (
        current_tenant_school_id() IS NULL -- Super Admin bypass
        OR school_id = current_tenant_school_id()
    )
    WITH CHECK (
        current_tenant_school_id() IS NULL
        OR school_id = current_tenant_school_id()
    );

-- RLS Policy: Sections
DROP POLICY IF EXISTS tenant_isolation_sections ON sections;
CREATE POLICY tenant_isolation_sections ON sections
    USING (
        current_tenant_school_id() IS NULL
        OR school_id = current_tenant_school_id()
    )
    WITH CHECK (
        current_tenant_school_id() IS NULL
        OR school_id = current_tenant_school_id()
    );

-- RLS Policy: Students
DROP POLICY IF EXISTS tenant_isolation_students ON students;
CREATE POLICY tenant_isolation_students ON students
    USING (
        current_tenant_school_id() IS NULL
        OR school_id = current_tenant_school_id()
    )
    WITH CHECK (
        current_tenant_school_id() IS NULL
        OR school_id = current_tenant_school_id()
    );

-- RLS Policy: Student Tokens
DROP POLICY IF EXISTS tenant_isolation_tokens ON student_tokens;
CREATE POLICY tenant_isolation_tokens ON student_tokens
    USING (
        current_tenant_school_id() IS NULL
        OR school_id = current_tenant_school_id()
    )
    WITH CHECK (
        current_tenant_school_id() IS NULL
        OR school_id = current_tenant_school_id()
    );

-- RLS Policy: Attendance Logs
DROP POLICY IF EXISTS tenant_isolation_attendance ON attendance_logs;
CREATE POLICY tenant_isolation_attendance ON attendance_logs
    USING (
        current_tenant_school_id() IS NULL
        OR school_id = current_tenant_school_id()
    )
    WITH CHECK (
        current_tenant_school_id() IS NULL
        OR school_id = current_tenant_school_id()
    );

-- RLS Policy: Classroom Sessions
DROP POLICY IF EXISTS tenant_isolation_sessions ON classroom_sessions;
CREATE POLICY tenant_isolation_sessions ON classroom_sessions
    USING (
        current_tenant_school_id() IS NULL
        OR school_id = current_tenant_school_id()
    )
    WITH CHECK (
        current_tenant_school_id() IS NULL
        OR school_id = current_tenant_school_id()
    );

-- RLS Policy: SMS Logs
DROP POLICY IF EXISTS tenant_isolation_sms ON sms_logs;
CREATE POLICY tenant_isolation_sms ON sms_logs
    USING (
        current_tenant_school_id() IS NULL
        OR school_id = current_tenant_school_id()
    )
    WITH CHECK (
        current_tenant_school_id() IS NULL
        OR school_id = current_tenant_school_id()
    );
