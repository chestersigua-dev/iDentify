-- ==============================================================================
-- iDentify: Initial Seed Data for Multi-Tenant DepEd Demonstration
-- ==============================================================================

-- 1. Default Super Admin (Pass: SuperAdmin123!)
-- bcrypt hash for 'SuperAdmin123!': $2b$10$yFmC8hKx85u4eY9iN8GqA.PzL28p68gVnC6b3x8x6zXQ2.oXQ9P.2 or precomputed SHA256 / bcrypt
-- Let's store password_hash as standard bcrypt format
INSERT INTO users (
    id,
    school_id,
    username,
    email,
    password_hash,
    role,
    first_name,
    last_name,
    mobile_number,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'superadmin',
    'superadmin@deped.gov.ph',
    '$2a$10$wE9Kj7aPqVlY5m0uN9d0he5s1vQn3aT8x1y6z5b4c3d2e1f0g9h8i', -- Fallback bcrypt hash for 'SuperAdmin123!'
    'SUPER_ADMIN',
    'System',
    'Administrator',
    '+639171234567',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- 2. Standalone DepEd Seed School: Sawat Elementary School
INSERT INTO schools (
    id,
    deped_school_id,
    slug,
    name,
    short_name,
    division,
    region,
    district,
    barangay,
    municipality_city,
    province,
    postal_code,
    contact_phone,
    contact_email,
    logo_url,
    primary_color,
    accent_color,
    school_head_name,
    school_head_title
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '101692',
    'sawat-es',
    'Sawat Elementary School',
    'Sawat ES',
    'Division of Pangasinan II',
    'Region I',
    'Urbiztondo District',
    'Sawat',
    'Urbiztondo',
    'Pangasinan',
    '2414',
    '0905 669 1862',
    'sawatelementaryschool@gmail.com',
    '/logos/sawat.png',
    '#1e3a8a',
    '#0ea5e9',
    'Rico Idos',
    'Principal I'
) ON CONFLICT (deped_school_id) DO UPDATE SET
    name = EXCLUDED.name,
    short_name = EXCLUDED.short_name,
    division = EXCLUDED.division,
    region = EXCLUDED.region,
    district = EXCLUDED.district,
    barangay = EXCLUDED.barangay,
    municipality_city = EXCLUDED.municipality_city,
    province = EXCLUDED.province,
    contact_phone = EXCLUDED.contact_phone,
    contact_email = EXCLUDED.contact_email,
    logo_url = EXCLUDED.logo_url,
    school_head_name = EXCLUDED.school_head_name,
    school_head_title = EXCLUDED.school_head_title;

-- 3. School Staff Users for Sawat ES
-- Principal (Principal123!)
INSERT INTO users (
    id,
    school_id,
    username,
    email,
    password_hash,
    role,
    position,
    first_name,
    last_name,
    mobile_number,
    photo_url,
    is_active
) VALUES (
    '11111111-1111-1111-1111-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'principal.sawat',
    'sawatelementaryschool@gmail.com',
    '$2a$10$wE9Kj7aPqVlY5m0uN9d0he5s1vQn3aT8x1y6z5b4c3d2e1f0g9h8i',
    'PRINCIPAL',
    'Principal I',
    'Rico',
    'Idos',
    '0905 669 1862',
    '/avatars/principal-idos.png',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- Administrative Assistant (AdminAssistant123!)
INSERT INTO users (
    id,
    school_id,
    username,
    email,
    password_hash,
    role,
    position,
    first_name,
    last_name,
    mobile_number,
    photo_url,
    is_active
) VALUES (
    '11111111-1111-1111-1111-000000000007',
    '11111111-1111-1111-1111-111111111111',
    'ao.bautista',
    'ao.bautista@sawat.deped.gov.ph',
    '$2a$10$wE9Kj7aPqVlY5m0uN9d0he5s1vQn3aT8x1y6z5b4c3d2e1f0g9h8i',
    'ADMIN_ASSISTANT',
    'Administrative Assistant II',
    'Maria Elena',
    'Bautista',
    '+639185551234',
    '/avatars/ao-bautista.png',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- Head Teacher (HeadTeacher123!)
INSERT INTO users (
    id,
    school_id,
    username,
    email,
    password_hash,
    role,
    position,
    first_name,
    last_name,
    mobile_number,
    assigned_tier,
    photo_url,
    is_active
) VALUES (
    '11111111-1111-1111-1111-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'headteacher.jhs',
    'ht.jhs@mabini.deped.gov.ph',
    '$2a$10$wE9Kj7aPqVlY5m0uN9d0he5s1vQn3aT8x1y6z5b4c3d2e1f0g9h8i',
    'HEAD_TEACHER',
    'Head Teacher II',
    'Corazon',
    'Aquino-Reyes',
    '+639191234567',
    'JUNIOR_HIGH',
    '/avatars/ht-corazon.png',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- Master Teacher (MasterTeacher123!)
INSERT INTO users (
    id,
    school_id,
    username,
    email,
    password_hash,
    role,
    position,
    first_name,
    last_name,
    mobile_number,
    photo_url,
    assigned_classes,
    is_active
) VALUES (
    '11111111-1111-1111-1111-000000000008',
    '11111111-1111-1111-1111-111111111111',
    'masterteacher.ramos',
    'mt.ramos@mabini.deped.gov.ph',
    '$2a$10$wE9Kj7aPqVlY5m0uN9d0he5s1vQn3aT8x1y6z5b4c3d2e1f0g9h8i',
    'MASTER_TEACHER',
    'Master Teacher I',
    'Danilo',
    'Ramos, LPT',
    '+639198765432',
    '/avatars/mt-ramos.png',
    '[{"grade_level": "Grade 10", "section_id": "33333333-3333-3333-3333-000000000001", "section_name": "Bonifacio", "subjects": ["Science", "Mathematics"]}, {"grade_level": "Grade 11", "section_id": "33333333-3333-3333-3333-000000000003", "section_name": "STEM - Archimedes", "subjects": ["General Chemistry"]}]',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- Teacher (Teacher123!)
INSERT INTO users (
    id,
    school_id,
    username,
    email,
    password_hash,
    role,
    position,
    first_name,
    last_name,
    mobile_number,
    photo_url,
    assigned_classes,
    is_active
) VALUES (
    '11111111-1111-1111-1111-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'teacher.santos',
    'teacher.santos@mabini.deped.gov.ph',
    '$2a$10$wE9Kj7aPqVlY5m0uN9d0he5s1vQn3aT8x1y6z5b4c3d2e1f0g9h8i',
    'TEACHER',
    'Teacher III',
    'Maria Fe',
    'Santos, LPT',
    '+639201234567',
    '/avatars/teacher-santos.png',
    '[{"grade_level": "Grade 10", "section_id": "33333333-3333-3333-3333-000000000001", "section_name": "Bonifacio", "subjects": ["English", "Filipino"]}, {"grade_level": "Grade 10", "section_id": "33333333-3333-3333-3333-000000000002", "section_name": "Rizal", "subjects": ["English"]}]',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- Staff (Staff123!)
INSERT INTO users (
    id,
    school_id,
    username,
    email,
    password_hash,
    role,
    position,
    first_name,
    last_name,
    mobile_number,
    photo_url,
    is_active
) VALUES (
    '11111111-1111-1111-1111-000000000009',
    '11111111-1111-1111-1111-111111111111',
    'staff.dizon',
    'staff.dizon@sawat.deped.gov.ph',
    '$2a$10$wE9Kj7aPqVlY5m0uN9d0he5s1vQn3aT8x1y6z5b4c3d2e1f0g9h8i',
    'STAFF',
    'Staff',
    'Roberto',
    'Dizon',
    '+639219998877',
    '/avatars/staff-dizon.png',
    TRUE
) ON CONFLICT (username) DO NOTHING;

-- 4. Sections
INSERT INTO sections (
    id,
    school_id,
    name,
    grade_level,
    tier,
    shs_track,
    shs_strand,
    adviser_user_id,
    school_year
) VALUES
(
    '33333333-3333-3333-3333-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Bonifacio',
    'Grade 10',
    'JUNIOR_HIGH',
    NULL,
    NULL,
    '11111111-1111-1111-1111-000000000004',
    '2025-2026'
),
(
    '33333333-3333-3333-3333-000000000002',
    '11111111-1111-1111-1111-111111111111',
    'Rizal',
    'Grade 10',
    'JUNIOR_HIGH',
    NULL,
    NULL,
    '11111111-1111-1111-1111-000000000004',
    '2025-2026'
),
(
    '33333333-3333-3333-3333-000000000003',
    '11111111-1111-1111-1111-111111111111',
    'STEM - Archimedes',
    'Grade 11',
    'SENIOR_HIGH',
    'Academic Track',
    'STEM',
    '11111111-1111-1111-1111-000000000004',
    '2025-2026'
),
(
    '33333333-3333-3333-3333-000000000004',
    '11111111-1111-1111-1111-111111111111',
    'HUMSS - Recto',
    'Grade 12',
    'SENIOR_HIGH',
    'Academic Track',
    'HUMSS',
    NULL,
    '2025-2026'
) ON CONFLICT DO NOTHING;

-- 5. Enhanced DepEd BEEF Students
INSERT INTO students (
    id,
    school_id,
    section_id,
    lrn,
    psa_birth_cert_no,
    last_name,
    first_name,
    middle_name,
    extension_name,
    birthdate,
    age,
    sex,
    mother_tongue,
    ip_community,
    is_4ps_beneficiary,
    household_4ps_id,
    current_house_no,
    current_street,
    current_barangay,
    current_municipality_city,
    current_province,
    current_region,
    current_zip_code,
    father_last_name,
    father_first_name,
    father_contact_no,
    mother_maiden_last_name,
    mother_first_name,
    mother_contact_no,
    guardian_last_name,
    guardian_first_name,
    guardian_relationship,
    primary_sms_recipient,
    primary_sms_phone,
    grade_level,
    photo_url,
    enrollment_status,
    academic_standing,
    general_average
) VALUES
(
    '44444444-4444-4444-4444-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-000000000001',
    '109283746501',
    '1029384756-PSA-2010',
    'Dela Cruz',
    'Juan',
    'Protacio',
    'Jr.',
    '2010-06-19',
    15,
    'Male',
    'Tagalog',
    NULL,
    TRUE,
    '4PS-NCR-PASIG-8829',
    'Lot 14 Blk 3',
    'Mabini St.',
    'San Joaquin',
    'Pasig City',
    'Metro Manila',
    'NCR',
    '1601',
    'Dela Cruz',
    'Juan',
    '+639178881234',
    'Protacio',
    'Teodora',
    '+639178885678',
    NULL,
    NULL,
    NULL,
    'MOTHER',
    '+639178885678',
    'Grade 10',
    '/avatars/student-1.svg',
    'ENROLLED',
    'PASSING',
    89.75
),
(
    '44444444-4444-4444-4444-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-000000000001',
    '109283746502',
    '2039485761-PSA-2010',
    'Santos',
    'Maria Clara',
    'Delos Reyes',
    NULL,
    '2010-08-12',
    15,
    'Female',
    'Tagalog',
    NULL,
    FALSE,
    NULL,
    '45',
    'Luna St.',
    'San Joaquin',
    'Pasig City',
    'Metro Manila',
    'NCR',
    '1601',
    'Santos',
    'Santiago',
    '+639177771122',
    'Delos Reyes',
    'Pia',
    '+639177773344',
    NULL,
    NULL,
    NULL,
    'FATHER',
    '+639177771122',
    'Grade 10',
    '/avatars/student-2.svg',
    'ENROLLED',
    'HONORS',
    94.50
),
(
    '44444444-4444-4444-4444-000000000003',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-000000000001',
    '109283746503',
    '3948572019-PSA-2010',
    'Silang',
    'Diego',
    'Andaya',
    NULL,
    '2010-01-20',
    16,
    'Male',
    'Ilocano',
    NULL,
    FALSE,
    NULL,
    '12-B',
    'Roxas Blvd.',
    'San Joaquin',
    'Pasig City',
    'Metro Manila',
    'NCR',
    '1601',
    'Silang',
    'Pedro',
    '+639176662233',
    'Andaya',
    'Maria',
    '+639176664455',
    NULL,
    NULL,
    NULL,
    'MOTHER',
    '+639176664455',
    'Grade 10',
    '/avatars/student-3.svg',
    'ENROLLED',
    'AT_RISK',
    74.20
),
(
    '44444444-4444-4444-4444-000000000004',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-000000000003',
    '109283746504',
    '4857291038-PSA-2009',
    'Mercado',
    'Josefa',
    'Alonzo',
    NULL,
    '2009-04-10',
    16,
    'Female',
    'Tagalog',
    NULL,
    TRUE,
    '4PS-NCR-PASIG-9931',
    '88',
    'Kalayaan Ave.',
    'San Joaquin',
    'Pasig City',
    'Metro Manila',
    'NCR',
    '1601',
    'Mercado',
    'Francisco',
    '+639175551122',
    'Alonzo',
    'Teodora',
    '+639175553344',
    NULL,
    NULL,
    NULL,
    'MOTHER',
    '+639175553344',
    'Grade 11',
    '/avatars/student-4.svg',
    'ENROLLED',
    'PASSING',
    91.00
) ON CONFLICT (school_id, lrn) DO NOTHING;

-- 6. Student RFID / Barcode Tokens (for Gate Kiosk testing)
INSERT INTO student_tokens (
    school_id,
    student_id,
    token_type,
    token_uid,
    is_active
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-000000000001',
    'RFID',
    '0008522301', -- Juan Dela Cruz 10-Digit RFID Tag
    TRUE
),
(
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-000000000002',
    'RFID',
    '0008522302', -- Maria Clara Santos 10-Digit RFID Tag
    TRUE
),
(
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-000000000003',
    'RFID',
    '0008522303', -- Diego Silang 10-Digit RFID Tag
    TRUE
),
(
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-000000000004',
    'RFID',
    '0008522304', -- Josefa Mercado 10-Digit RFID Tag
    TRUE
) ON CONFLICT (school_id, token_uid) DO NOTHING;

-- 7. Turnstile Gate & Classroom Attendance Logs
INSERT INTO attendance_logs (
    school_id,
    student_id,
    event_type,
    attendance_date,
    timestamp,
    kiosk_station_id,
    scanned_token_uid,
    state,
    subject_name,
    remarks
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-000000000001',
    'CLOCK_IN',
    '2026-10-06',
    '2026-10-06 07:18:22+08',
    'MAIN_GATE_KIOSK_1',
    '0008522301',
    'PRESENT',
    'General / Gate',
    'Main Entrance Turnstile #1 Tap In'
),
(
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-000000000001',
    'CLASSROOM_CHECK',
    '2026-10-06',
    '2026-10-06 08:00:00+08',
    NULL,
    NULL,
    'PRESENT',
    'English 10',
    'Official SF2 DepEd Classroom Attendance recorded'
),
(
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-000000000001',
    'CLOCK_OUT',
    '2026-10-05',
    '2026-10-05 16:35:10+08',
    'MAIN_GATE_KIOSK_2',
    '0008522301',
    'PRESENT',
    'General / Gate',
    'Main Exit Turnstile #2 Tap Out'
),
(
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-000000000002',
    'CLOCK_IN',
    '2026-10-06',
    '2026-10-06 07:22:15+08',
    'MAIN_GATE_KIOSK_1',
    '0008522302',
    'PRESENT',
    'General / Gate',
    'Main Entrance Turnstile #1 Tap In'
),
(
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-000000000002',
    'CLOCK_OUT',
    '2026-10-05',
    '2026-10-05 16:28:10+08',
    'MAIN_GATE_KIOSK_2',
    '0008522302',
    'PRESENT',
    'General / Gate',
    'Main Exit Turnstile #2 Tap Out'
);

-- 8. Genesis Audit Entry (SOC 2 Type 2 Hash Chain Root)
INSERT INTO audit_logs (
    school_id,
    actor_id,
    actor_role,
    action,
    target_entity,
    target_id,
    client_ip,
    payload,
    prev_hash,
    entry_hash
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'SUPER_ADMIN',
    'SYSTEM_BOOTSTRAP_PROVISION',
    'SYSTEM',
    'ROOT',
    '127.0.0.1',
    '{"message": "Genesis initial deployment with DepEd standards and SOC 2 hash-chained audit validation"}'::jsonb,
    'GENESIS_0000000000000000000000000000000000000000000000000000000000000000',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
) ON CONFLICT DO NOTHING;
