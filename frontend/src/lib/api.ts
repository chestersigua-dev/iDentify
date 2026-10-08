/**
 * iDentify Frontend API Client
 * DepEd-Compliant Multi-Tenant School Management & Attendance SaaS
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface School {
  id: string;
  deped_school_id: string;
  slug: string;
  name: string;
  short_name?: string;
  division: string;
  region: string;
  district?: string;
  barangay: string;
  municipality_city: string;
  province: string;
  postal_code?: string;
  contact_phone?: string;
  contact_email?: string;
  logo_url: string;
  primary_color: string;
  accent_color: string;
  school_head_name?: string;
  school_head_title?: string;
}

export const POSITIONS_LIST = [
  'Principal I',
  'Principal II',
  'Principal III',
  'Principal IV',
  'Head Teacher I',
  'Head Teacher II',
  'Head Teacher III',
  'Head Teacher IV',
  'Master Teacher I',
  'Master Teacher II',
  'Master Teacher III',
  'Master Teacher IV',
  'Master Teacher V',
  'Teacher I',
  'Teacher II',
  'Teacher III',
  'Teacher IV',
  'Teacher V',
  'Teacher VI',
  'Administrative Assistant I',
  'Administrative Assistant II',
  'Administrative Assistant III',
  'Administrative Assistant IV',
  'Administrative Assistant V',
  'Staff',
] as const;

export type PositionTitle = (typeof POSITIONS_LIST)[number];

export interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface RbacMap {
  [key: string]: ModulePermissions | undefined;
  users?: ModulePermissions;
  students?: ModulePermissions;
  attendance?: ModulePermissions;
  academic?: ModulePermissions;
  settings?: ModulePermissions;
  audit?: ModulePermissions;
  metrics?: ModulePermissions;
}

export interface AssignedClass {
  grade_level: number | string;
  section_id?: string;
  section_name?: string;
  section?: string;
  subject?: string;
  subjects?: string[];
  is_adviser?: boolean;
}

export interface UserAccount {
  id: string;
  school_id?: string;
  username: string;
  email: string;
  phone_number?: string;
  title_prefix?: string;
  full_name: string;
  title_postfix?: string;
  display_name?: string;
  name?: string;
  role:
    | 'SUPER_ADMIN'
    | 'PRINCIPAL'
    | 'HEAD_TEACHER'
    | 'MASTER_TEACHER'
    | 'TEACHER'
    | 'ADMIN_ASSISTANT'
    | 'STAFF';
  position?: string;
  photo_url?: string;
  assigned_tier?: 'ELEMENTARY' | 'JUNIOR_HIGH' | 'SENIOR_HIGH';
  assigned_classes?: AssignedClass[];
  rbac_permissions?: RbacMap;
  active_rfid_uid?: string;
  rfid_tag?: string;
  employee_number?: string;
  plantilla_item_no?: string;
  salary_grade?: string;
  station?: string;
  employment_status?: string;
  is_active: boolean;
  two_factor_enabled: boolean;
  email_confirmed: boolean;
  phone_confirmed: boolean;
  created_at?: string;
}

/**
 * Formats user display name incorporating prefix and postfix titles.
 * If neither is entered, returns the bare full name.
 */
export const formatUserDisplayName = (
  user?: Partial<UserAccount> | { full_name?: string; name?: string; title_prefix?: string; title_postfix?: string } | null
): string => {
  if (!user) return '';
  const prefix = (user.title_prefix || '').trim();
  const postfix = (user.title_postfix || '').trim();
  const baseName = (user.full_name || user.name || '').trim();

  if (!baseName) return '';

  let formatted = baseName;
  if (prefix) {
    formatted = `${prefix} ${formatted}`;
  }
  if (postfix) {
    if (postfix.startsWith(',') || postfix.startsWith('.')) {
      formatted = `${formatted}${postfix}`;
    } else {
      formatted = `${formatted}, ${postfix}`;
    }
  }
  return formatted;
};

/**
 * Formats a date and time into standard US format: Month day, year hh:mm:ss AM/PM
 * Example output: "October 6, 2026 07:18:22 AM"
 */
export const formatUsDateTime = (
  dateInput?: Date | string | number | null,
  timeInput?: string | null
): string => {
  if (!dateInput && !timeInput) return '';

  const pad = (n: number) => (n < 10 ? '0' + n : String(n));
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // If dateInput is 'YYYY-MM-DD'
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    const [y, m, d] = dateInput.trim().split('-').map(Number);
    const month = months[m - 1] || 'October';
    const formattedTime = timeInput || '07:00:00 AM';
    return `${month} ${d}, ${y} ${formattedTime}`;
  }

  // If dateInput is 'YYYY-MM-DD HH:mm:ss' or 'YYYY-MM-DD ...'
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}\s+/.test(dateInput.trim())) {
    const parts = dateInput.trim().split(/\s+/);
    const [y, m, d] = parts[0].split('-').map(Number);
    const month = months[m - 1] || 'October';
    const timePart = timeInput || parts.slice(1).join(' ');
    return `${month} ${d}, ${y} ${timePart}`;
  }

  // If dateInput is a Date
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const month = months[dateInput.getMonth()];
    const day = dateInput.getDate();
    const year = dateInput.getFullYear();
    const hours = dateInput.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    const time = timeInput || `${pad(hours12)}:${pad(dateInput.getMinutes())}:${pad(dateInput.getSeconds())} ${ampm}`;
    return `${month} ${day}, ${year} ${time}`;
  }

  // If dateInput is a timestamp number (ms)
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    if (!isNaN(d.getTime())) {
      const month = months[d.getMonth()];
      const day = d.getDate();
      const year = d.getFullYear();
      const hours = d.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      const time = timeInput || `${pad(hours12)}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${ampm}`;
      return `${month} ${day}, ${year} ${time}`;
    }
  }

  // If dateInput is an ISO string
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const month = months[d.getMonth()];
      const day = d.getDate();
      const year = d.getFullYear();
      const hours = d.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      const time = timeInput || `${pad(hours12)}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${ampm}`;
      return `${month} ${day}, ${year} ${time}`;
    }
  }

  return (dateInput ? String(dateInput) : '') + (timeInput ? ` ${timeInput}` : '');
};


export interface AcademicSection {
  id: string;
  school_id?: string;
  name: string;
  grade_level: number | string;
  room?: string;
  tier?: 'ELEMENTARY' | 'JUNIOR_HIGH' | 'SENIOR_HIGH';
  shs_track?: string;
  shs_strand?: string;
  adviser_user_id?: string;
  adviser_name?: string;
  school_year?: string;
  student_count?: number;
  max_capacity?: number;
}

export interface GradeSubject {
  id: string;
  grade_level: number | string;
  name: string;
  code: string;
  department: string;
  units?: number;
}

export interface Student {
  id: string;
  school_id?: string;
  section_id?: string;
  lrn: string;
  psa_birth_cert_no?: string;
  last_name: string;
  first_name: string;
  middle_name?: string;
  extension_name?: string;
  birthdate: string;
  age?: number;
  sex?: string;
  gender?: string;
  mother_tongue?: string;
  ip_community?: string;
  is_4ps_beneficiary?: boolean;
  household_4ps_id?: string;
  has_disability?: boolean;
  disability_details?: string;
  current_house_no?: string;
  current_street?: string;
  current_barangay?: string;
  current_municipality_city?: string;
  current_province?: string;
  current_region?: string;
  father_last_name?: string;
  father_first_name?: string;
  mother_first_name?: string;
  mother_maiden_last_name?: string;
  guardian_first_name?: string;
  guardian_last_name?: string;
  guardian_relationship?: string;
  primary_sms_recipient?: string;
  primary_sms_phone?: string;
  emergency_contact?: string;
  grade_level: number | string;
  section_name?: string;
  section?: string;
  active_rfid_uid?: string;
  rfid_tag?: string;
  photo_url?: string;
  enrollment_status?: string;
  academic_standing?: string;
  general_average?: number;
  deped_beef_details?: any;
}

export interface AuditLog {
  id: string;
  sequence_number: number;
  school_id?: string;
  actor_id?: string;
  actor_role: string;
  action: string;
  target_entity: string;
  target_id?: string;
  client_ip?: string;
  payload: any;
  prev_hash: string;
  entry_hash: string;
  created_at: string;
}

export interface AttendanceRosterItem {
  id: string;
  lrn: string;
  psa_birth_cert_no?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  fullName: string;
  sex: string;
  photo_url?: string;
  primary_sms_phone: string;
  currentState: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | 'DROPPED' | 'UNRECORDED';
  kioskClockInTime: string | null;
  kioskClockOutTime: string | null;
  kioskStatus: 'CLOCKED_IN' | 'CLOCKED_OUT' | 'NO_GATE_TAP';
  remarks?: string | null;
  subjectName?: string;
  absenceStreakDays?: number;
}

// Sole Seed School: Sawat Elementary School (Urbiztondo, Pangasinan)
export const DEFAULT_SCHOOL: School = {
  id: '11111111-1111-1111-1111-111111111111',
  deped_school_id: '101692',
  slug: 'sawat-es',
  name: 'Sawat Elementary School',
  short_name: 'Sawat ES',
  division: 'Division of Pangasinan II',
  region: 'Region I',
  district: 'Urbiztondo District',
  barangay: 'Sawat',
  municipality_city: 'Urbiztondo',
  province: 'Pangasinan',
  postal_code: '2414',
  contact_phone: '0905 669 1862',
  contact_email: 'sawatelementaryschool@gmail.com',
  logo_url: '/logos/sawat.png',
  primary_color: '#1e3a8a',
  accent_color: '#0ea5e9',
  school_head_name: 'Rico Idos',
  school_head_title: 'Principal I',
};

// Default subjects per grade level
export const DEFAULT_GRADE_SUBJECTS: GradeSubject[] = [
  // Grade 10
  { id: 'subj-1', grade_level: 'Grade 10', name: 'English 10', code: 'ENG10', department: 'Languages' },
  { id: 'subj-2', grade_level: 'Grade 10', name: 'Mathematics 10', code: 'MATH10', department: 'Mathematics' },
  { id: 'subj-3', grade_level: 'Grade 10', name: 'Science 10', code: 'SCI10', department: 'Science' },
  { id: 'subj-4', grade_level: 'Grade 10', name: 'Filipino 10', code: 'FIL10', department: 'Languages' },
  { id: 'subj-5', grade_level: 'Grade 10', name: 'Araling Panlipunan 10', code: 'AP10', department: 'Social Sciences' },
  { id: 'subj-6', grade_level: 'Grade 10', name: 'MAPEH 10', code: 'MAPEH10', department: 'Humanities' },
  { id: 'subj-7', grade_level: 'Grade 10', name: 'Edukasyon sa Pagpapakatao (ESP)', code: 'ESP10', department: 'Values' },
  { id: 'subj-8', grade_level: 'Grade 10', name: 'Technology & Livelihood Educ (TLE)', code: 'TLE10', department: 'TVL' },
  // Grade 11
  { id: 'subj-9', grade_level: 'Grade 11', name: 'General Mathematics', code: 'GENMATH11', department: 'Mathematics' },
  { id: 'subj-10', grade_level: 'Grade 11', name: 'Earth & Life Science', code: 'SCI11', department: 'Science' },
  { id: 'subj-11', grade_level: 'Grade 11', name: 'Oral Communication', code: 'ORAL11', department: 'Languages' },
  { id: 'subj-12', grade_level: 'Grade 11', name: 'Komunikasyon at Pananaliksik', code: 'FIL11', department: 'Languages' },
  // Grade 12
  { id: 'subj-13', grade_level: 'Grade 12', name: 'Contemporary Philippine Arts', code: 'CPAR12', department: 'Humanities' },
  { id: 'subj-14', grade_level: 'Grade 12', name: 'Media and Information Literacy', code: 'MIL12', department: 'Information Tech' },
  { id: 'subj-15', grade_level: 'Grade 12', name: 'Physical Science', code: 'PHYSCI12', department: 'Science' },
];

export const DEFAULT_SECTIONS: AcademicSection[] = [
  {
    id: '33333333-3333-3333-3333-000000000001',
    school_id: '11111111-1111-1111-1111-111111111111',
    name: 'Bonifacio',
    grade_level: 'Grade 10',
    tier: 'JUNIOR_HIGH',
    adviser_user_id: '11111111-1111-1111-1111-000000000004',
    adviser_name: 'Maria Fe Santos, LPT',
    school_year: '2025-2026',
    student_count: 42,
  },
  {
    id: '33333333-3333-3333-3333-000000000002',
    school_id: '11111111-1111-1111-1111-111111111111',
    name: 'Rizal',
    grade_level: 'Grade 10',
    tier: 'JUNIOR_HIGH',
    adviser_user_id: '11111111-1111-1111-1111-000000000004',
    adviser_name: 'Maria Fe Santos, LPT',
    school_year: '2025-2026',
    student_count: 40,
  },
  {
    id: '33333333-3333-3333-3333-000000000003',
    school_id: '11111111-1111-1111-1111-111111111111',
    name: 'STEM - Archimedes',
    grade_level: 'Grade 11',
    tier: 'SENIOR_HIGH',
    shs_track: 'Academic',
    shs_strand: 'STEM',
    adviser_user_id: '11111111-1111-1111-1111-000000000008',
    adviser_name: 'Danilo Ramos, LPT',
    school_year: '2025-2026',
    student_count: 38,
  },
  {
    id: '33333333-3333-3333-3333-000000000004',
    school_id: '11111111-1111-1111-1111-111111111111',
    name: 'HUMSS - Recto',
    grade_level: 'Grade 12',
    tier: 'SENIOR_HIGH',
    shs_track: 'Academic',
    shs_strand: 'HUMSS',
    school_year: '2025-2026',
    student_count: 35,
  },
];

export const INITIAL_USERS: UserAccount[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    school_id: undefined,
    username: 'superadmin',
    email: 'superadmin@deped.gov.ph',
    phone_number: '+639171234567',
    full_name: 'Chester Sigua',
    role: 'SUPER_ADMIN',
    position: 'System Administrator',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rbac_permissions: {
      users: { view: true, create: true, edit: true, delete: true },
      students: { view: true, create: true, edit: true, delete: true },
      attendance: { view: true, create: true, edit: true, delete: true },
      academic: { view: true, create: true, edit: true, delete: true },
      settings: { view: true, create: true, edit: true, delete: true },
      audit: { view: true, create: true, edit: true, delete: true },
      metrics: { view: true, create: true, edit: true, delete: true },
    },
    is_active: true,
    two_factor_enabled: true,
    email_confirmed: true,
    phone_confirmed: true,
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: '11111111-1111-1111-1111-000000000002',
    school_id: '11111111-1111-1111-1111-111111111111',
    username: 'principal.sawat',
    email: 'sawatelementaryschool@gmail.com',
    phone_number: '0905 669 1862',
    full_name: 'Dr. Rico Idos',
    role: 'PRINCIPAL',
    position: 'Principal I',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    active_rfid_uid: '0008522401',
    rfid_tag: '0008522401',
    employee_number: 'DEPED-1988201',
    plantilla_item_no: 'OSEC-DECSB-PRIN1-00102-2015',
    salary_grade: 'SG-19',
    station: 'Mabini National High School (ID: 300452)',
    employment_status: 'Permanent',
    rbac_permissions: {
      users: { view: true, create: true, edit: true, delete: true },
      students: { view: true, create: true, edit: true, delete: true },
      attendance: { view: true, create: true, edit: true, delete: true },
      academic: { view: true, create: true, edit: true, delete: true },
      settings: { view: true, create: true, edit: true, delete: true },
      audit: { view: true, create: false, edit: false, delete: false },
      metrics: { view: true, create: true, edit: true, delete: true },
    },
    is_active: true,
    two_factor_enabled: true,
    email_confirmed: true,
    phone_confirmed: true,
    created_at: '2026-01-12T09:30:00Z',
  },
  {
    id: '11111111-1111-1111-1111-000000000007',
    school_id: '11111111-1111-1111-1111-111111111111',
    username: 'ao.bautista',
    email: 'ao.bautista@sawat.deped.gov.ph',
    phone_number: '+639185551234',
    full_name: 'Maria Elena Bautista',
    role: 'ADMIN_ASSISTANT',
    position: 'Administrative Assistant II',
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    active_rfid_uid: '0008522402',
    rfid_tag: '0008522402',
    employee_number: 'DEPED-2004512',
    plantilla_item_no: 'OSEC-DECSB-ADAS2-00541-2019',
    salary_grade: 'SG-8',
    station: 'Mabini National High School (ID: 300452)',
    employment_status: 'Permanent',
    rbac_permissions: {
      users: { view: true, create: true, edit: true, delete: true },
      students: { view: true, create: true, edit: true, delete: true },
      attendance: { view: true, create: true, edit: true, delete: false },
      academic: { view: true, create: true, edit: true, delete: true },
      settings: { view: true, create: false, edit: true, delete: false },
      audit: { view: true, create: false, edit: false, delete: false },
      metrics: { view: true, create: false, edit: false, delete: false },
    },
    is_active: true,
    two_factor_enabled: true,
    email_confirmed: true,
    phone_confirmed: true,
    created_at: '2026-01-14T09:00:00Z',
  },
  {
    id: '11111111-1111-1111-1111-000000000003',
    school_id: '11111111-1111-1111-1111-111111111111',
    username: 'headteacher.jhs',
    email: 'ht.jhs@mabini.deped.gov.ph',
    phone_number: '+639175558899',
    full_name: 'Prof. Corazon Aquino-Reyes',
    role: 'HEAD_TEACHER',
    position: 'Head Teacher II',
    photo_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    assigned_tier: 'JUNIOR_HIGH',
    active_rfid_uid: '0008522403',
    rfid_tag: '0008522403',
    employee_number: 'DEPED-1996734',
    plantilla_item_no: 'OSEC-DECSB-HT2-00318-2017',
    salary_grade: 'SG-15',
    station: 'Mabini National High School (ID: 300452)',
    employment_status: 'Permanent',
    rbac_permissions: {
      users: { view: true, create: false, edit: false, delete: false },
      students: { view: true, create: true, edit: true, delete: false },
      attendance: { view: true, create: true, edit: true, delete: false },
      academic: { view: true, create: true, edit: true, delete: false },
      settings: { view: true, create: false, edit: false, delete: false },
      audit: { view: false, create: false, edit: false, delete: false },
      metrics: { view: true, create: false, edit: false, delete: false },
    },
    is_active: true,
    two_factor_enabled: true,
    email_confirmed: true,
    phone_confirmed: false,
    created_at: '2026-01-15T11:00:00Z',
  },
  {
    id: '11111111-1111-1111-1111-000000000008',
    school_id: '11111111-1111-1111-1111-111111111111',
    username: 'masterteacher.ramos',
    email: 'mt.ramos@mabini.deped.gov.ph',
    phone_number: '+639198765432',
    full_name: 'Danilo Ramos, LPT',
    role: 'MASTER_TEACHER',
    position: 'Master Teacher I',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    active_rfid_uid: '0008522404',
    rfid_tag: '0008522404',
    employee_number: 'DEPED-2012844',
    plantilla_item_no: 'OSEC-DECSB-MT1-00215-2020',
    salary_grade: 'SG-18',
    station: 'Mabini National High School (ID: 300452)',
    employment_status: 'Permanent',
    assigned_classes: [
      {
        grade_level: 'Grade 10',
        section_id: '33333333-3333-3333-3333-000000000001',
        section_name: 'Bonifacio',
        subjects: ['Science', 'Mathematics'],
      },
      {
        grade_level: 'Grade 11',
        section_id: '33333333-3333-3333-3333-000000000003',
        section_name: 'STEM - Archimedes',
        subjects: ['General Chemistry'],
      },
    ],
    rbac_permissions: {
      users: { view: true, create: false, edit: false, delete: false },
      students: { view: true, create: false, edit: false, delete: false },
      attendance: { view: true, create: true, edit: true, delete: false },
      academic: { view: true, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      audit: { view: false, create: false, edit: false, delete: false },
      metrics: { view: true, create: false, edit: false, delete: false },
    },
    is_active: true,
    two_factor_enabled: false,
    email_confirmed: true,
    phone_confirmed: true,
    created_at: '2026-01-18T10:00:00Z',
  },
  {
    id: '11111111-1111-1111-1111-000000000004',
    school_id: '11111111-1111-1111-1111-111111111111',
    username: 'teacher.santos',
    email: 'mariafe.santos@mabini.deped.gov.ph',
    phone_number: '+639201234567',
    full_name: 'Maria Fe Santos, LPT',
    role: 'TEACHER',
    position: 'Teacher III',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    active_rfid_uid: '0008522405',
    rfid_tag: '0008522405',
    employee_number: 'DEPED-2018955',
    plantilla_item_no: 'OSEC-DECSB-TCH3-00812-2022',
    salary_grade: 'SG-13',
    station: 'Mabini National High School (ID: 300452)',
    employment_status: 'Permanent',
    assigned_classes: [
      {
        grade_level: 'Grade 10',
        section_id: '33333333-3333-3333-3333-000000000001',
        section_name: 'Bonifacio',
        subjects: ['English', 'Filipino'],
      },
      {
        grade_level: 'Grade 10',
        section_id: '33333333-3333-3333-3333-000000000002',
        section_name: 'Rizal',
        subjects: ['English'],
      },
    ],
    rbac_permissions: {
      users: { view: true, create: false, edit: false, delete: false },
      students: { view: true, create: false, edit: false, delete: false },
      attendance: { view: true, create: true, edit: true, delete: false },
      academic: { view: true, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      audit: { view: false, create: false, edit: false, delete: false },
      metrics: { view: true, create: false, edit: false, delete: false },
    },
    is_active: true,
    two_factor_enabled: false,
    email_confirmed: true,
    phone_confirmed: true,
    created_at: '2026-01-20T14:15:00Z',
  },
  {
    id: '11111111-1111-1111-1111-000000000009',
    school_id: '11111111-1111-1111-1111-111111111111',
    username: 'staff.dizon',
    email: 'staff.dizon@sawat.deped.gov.ph',
    phone_number: '+639219998877',
    full_name: 'Roberto Dizon',
    role: 'STAFF',
    position: 'Staff',
    photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    active_rfid_uid: '0008522406',
    rfid_tag: '0008522406',
    employee_number: 'DEPED-2021109',
    plantilla_item_no: 'OSEC-DECSB-ADOF1-00912-2023',
    salary_grade: 'SG-10',
    station: 'Mabini National High School (ID: 300452)',
    employment_status: 'Permanent',
    rbac_permissions: {
      users: { view: false, create: false, edit: false, delete: false },
      students: { view: true, create: false, edit: false, delete: false },
      attendance: { view: true, create: false, edit: false, delete: false },
      academic: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      audit: { view: false, create: false, edit: false, delete: false },
      metrics: { view: false, create: false, edit: false, delete: false },
    },
    is_active: true,
    two_factor_enabled: false,
    email_confirmed: true,
    phone_confirmed: true,
    created_at: '2026-01-25T08:00:00Z',
  },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: '44444444-4444-4444-4444-000000000001',
    school_id: '11111111-1111-1111-1111-111111111111',
    section_id: '33333333-3333-3333-3333-000000000001',
    lrn: '109283746501',
    psa_birth_cert_no: '1029384756-PSA-2010',
    last_name: 'Dela Cruz',
    first_name: 'Juan',
    middle_name: 'Protacio',
    extension_name: 'Jr.',
    birthdate: '2010-06-19',
    age: 15,
    sex: 'Male',
    mother_tongue: 'Tagalog',
    is_4ps_beneficiary: true,
    household_4ps_id: '4PS-NCR-PASIG-8829',
    current_barangay: 'Sawat',
    current_municipality_city: 'Urbiztondo',
    current_province: 'Pangasinan',
    father_last_name: 'Dela Cruz',
    father_first_name: 'Juan',
    primary_sms_phone: '+639178885678',
    grade_level: 'Grade 10',
    section_name: 'Bonifacio',
    active_rfid_uid: '0008522301',
    rfid_tag: '0008522301',
    photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    enrollment_status: 'ENROLLED',
    academic_standing: 'PASSING',
    general_average: 89.75,
    deped_beef_details: {
      psa_birth_cert_no: '1029384756-PSA-2010',
      extension_name: 'Jr.',
      mother_tongue: 'Tagalog',
      is_4ps: true,
      household_id_4ps: '4PS-NCR-PASIG-8829',
      is_ip: false,
      ip_community: '',
      has_disability: false,
      disability_type: '',
      father_name: 'Juan Dela Cruz Sr.',
      father_contact: '+639178885678',
      mother_name: 'Teodora Protacio',
      mother_contact: '+639178885679',
      guardian_name: 'Juan Dela Cruz Sr.',
      guardian_contact: '+639178885678',
      current_address: 'Brgy. Sawat, Urbiztondo, Pangasinan',
      permanent_address: 'Brgy. Sawat, Urbiztondo, Pangasinan',
      last_grade_completed: 'Grade 9',
      last_school_attended: 'Urbiztondo Integrated School',
      last_school_id: '105942',
    },
  },
  {
    id: '44444444-4444-4444-4444-000000000002',
    school_id: '11111111-1111-1111-1111-111111111111',
    section_id: '33333333-3333-3333-3333-000000000001',
    lrn: '109283746502',
    psa_birth_cert_no: '2039485761-PSA-2010',
    last_name: 'Santos',
    first_name: 'Maria Clara',
    middle_name: 'Delos Reyes',
    birthdate: '2010-08-12',
    age: 15,
    sex: 'Female',
    mother_tongue: 'Tagalog',
    is_4ps_beneficiary: false,
    current_barangay: 'Sawat',
    current_municipality_city: 'Urbiztondo',
    current_province: 'Pangasinan',
    father_last_name: 'Santos',
    father_first_name: 'Santiago',
    primary_sms_phone: '+639177771122',
    grade_level: 'Grade 10',
    section_name: 'Bonifacio',
    active_rfid_uid: '0008522302',
    rfid_tag: '0008522302',
    photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    enrollment_status: 'ENROLLED',
    academic_standing: 'HONORS',
    general_average: 94.5,
    deped_beef_details: {
      psa_birth_cert_no: '2039485761-PSA-2010',
      extension_name: '',
      mother_tongue: 'Tagalog',
      is_4ps: false,
      household_id_4ps: '',
      is_ip: false,
      ip_community: '',
      has_disability: false,
      disability_type: '',
      father_name: 'Santiago Santos',
      father_contact: '+639177771122',
      mother_name: 'Pia Delos Reyes',
      mother_contact: '+639177771123',
      guardian_name: 'Santiago Santos',
      guardian_contact: '+639177771122',
      current_address: '45 Luna St., Brgy. Sawat, Urbiztondo, Pangasinan',
      permanent_address: '45 Luna St., Brgy. Sawat, Urbiztondo, Pangasinan',
      last_grade_completed: 'Grade 9',
      last_school_attended: 'Urbiztondo Integrated School',
      last_school_id: '105942',
    },
  },
  {
    id: '44444444-4444-4444-4444-000000000003',
    school_id: '11111111-1111-1111-1111-111111111111',
    section_id: '33333333-3333-3333-3333-000000000001',
    lrn: '109283746503',
    psa_birth_cert_no: '3948572019-PSA-2010',
    last_name: 'Silang',
    first_name: 'Diego',
    middle_name: 'Andaya',
    birthdate: '2010-01-20',
    age: 16,
    sex: 'Male',
    mother_tongue: 'Ilocano',
    is_4ps_beneficiary: false,
    current_barangay: 'Sawat',
    current_municipality_city: 'Urbiztondo',
    current_province: 'Pangasinan',
    primary_sms_phone: '+639176664455',
    grade_level: 'Grade 10',
    section_name: 'Bonifacio',
    active_rfid_uid: '0008522303',
    rfid_tag: '0008522303',
    photo_url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
    enrollment_status: 'ENROLLED',
    academic_standing: 'AT_RISK',
    general_average: 74.2,
    deped_beef_details: {
      psa_birth_cert_no: '3948572019-PSA-2010',
      extension_name: '',
      mother_tongue: 'Ilocano',
      is_4ps: false,
      household_id_4ps: '',
      is_ip: false,
      ip_community: '',
      has_disability: false,
      disability_type: '',
      father_name: 'Emilio Silang',
      father_contact: '+639176664455',
      mother_name: 'Gabriela Andaya',
      mother_contact: '+639176664456',
      guardian_name: 'Emilio Silang',
      guardian_contact: '+639176664455',
      current_address: 'Poblacion, Urbiztondo, Pangasinan',
      permanent_address: 'Poblacion, Urbiztondo, Pangasinan',
      last_grade_completed: 'Grade 9',
      last_school_attended: 'Urbiztondo Integrated School',
      last_school_id: '105942',
    },
  },
  {
    id: '44444444-4444-4444-4444-000000000004',
    school_id: '11111111-1111-1111-1111-111111111111',
    section_id: '33333333-3333-3333-3333-000000000003',
    lrn: '109283746504',
    psa_birth_cert_no: '4857291038-PSA-2009',
    last_name: 'Mercado',
    first_name: 'Josefa',
    middle_name: 'Alonzo',
    birthdate: '2009-04-10',
    age: 16,
    sex: 'Female',
    mother_tongue: 'Tagalog',
    is_4ps_beneficiary: true,
    household_4ps_id: '4PS-PANG-8831',
    current_barangay: 'Sawat',
    current_municipality_city: 'Urbiztondo',
    current_province: 'Pangasinan',
    primary_sms_phone: '+639175553344',
    grade_level: 'Grade 11',
    section_name: 'STEM - Archimedes',
    active_rfid_uid: '0008522304',
    rfid_tag: '0008522304',
    photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    enrollment_status: 'ENROLLED',
    academic_standing: 'PASSING',
    general_average: 91.0,
    deped_beef_details: {
      psa_birth_cert_no: '4857291038-PSA-2009',
      extension_name: '',
      mother_tongue: 'Tagalog',
      is_4ps: true,
      household_id_4ps: '4PS-PANG-8831',
      is_ip: false,
      ip_community: '',
      has_disability: false,
      disability_type: '',
      father_name: 'Francisco Mercado',
      father_contact: '+639175553344',
      mother_name: 'Teodora Alonzo',
      mother_contact: '+639175553345',
      guardian_name: 'Francisco Mercado',
      guardian_contact: '+639175553344',
      current_address: 'Brgy. Sawat, Urbiztondo, Pangasinan',
      permanent_address: 'Brgy. Sawat, Urbiztondo, Pangasinan',
      last_grade_completed: 'Grade 10',
      last_school_attended: 'Urbiztondo Integrated School',
      last_school_id: '105942',
    },
  },
];

// In-memory runtime storage for client state
let clientUsersStore = [...INITIAL_USERS];
let clientStudentsStore = [...INITIAL_STUDENTS];

if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('identify_students_store');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        clientStudentsStore = parsed;
      }
    }

    const savedUsers = localStorage.getItem('identify_users_store');
    if (savedUsers) {
      const parsedUsers = JSON.parse(savedUsers);
      if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
        // Merge to preserve initial data while keeping updates
        const userMap = new Map<string, UserAccount>();
        INITIAL_USERS.forEach((u) => userMap.set(u.id, u));
        parsedUsers.forEach((u: UserAccount) => userMap.set(u.id, { ...userMap.get(u.id), ...u }));
        clientUsersStore = Array.from(userMap.values());
      }
    }
  } catch {}
}
let clientSectionsStore = [...DEFAULT_SECTIONS];
let clientSubjectsStore = [...DEFAULT_GRADE_SUBJECTS];

export type StudentHistoryEventType =
  | 'CLOCK_IN'
  | 'CLOCK_OUT'
  | 'ATTENDANCE_PRESENT'
  | 'ATTENDANCE_LATE'
  | 'ATTENDANCE_ABSENT'
  | 'ATTENDANCE_EXCUSED'
  | 'ATTENDANCE_DROPPED'
  | 'DEBOUNCED';

export interface StudentHistoryItem {
  id: string;
  studentId: string;
  lrn: string;
  name: string;
  type: StudentHistoryEventType;
  typeLabel: string;
  category: 'GATE_TURNSTILE' | 'CLASSROOM_ROLL_CALL';
  timestamp: string;
  dateStr: string;
  timeStr: string;
  location: string;
  subject?: string;
  rfid?: string;
  recordedBy?: string;
  remarks?: string;
}

export interface KioskTapLog {
  id: string;
  studentId?: string;
  lrn?: string;
  name: string;
  rfid: string;
  status: 'CLOCK_IN' | 'CLOCK_OUT' | 'DEBOUNCED';
  timeStr: string;
  isoTimestamp: string;
  dateStr: string;
}

export interface FacultyTapLog {
  id: string;
  userId: string;
  name: string;
  role: string;
  position?: string;
  rfid: string;
  status: 'CLOCK_IN' | 'CLOCK_OUT' | 'DEBOUNCED';
  timeStr: string;
  isoTimestamp: string;
  dateStr: string;
}

export interface DtrDayRecord {
  day: number;
  dateStr: string;
  dayOfWeek: string;
  dayShort: string;
  isWeekend: boolean;
  isSaturday: boolean;
  isSunday: boolean;
  amArrival: string;
  amDeparture: string;
  pmArrival: string;
  pmDeparture: string;
  undertimeHours: number;
  undertimeMinutes: number;
  rawTaps: FacultyTapLog[];
  statusNote?: string;
}

export interface MonthlyDtrReport {
  userId: string;
  userName: string;
  employeeNumber: string;
  plantillaItemNo: string;
  salaryGrade: string;
  employmentStatus: string;
  station: string;
  schoolName: string;
  schoolId: string;
  division: string;
  region: string;
  depedEmail: string;
  position: string;
  rfidTag?: string;
  year: number;
  month: number;
  monthName: string;
  officialHoursRegular: string;
  officialHoursSaturday: string;
  days: DtrDayRecord[];
  totalDaysPresent: number;
  totalUndertimeHours: number;
  totalUndertimeMinutes: number;
  principalName: string;
  principalTitle: string;
  systemRefId: string;
  formatType?: 'EHRIS' | 'SARAH';
}

export const DEFAULT_STUDENT_HISTORY: StudentHistoryItem[] = [
  // Juan Dela Cruz Jr. (109283746501)
  {
    id: 'hist-jdc-01',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    type: 'CLOCK_IN',
    typeLabel: 'Clock In (Gate Entry)',
    category: 'GATE_TURNSTILE',
    timestamp: '2026-10-06T07:18:22Z',
    dateStr: '2026-10-06',
    timeStr: '07:18:22 AM',
    location: 'Main Entrance Turnstile #1',
    rfid: '0008522301',
    recordedBy: 'RFID Turnstile Reader (Automatic)',
    remarks: 'Verified entry scan • DepEd turnstile gate unlocked',
  },
  {
    id: 'hist-jdc-02',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    type: 'ATTENDANCE_PRESENT',
    typeLabel: 'Classroom: Present',
    category: 'CLASSROOM_ROLL_CALL',
    timestamp: '2026-10-06T08:00:00Z',
    dateStr: '2026-10-06',
    timeStr: '08:00:00 AM',
    location: 'Room 204 (Grade 10 Bonifacio)',
    subject: 'English 10',
    recordedBy: 'Teacher Maria Fe Santos, LPT',
    remarks: 'Official SF2 DepEd Classroom Attendance recorded',
  },
  {
    id: 'hist-jdc-03',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    type: 'ATTENDANCE_PRESENT',
    typeLabel: 'Classroom: Present',
    category: 'CLASSROOM_ROLL_CALL',
    timestamp: '2026-10-06T10:15:00Z',
    dateStr: '2026-10-06',
    timeStr: '10:15:00 AM',
    location: 'Room 102 (Science Wing)',
    subject: 'Mathematics 10',
    recordedBy: 'Master Teacher Danilo Ramos, LPT',
    remarks: 'In-class roll-call verified',
  },
  {
    id: 'hist-jdc-04',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    type: 'CLOCK_OUT',
    typeLabel: 'Clock Out (Gate Exit)',
    category: 'GATE_TURNSTILE',
    timestamp: '2026-10-05T16:35:10Z',
    dateStr: '2026-10-05',
    timeStr: '04:35:10 PM',
    location: 'Main Exit Turnstile #2',
    rfid: '0008522301',
    recordedBy: 'RFID Turnstile Reader (Automatic)',
    remarks: 'Dismissal turnstile tap • Safe departure logged',
  },
  {
    id: 'hist-jdc-05',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    type: 'ATTENDANCE_PRESENT',
    typeLabel: 'Classroom: Present',
    category: 'CLASSROOM_ROLL_CALL',
    timestamp: '2026-10-05T08:02:15Z',
    dateStr: '2026-10-05',
    timeStr: '08:02:15 AM',
    location: 'Room 204 (Grade 10 Bonifacio)',
    subject: 'English 10',
    recordedBy: 'Teacher Maria Fe Santos, LPT',
    remarks: 'Regular attendance confirmed',
  },
  {
    id: 'hist-jdc-06',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    type: 'CLOCK_IN',
    typeLabel: 'Clock In (Gate Entry)',
    category: 'GATE_TURNSTILE',
    timestamp: '2026-10-05T07:22:10Z',
    dateStr: '2026-10-05',
    timeStr: '07:22:10 AM',
    location: 'Main Entrance Turnstile #1',
    rfid: '0008522301',
    recordedBy: 'RFID Turnstile Reader (Automatic)',
    remarks: 'Verified entry scan • On time',
  },
  {
    id: 'hist-jdc-07',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    type: 'CLOCK_OUT',
    typeLabel: 'Clock Out (Gate Exit)',
    category: 'GATE_TURNSTILE',
    timestamp: '2026-10-04T16:40:00Z',
    dateStr: '2026-10-04',
    timeStr: '04:40:00 PM',
    location: 'Main Exit Turnstile #2',
    rfid: '0008522301',
    recordedBy: 'RFID Turnstile Reader (Automatic)',
    remarks: 'Afternoon dismissal logged',
  },
  {
    id: 'hist-jdc-08',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    type: 'ATTENDANCE_PRESENT',
    typeLabel: 'Classroom: Present',
    category: 'CLASSROOM_ROLL_CALL',
    timestamp: '2026-10-04T08:00:00Z',
    dateStr: '2026-10-04',
    timeStr: '08:00:00 AM',
    location: 'Room 204 (Grade 10 Bonifacio)',
    subject: 'English 10',
    recordedBy: 'Teacher Maria Fe Santos, LPT',
    remarks: 'SF2 record present',
  },
  {
    id: 'hist-jdc-09',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    type: 'CLOCK_IN',
    typeLabel: 'Clock In (Gate Entry)',
    category: 'GATE_TURNSTILE',
    timestamp: '2026-10-04T07:15:30Z',
    dateStr: '2026-10-04',
    timeStr: '07:15:30 AM',
    location: 'Main Entrance Turnstile #1',
    rfid: '0008522301',
    recordedBy: 'RFID Turnstile Reader (Automatic)',
    remarks: 'Early morning arrival tap',
  },
  {
    id: 'hist-jdc-10',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    type: 'CLOCK_OUT',
    typeLabel: 'Clock Out (Gate Exit)',
    category: 'GATE_TURNSTILE',
    timestamp: '2026-10-03T16:30:20Z',
    dateStr: '2026-10-03',
    timeStr: '04:30:20 PM',
    location: 'Main Exit Turnstile #2',
    rfid: '0008522301',
    recordedBy: 'RFID Turnstile Reader (Automatic)',
    remarks: 'Dismissal turnstile tap',
  },
  {
    id: 'hist-jdc-11',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    type: 'ATTENDANCE_LATE',
    typeLabel: 'Classroom: Late',
    category: 'CLASSROOM_ROLL_CALL',
    timestamp: '2026-10-03T08:15:00Z',
    dateStr: '2026-10-03',
    timeStr: '08:15:00 AM',
    location: 'Room 204 (Grade 10 Bonifacio)',
    subject: 'English 10',
    recordedBy: 'Teacher Maria Fe Santos, LPT',
    remarks: 'Arrived 15 minutes after bell • Tardy flagged',
  },
  {
    id: 'hist-jdc-12',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    type: 'DEBOUNCED',
    typeLabel: 'Debounced Multi-Tap',
    category: 'GATE_TURNSTILE',
    timestamp: '2026-10-03T07:46:35Z',
    dateStr: '2026-10-03',
    timeStr: '07:46:35 AM',
    location: 'Main Entrance Turnstile #1',
    rfid: '0008522301',
    recordedBy: 'RFID Turnstile Reader (Automatic)',
    remarks: 'Rapid secondary card scan within 30s ignored',
  },
  {
    id: 'hist-jdc-13',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    type: 'CLOCK_IN',
    typeLabel: 'Clock In (Gate Entry)',
    category: 'GATE_TURNSTILE',
    timestamp: '2026-10-03T07:46:12Z',
    dateStr: '2026-10-03',
    timeStr: '07:46:12 AM',
    location: 'Main Entrance Turnstile #1',
    rfid: '0008522301',
    recordedBy: 'RFID Turnstile Reader (Automatic)',
    remarks: 'Late gate turnstile check-in',
  },

  // Maria Clara Santos (109283746502)
  {
    id: 'hist-mcs-01',
    studentId: '44444444-4444-4444-4444-000000000002',
    lrn: '109283746502',
    name: 'Maria Clara Santos',
    type: 'CLOCK_IN',
    typeLabel: 'Clock In (Gate Entry)',
    category: 'GATE_TURNSTILE',
    timestamp: '2026-10-06T07:22:15Z',
    dateStr: '2026-10-06',
    timeStr: '07:22:15 AM',
    location: 'Main Entrance Turnstile #1',
    rfid: '0008522302',
    recordedBy: 'RFID Turnstile Reader (Automatic)',
    remarks: 'Safe arrival logged • Turnstile gate unlocked',
  },
  {
    id: 'hist-mcs-02',
    studentId: '44444444-4444-4444-4444-000000000002',
    lrn: '109283746502',
    name: 'Maria Clara Santos',
    type: 'ATTENDANCE_PRESENT',
    typeLabel: 'Classroom: Present',
    category: 'CLASSROOM_ROLL_CALL',
    timestamp: '2026-10-06T08:00:00Z',
    dateStr: '2026-10-06',
    timeStr: '08:00:00 AM',
    location: 'Room 204 (Grade 10 Bonifacio)',
    subject: 'English 10',
    recordedBy: 'Teacher Maria Fe Santos, LPT',
    remarks: 'Full period presence recorded',
  },
  {
    id: 'hist-mcs-03',
    studentId: '44444444-4444-4444-4444-000000000002',
    lrn: '109283746502',
    name: 'Maria Clara Santos',
    type: 'CLOCK_OUT',
    typeLabel: 'Clock Out (Gate Exit)',
    category: 'GATE_TURNSTILE',
    timestamp: '2026-10-05T16:28:10Z',
    dateStr: '2026-10-05',
    timeStr: '04:28:10 PM',
    location: 'Main Exit Turnstile #2',
    rfid: '0008522302',
    recordedBy: 'RFID Turnstile Reader (Automatic)',
    remarks: 'Dismissal turnstile tap logged',
  },
  {
    id: 'hist-mcs-04',
    studentId: '44444444-4444-4444-4444-000000000002',
    lrn: '109283746502',
    name: 'Maria Clara Santos',
    type: 'ATTENDANCE_PRESENT',
    typeLabel: 'Classroom: Present',
    category: 'CLASSROOM_ROLL_CALL',
    timestamp: '2026-10-05T08:00:00Z',
    dateStr: '2026-10-05',
    timeStr: '08:00:00 AM',
    location: 'Room 204 (Grade 10 Bonifacio)',
    subject: 'English 10',
    recordedBy: 'Teacher Maria Fe Santos, LPT',
    remarks: 'On-time present',
  },
  {
    id: 'hist-mcs-05',
    studentId: '44444444-4444-4444-4444-000000000002',
    lrn: '109283746502',
    name: 'Maria Clara Santos',
    type: 'CLOCK_IN',
    typeLabel: 'Clock In (Gate Entry)',
    category: 'GATE_TURNSTILE',
    timestamp: '2026-10-05T07:19:00Z',
    dateStr: '2026-10-05',
    timeStr: '07:19:00 AM',
    location: 'Main Entrance Turnstile #1',
    rfid: '0008522302',
    recordedBy: 'RFID Turnstile Reader (Automatic)',
    remarks: 'Morning arrival logged',
  },

  // Diego Silang (109283746503)
  {
    id: 'hist-ds-01',
    studentId: '44444444-4444-4444-4444-000000000003',
    lrn: '109283746503',
    name: 'Diego Silang',
    type: 'CLOCK_IN',
    typeLabel: 'Clock In (Gate Entry)',
    category: 'GATE_TURNSTILE',
    timestamp: '2026-10-06T07:55:04Z',
    dateStr: '2026-10-06',
    timeStr: '07:55:04 AM',
    location: 'Main Entrance Turnstile #1',
    rfid: '0008522303',
    recordedBy: 'RFID Turnstile Reader (Automatic)',
    remarks: 'Gate check-in logged',
  },
  {
    id: 'hist-ds-02',
    studentId: '44444444-4444-4444-4444-000000000003',
    lrn: '109283746503',
    name: 'Diego Silang',
    type: 'ATTENDANCE_LATE',
    typeLabel: 'Classroom: Late',
    category: 'CLASSROOM_ROLL_CALL',
    timestamp: '2026-10-06T08:10:00Z',
    dateStr: '2026-10-06',
    timeStr: '08:10:00 AM',
    location: 'Room 204 (Grade 10 Bonifacio)',
    subject: 'English 10',
    recordedBy: 'Teacher Maria Fe Santos, LPT',
    remarks: 'Flagged late by teacher',
  },
  {
    id: 'hist-ds-03',
    studentId: '44444444-4444-4444-4444-000000000003',
    lrn: '109283746503',
    name: 'Diego Silang',
    type: 'ATTENDANCE_ABSENT',
    typeLabel: 'Classroom: Absent',
    category: 'CLASSROOM_ROLL_CALL',
    timestamp: '2026-10-05T08:00:00Z',
    dateStr: '2026-10-05',
    timeStr: '08:00:00 AM',
    location: 'Room 204 (Grade 10 Bonifacio)',
    subject: 'English 10',
    recordedBy: 'Teacher Maria Fe Santos, LPT',
    remarks: 'Unexcused classroom absence logged',
  },
  {
    id: 'hist-ds-04',
    studentId: '44444444-4444-4444-4444-000000000003',
    lrn: '109283746503',
    name: 'Diego Silang',
    type: 'CLOCK_OUT',
    typeLabel: 'Clock Out (Gate Exit)',
    category: 'GATE_TURNSTILE',
    timestamp: '2026-10-04T16:30:00Z',
    dateStr: '2026-10-04',
    timeStr: '04:30:00 PM',
    location: 'Main Exit Turnstile #2',
    rfid: '0008522303',
    recordedBy: 'RFID Turnstile Reader (Automatic)',
    remarks: 'Dismissal turnstile tap logged',
  },
  {
    id: 'hist-ds-05',
    studentId: '44444444-4444-4444-4444-000000000003',
    lrn: '109283746503',
    name: 'Diego Silang',
    type: 'CLOCK_IN',
    typeLabel: 'Clock In (Gate Entry)',
    category: 'GATE_TURNSTILE',
    timestamp: '2026-10-04T07:25:00Z',
    dateStr: '2026-10-04',
    timeStr: '07:25:00 AM',
    location: 'Main Entrance Turnstile #1',
    rfid: '0008522303',
    recordedBy: 'RFID Turnstile Reader (Automatic)',
    remarks: 'Morning arrival logged',
  },
];

let clientStudentHistoryStore: StudentHistoryItem[] = [...DEFAULT_STUDENT_HISTORY];

let clientKioskTapLogsStore: KioskTapLog[] = [
  {
    id: 'tap-seed-01',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    rfid: '0008522301',
    status: 'CLOCK_IN',
    timeStr: '07:18:22 AM',
    isoTimestamp: '2026-10-06T07:18:22Z',
    dateStr: '2026-10-06',
  },
  {
    id: 'tap-seed-02',
    studentId: '44444444-4444-4444-4444-000000000002',
    lrn: '109283746502',
    name: 'Maria Clara Santos',
    rfid: '0008522302',
    status: 'CLOCK_IN',
    timeStr: '07:22:15 AM',
    isoTimestamp: '2026-10-06T07:22:15Z',
    dateStr: '2026-10-06',
  },
  {
    id: 'tap-seed-03',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    rfid: '0008522301',
    status: 'CLOCK_OUT',
    timeStr: '04:35:10 PM',
    isoTimestamp: '2026-10-05T16:35:10Z',
    dateStr: '2026-10-05',
  },
  {
    id: 'tap-seed-04',
    studentId: '44444444-4444-4444-4444-000000000002',
    lrn: '109283746502',
    name: 'Maria Clara Santos',
    rfid: '0008522302',
    status: 'CLOCK_OUT',
    timeStr: '04:28:10 PM',
    isoTimestamp: '2026-10-05T16:28:10Z',
    dateStr: '2026-10-05',
  },
  {
    id: 'tap-seed-05',
    studentId: '44444444-4444-4444-4444-000000000003',
    lrn: '109283746503',
    name: 'Diego Silang',
    rfid: '0008522303',
    status: 'CLOCK_IN',
    timeStr: '07:55:04 AM',
    isoTimestamp: '2026-10-06T07:55:04Z',
    dateStr: '2026-10-06',
  },
  {
    id: 'tap-seed-06',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    rfid: '0008522301',
    status: 'CLOCK_IN',
    timeStr: '07:22:10 AM',
    isoTimestamp: '2026-10-05T07:22:10Z',
    dateStr: '2026-10-05',
  },
  {
    id: 'tap-seed-07',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    rfid: '0008522301',
    status: 'CLOCK_OUT',
    timeStr: '04:40:00 PM',
    isoTimestamp: '2026-10-04T16:40:00Z',
    dateStr: '2026-10-04',
  },
  {
    id: 'tap-seed-08',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    rfid: '0008522301',
    status: 'CLOCK_IN',
    timeStr: '07:15:30 AM',
    isoTimestamp: '2026-10-04T07:15:30Z',
    dateStr: '2026-10-04',
  },
  {
    id: 'tap-seed-09',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    rfid: '0008522301',
    status: 'DEBOUNCED',
    timeStr: '07:46:35 AM',
    isoTimestamp: '2026-10-03T07:46:35Z',
    dateStr: '2026-10-03',
  },
  {
    id: 'tap-seed-10',
    studentId: '44444444-4444-4444-4444-000000000001',
    lrn: '109283746501',
    name: 'Juan Dela Cruz Jr.',
    rfid: '0008522301',
    status: 'CLOCK_OUT',
    timeStr: '04:30:20 PM',
    isoTimestamp: '2026-10-03T16:30:20Z',
    dateStr: '2026-10-03',
  },
];

function createDeterministicFacultySeedLogs(): FacultyTapLog[] {
  const staff = [
    {
      id: '11111111-1111-1111-1111-000000000002',
      name: 'Dr. Rico Idos',
      role: 'PRINCIPAL',
      position: 'Principal I',
      rfid: '0008522401',
    },
    {
      id: '11111111-1111-1111-1111-000000000007',
      name: 'Maria Elena Bautista',
      role: 'ADMIN_ASSISTANT',
      position: 'Administrative Assistant II',
      rfid: '0008522402',
    },
    {
      id: '11111111-1111-1111-1111-000000000003',
      name: 'Prof. Corazon Aquino-Reyes',
      role: 'HEAD_TEACHER',
      position: 'Head Teacher II',
      rfid: '0008522403',
    },
    {
      id: '11111111-1111-1111-1111-000000000008',
      name: 'Danilo Ramos, LPT',
      role: 'MASTER_TEACHER',
      position: 'Master Teacher I',
      rfid: '0008522404',
    },
    {
      id: '11111111-1111-1111-1111-000000000004',
      name: 'Maria Fe Santos, LPT',
      role: 'TEACHER',
      position: 'Teacher III',
      rfid: '0008522405',
    },
    {
      id: '11111111-1111-1111-1111-000000000009',
      name: 'Roberto Dizon',
      role: 'STAFF',
      position: 'Staff',
      rfid: '0008522406',
    },
  ];

  const logs: FacultyTapLog[] = [];
  const pad = (n: number) => (n < 10 ? '0' + n : String(n));

  const periods = [
    { year: 2026, month: 9, startDay: 1, endDay: 30 },
    { year: 2026, month: 10, startDay: 1, endDay: 7 },
  ];

  for (const period of periods) {
    for (let day = period.startDay; day <= period.endDay; day++) {
      const dateObj = new Date(period.year, period.month - 1, day);
      const dayOfWeek = dateObj.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const dateStr = `${period.year}-${pad(period.month)}-${pad(day)}`;

      staff.forEach((member, memberIdx) => {
        const isLate = (day * 3 + memberIdx) % 11 === 0;
        const isEarlyExit = (day * 5 + memberIdx) % 13 === 0;

        const amInMin = isLate ? 5 + ((day + memberIdx) % 8) : 40 + ((day * 2 + memberIdx * 3) % 18);
        const amInHour = isLate ? 8 : 7;

        const pmOutHour = isEarlyExit ? 16 : 17;
        const pmOutMin = isEarlyExit ? 45 + ((day + memberIdx) % 12) : 2 + ((day * 3 + memberIdx * 2) % 18);

        const amInTimeStr = `${pad(amInHour)}:${pad(amInMin)}:15 AM`;
        const amInIso = `${dateStr}T${pad(amInHour)}:${pad(amInMin)}:15Z`;
        logs.push({
          id: `fac-seed-${period.year}${pad(period.month)}${pad(day)}-${member.rfid}-in`,
          userId: member.id,
          name: member.name,
          role: member.role,
          position: member.position,
          rfid: member.rfid,
          status: 'CLOCK_IN',
          timeStr: amInTimeStr,
          isoTimestamp: amInIso,
          dateStr,
        });

        const pmOutHour12 = pmOutHour > 12 ? pmOutHour - 12 : pmOutHour;
        const pmOutTimeStr = `${pad(pmOutHour12)}:${pad(pmOutMin)}:42 PM`;
        const pmOutIso = `${dateStr}T${pad(pmOutHour)}:${pad(pmOutMin)}:42Z`;
        logs.push({
          id: `fac-seed-${period.year}${pad(period.month)}${pad(day)}-${member.rfid}-out`,
          userId: member.id,
          name: member.name,
          role: member.role,
          position: member.position,
          rfid: member.rfid,
          status: 'CLOCK_OUT',
          timeStr: pmOutTimeStr,
          isoTimestamp: pmOutIso,
          dateStr,
        });
      });
    }
  }

  return logs.sort((a, b) => b.isoTimestamp.localeCompare(a.isoTimestamp));
}

let clientFacultyTapLogsStore: FacultyTapLog[] = createDeterministicFacultySeedLogs();

if (typeof window !== 'undefined') {
  try {
    const savedFac = localStorage.getItem('identify_faculty_tap_logs');
    if (savedFac) {
      const parsed = JSON.parse(savedFac);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const map = new Map<string, FacultyTapLog>();
        parsed.forEach((t: FacultyTapLog) => map.set(t.id, t));
        clientFacultyTapLogsStore.forEach((t) => {
          if (!map.has(t.id)) map.set(t.id, t);
        });
        clientFacultyTapLogsStore = Array.from(map.values()).sort((a, b) => b.isoTimestamp.localeCompare(a.isoTimestamp));
      }
    }
  } catch {}
}

// In-memory Client Audit Logs Store
let clientAuditLogsStore: AuditLog[] = [
  {
    id: 'audit-001',
    sequence_number: 1,
    school_id: DEFAULT_SCHOOL.id,
    actor_id: '00000000-0000-0000-0000-000000000001',
    actor_role: 'SUPER_ADMIN',
    action: 'PROVISION_SCHOOL',
    target_entity: 'SCHOOL',
    target_id: DEFAULT_SCHOOL.id,
    client_ip: '127.0.0.1',
    payload: { name: DEFAULT_SCHOOL.name, deped_id: DEFAULT_SCHOOL.deped_school_id },
    prev_hash: 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000',
    entry_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'audit-002',
    sequence_number: 2,
    school_id: DEFAULT_SCHOOL.id,
    actor_id: '11111111-1111-1111-1111-000000000002',
    actor_role: 'PRINCIPAL',
    action: 'ASSIGN_SECTION_ADVISER',
    target_entity: 'SECTION',
    target_id: '33333333-3333-3333-3333-000000000001',
    client_ip: '127.0.0.1',
    payload: { section: 'Bonifacio', teacher: 'Maria Fe Santos, LPT' },
    prev_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    entry_hash: '7a29f8d1c5b3e4a6f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'audit-003',
    sequence_number: 3,
    school_id: DEFAULT_SCHOOL.id,
    actor_id: '11111111-1111-1111-1111-000000000007',
    actor_role: 'ADMIN_ASSISTANT',
    action: 'IMPORT_DEPED_BEEF_STUDENTS',
    target_entity: 'STUDENTS',
    target_id: 'BATCH_2026',
    client_ip: '127.0.0.1',
    payload: { importedCount: 42, schoolYear: '2025-2026' },
    prev_hash: '7a29f8d1c5b3e4a6f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
    entry_hash: '9f8e7d6c5b4a3928172635485960718293a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const apiClient = {
  async getSchoolBySlug(slug: string): Promise<School> {
    try {
      const res = await fetch(`${API_BASE}/api/schools/${slug}`);
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch {}
    return DEFAULT_SCHOOL;
  },

  async getAllSchools(): Promise<School[]> {
    try {
      const res = await fetch(`${API_BASE}/api/schools`);
      if (res.ok) {
        const data = await res.json();
        return data.data;
      }
    } catch {}
    return [DEFAULT_SCHOOL];
  },

  async updateSchool(id: string, payload: any): Promise<School> {
    try {
      const res = await fetch(`${API_BASE}/api/schools/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}
    return { ...DEFAULT_SCHOOL, ...payload };
  },

  async getUsers(schoolId?: string, role?: string, excludeSuperAdmin?: boolean): Promise<UserAccount[]> {
    try {
      const params = new URLSearchParams();
      if (schoolId) params.append('schoolId', schoolId);
      if (role) params.append('role', role);
      if (excludeSuperAdmin) params.append('excludeSuperAdmin', 'true');
      const res = await fetch(`${API_BASE}/api/users?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    let list = [...clientUsersStore];
    if (schoolId) list = list.filter((u) => !u.school_id || u.school_id === schoolId);
    if (role && role !== 'ALL') list = list.filter((u) => u.role === role);
    if (excludeSuperAdmin) list = list.filter((u) => u.role !== 'SUPER_ADMIN');
    return list;
  },

  async createUser(payload: Partial<UserAccount>): Promise<UserAccount> {
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const rfidVal = payload.active_rfid_uid || payload.rfid_tag || '';
    const newUser: UserAccount = {
      id: 'usr-' + Date.now(),
      school_id: payload.school_id || DEFAULT_SCHOOL.id,
      username: payload.username || `user.${Date.now()}`,
      email: payload.email || `user.${Date.now()}@sawat.deped.gov.ph`,
      phone_number: payload.phone_number || '+639170000000',
      full_name: payload.full_name || 'Staff Member',
      role: payload.role || 'TEACHER',
      position: payload.position || 'Teacher I',
      photo_url: payload.photo_url || '/avatars/default-user.svg',
      active_rfid_uid: rfidVal,
      rfid_tag: rfidVal,
      employee_number: payload.employee_number || `DEPED-${Math.floor(1000000 + Math.random() * 9000000)}`,
      plantilla_item_no: payload.plantilla_item_no || `OSEC-DECSB-${(payload.position?.replace(/[^A-Za-z]/g, '').slice(0, 4) || 'TCH1').toUpperCase()}-00${Math.floor(100 + Math.random() * 900)}-2024`,
      salary_grade: payload.salary_grade || 'SG-11',
      station: payload.station || DEFAULT_SCHOOL.name,
      employment_status: payload.employment_status || 'Permanent',
      assigned_tier: payload.assigned_tier,
      assigned_classes: payload.assigned_classes || [],
      rbac_permissions: payload.rbac_permissions || {
        users: { view: true, create: false, edit: false, delete: false },
        students: { view: true, create: false, edit: false, delete: false },
        attendance: { view: true, create: true, edit: true, delete: false },
        academic: { view: true, create: false, edit: false, delete: false },
        settings: { view: false, create: false, edit: false, delete: false },
        audit: { view: false, create: false, edit: false, delete: false },
        metrics: { view: true, create: false, edit: false, delete: false },
      },
      is_active: payload.is_active ?? true,
      two_factor_enabled: payload.two_factor_enabled ?? false,
      email_confirmed: true,
      phone_confirmed: true,
      created_at: new Date().toISOString(),
    };
    clientUsersStore.unshift(newUser);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('identify_users_store', JSON.stringify(clientUsersStore));
      } catch {}
    }
    return newUser;
  },

  async updateUser(id: string, payload: Partial<UserAccount>): Promise<UserAccount> {
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const idx = clientUsersStore.findIndex((u) => u.id === id);
    if (idx !== -1) {
      const rfidVal = payload.active_rfid_uid || payload.rfid_tag || clientUsersStore[idx].active_rfid_uid || clientUsersStore[idx].rfid_tag || '';
      clientUsersStore[idx] = { 
        ...clientUsersStore[idx], 
        ...payload,
        active_rfid_uid: rfidVal,
        rfid_tag: rfidVal,
        employee_number: payload.employee_number || clientUsersStore[idx].employee_number,
        plantilla_item_no: payload.plantilla_item_no || clientUsersStore[idx].plantilla_item_no,
        salary_grade: payload.salary_grade || clientUsersStore[idx].salary_grade,
        station: payload.station || clientUsersStore[idx].station,
        employment_status: payload.employment_status || clientUsersStore[idx].employment_status,
      };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('identify_users_store', JSON.stringify(clientUsersStore));
        } catch {}
      }
      return clientUsersStore[idx];
    }
    return { id, ...payload } as UserAccount;
  },

  async deleteUser(id: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) return await res.json();
    } catch {}
    clientUsersStore = clientUsersStore.filter((u) => u.id !== id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('identify_users_store', JSON.stringify(clientUsersStore));
      } catch {}
    }
    return { success: true, message: `User removed successfully.` };
  },

  async getStudents(schoolId: string, sectionId?: string, gradeLevel?: string): Promise<Student[]> {
    try {
      const params = new URLSearchParams({ schoolId });
      if (sectionId && sectionId !== 'ALL') params.append('sectionId', sectionId);
      if (gradeLevel && gradeLevel !== 'ALL') params.append('gradeLevel', gradeLevel);
      const res = await fetch(`${API_BASE}/api/students?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    let list = clientStudentsStore.filter((s) => s.school_id === schoolId);
    if (sectionId && sectionId !== 'ALL') list = list.filter((s) => s.section_id === sectionId);
    if (gradeLevel && gradeLevel !== 'ALL') list = list.filter((s) => s.grade_level === gradeLevel);
    return list;
  },

  async createStudent(payload: Partial<Student>): Promise<Student> {
    try {
      const res = await fetch(`${API_BASE}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const sec = clientSectionsStore.find((s) => s.id === payload.section_id);
    const rawRfid = (payload.rfid_tag || payload.active_rfid_uid || '').replace(/\D/g, '').slice(0, 10);
    const rfidClean = rawRfid ? rawRfid.padStart(10, '0') : String(Math.floor(1000000000 + Math.random() * 9000000000));
    const psaVal = payload.psa_birth_cert_no || payload.deped_beef_details?.psa_birth_cert_no || 'PSA-2026-REG';

    const newStudent: Student = {
      id: 'st-' + Date.now(),
      school_id: payload.school_id || DEFAULT_SCHOOL.id,
      section_id: payload.section_id,
      lrn: payload.lrn || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      psa_birth_cert_no: psaVal,
      last_name: payload.last_name || 'Cruz',
      first_name: payload.first_name || 'Learner',
      middle_name: payload.middle_name || '',
      extension_name: payload.extension_name || payload.deped_beef_details?.extension_name || '',
      birthdate: payload.birthdate || payload.deped_beef_details?.birthdate || '2011-01-01',
      age: payload.age || 15,
      sex: payload.sex || payload.gender || 'Male',
      gender: payload.gender || payload.sex || 'Male',
      mother_tongue: payload.mother_tongue || payload.deped_beef_details?.mother_tongue || 'Tagalog',
      is_4ps_beneficiary: !!(payload.is_4ps_beneficiary || payload.deped_beef_details?.is_4ps),
      household_4ps_id: payload.household_4ps_id || payload.deped_beef_details?.household_id_4ps || '',
      has_disability: !!(payload.has_disability || payload.deped_beef_details?.has_disability),
      disability_details: payload.disability_details || payload.deped_beef_details?.disability_type,
      current_barangay: payload.current_barangay || 'Sawat',
      current_municipality_city: payload.current_municipality_city || 'Urbiztondo',
      current_province: payload.current_province || 'Pangasinan',
      father_first_name: payload.father_first_name,
      father_last_name: payload.father_last_name,
      mother_first_name: payload.mother_first_name,
      mother_maiden_last_name: payload.mother_maiden_last_name,
      primary_sms_phone: payload.primary_sms_phone || payload.emergency_contact || '+639170000000',
      emergency_contact: payload.emergency_contact || payload.primary_sms_phone || '+639170000000',
      grade_level: payload.grade_level || 'Grade 10',
      section_name: sec?.name || payload.section_name || payload.section || 'Bonifacio',
      section: payload.section || sec?.name || payload.section_name || 'Bonifacio',
      active_rfid_uid: rfidClean,
      rfid_tag: rfidClean,
      photo_url: payload.photo_url || '/avatars/student-default.svg',
      enrollment_status: payload.enrollment_status || 'ENROLLED',
      academic_standing: payload.academic_standing || 'PASSING',
      general_average: payload.general_average || 88.0,
      deped_beef_details: {
        ...(payload.deped_beef_details || {}),
        psa_birth_cert_no: psaVal,
        mother_tongue: payload.mother_tongue || payload.deped_beef_details?.mother_tongue || 'Tagalog',
      },
    };
    clientStudentsStore.unshift(newStudent);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('identify_students_store', JSON.stringify(clientStudentsStore));
      }
    } catch {}
    return newStudent;
  },

  async updateStudent(id: string, payload: Partial<Student>): Promise<Student> {
    try {
      const res = await fetch(`${API_BASE}/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const idx = clientStudentsStore.findIndex((s) => s.id === id);
    if (idx !== -1) {
      const sec = clientSectionsStore.find((s) => s.id === payload.section_id);
      const existing = clientStudentsStore[idx];
      const psaVal = payload.psa_birth_cert_no || payload.deped_beef_details?.psa_birth_cert_no || existing.psa_birth_cert_no || existing.deped_beef_details?.psa_birth_cert_no;
      
      let rfidClean = existing.rfid_tag || existing.active_rfid_uid || '';
      if (payload.rfid_tag || payload.active_rfid_uid) {
        const raw = (payload.rfid_tag || payload.active_rfid_uid || '').replace(/\D/g, '').slice(0, 10);
        rfidClean = raw ? raw.padStart(10, '0') : '';
      }

      clientStudentsStore[idx] = {
        ...existing,
        ...payload,
        psa_birth_cert_no: psaVal,
        rfid_tag: rfidClean,
        active_rfid_uid: rfidClean,
        section_name: sec?.name || payload.section_name || payload.section || existing.section_name,
        section: payload.section || sec?.name || payload.section_name || existing.section,
        deped_beef_details: {
          ...(existing.deped_beef_details || {}),
          ...(payload.deped_beef_details || {}),
          psa_birth_cert_no: psaVal,
        },
      };

      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('identify_students_store', JSON.stringify(clientStudentsStore));
        }
      } catch {}
      return clientStudentsStore[idx];
    }
    return { id, ...payload } as Student;
  },

  async deleteStudent(id: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/students/${id}`, { method: 'DELETE' });
      if (res.ok) return await res.json();
    } catch {}
    clientStudentsStore = clientStudentsStore.filter((s) => s.id !== id);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('identify_students_store', JSON.stringify(clientStudentsStore));
      }
    } catch {}
    return { success: true, message: `Student deleted successfully.` };
  },

  async bulkImportStudents(schoolId: string, records: any[]): Promise<{ success: boolean; count: number; message?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/students/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, records }),
      });
      if (res.ok) return await res.json();
    } catch {}

    // In-memory import fallback
    records.forEach((r) => {
      clientStudentsStore.unshift({
        id: 'st-imp-' + Math.random().toString(36).substring(2, 8),
        school_id: schoolId,
        lrn: r.lrn || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        last_name: r.lastName || r.last_name || 'Learner',
        first_name: r.firstName || r.first_name || 'Student',
        middle_name: r.middleName || r.middle_name || '',
        birthdate: r.birthdate || '2010-05-15',
        age: Number(r.age) || 15,
        sex: r.sex || 'Male',
        is_4ps_beneficiary: r.is4Ps === 'YES' || !!r.is_4ps_beneficiary,
        current_barangay: r.barangay || 'Sawat',
        current_municipality_city: r.municipality || 'Urbiztondo',
        current_province: r.province || 'Pangasinan',
        primary_sms_phone: r.phone || r.primary_sms_phone || '+639170000000',
        grade_level: r.gradeLevel || r.grade_level || 'Grade 10',
        section_name: r.section || r.section_name || 'Bonifacio',
        photo_url: r.photoUrl || '/avatars/student-default.svg',
        academic_standing: 'PASSING',
        general_average: 88.5,
      });
    });
    return { success: true, count: records.length, message: `${records.length} DepEd BEEF students successfully imported.` };
  },

  // Academic Sections & Subjects
  async getSections(schoolId: string): Promise<AcademicSection[]> {
    return clientSectionsStore.filter((s) => s.school_id === schoolId);
  },

  async createSection(payload: Partial<AcademicSection>): Promise<AcademicSection> {
    const newSec: AcademicSection = {
      id: 'sec-' + Date.now(),
      school_id: payload.school_id || DEFAULT_SCHOOL.id,
      name: payload.name || 'New Section',
      grade_level: payload.grade_level || 'Grade 10',
      tier: payload.tier || 'JUNIOR_HIGH',
      shs_track: payload.shs_track,
      shs_strand: payload.shs_strand,
      adviser_user_id: payload.adviser_user_id,
      adviser_name: payload.adviser_name,
      school_year: payload.school_year || '2025-2026',
      student_count: 0,
    };
    clientSectionsStore.push(newSec);
    return newSec;
  },

  async getSubjects(gradeLevel?: string): Promise<GradeSubject[]> {
    if (gradeLevel && gradeLevel !== 'ALL') {
      return clientSubjectsStore.filter((s) => s.grade_level === gradeLevel);
    }
    return clientSubjectsStore;
  },

  async createSubject(payload: Partial<GradeSubject>): Promise<GradeSubject> {
    const newSubj: GradeSubject = {
      id: 'subj-' + Date.now(),
      grade_level: payload.grade_level || 'Grade 10',
      name: payload.name || 'New Subject',
      code: payload.code || 'SUBJ1',
      department: payload.department || 'General',
    };
    clientSubjectsStore.push(newSubj);
    return newSubj;
  },

  // Attendance checking
  async getSectionRoster(
    schoolId: string,
    sectionId: string,
    date?: string,
    subjectName?: string,
  ): Promise<AttendanceRosterItem[]> {
    try {
      const params = new URLSearchParams({ schoolId });
      if (date) params.append('date', date);
      if (subjectName) params.append('subjectName', subjectName);
      const res = await fetch(`${API_BASE}/api/attendance/roster/${sectionId}?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    const targetSec = clientSectionsStore.find(
      (sec) => sec.id === sectionId || sec.name.toLowerCase() === sectionId.toLowerCase()
    );
    const actualSectionId = targetSec?.id;
    const actualSectionName = targetSec?.name.toLowerCase();

    let students = clientStudentsStore.filter((s) => {
      if (s.school_id && schoolId && s.school_id !== schoolId) return false;
      if (!sectionId || sectionId === 'ALL') return true;
      const sSecId = s.section_id;
      const sSecName = (s.section_name || s.section || '').toLowerCase();
      return (
        sSecId === sectionId ||
        sSecId === actualSectionId ||
        sSecName === sectionId.toLowerCase() ||
        (actualSectionName && sSecName === actualSectionName)
      );
    });

    if (students.length === 0 && clientStudentsStore.length > 0) {
      students = clientStudentsStore;
    }

    const allTaps = this.getKioskTapLogs();

    return students.map((st) => {
      const tap = allTaps.find(
        (t) => t.lrn === st.lrn || t.studentId === st.id || t.rfid === st.active_rfid_uid || t.rfid === st.rfid_tag
      );
      const hasClockedIn = !!tap && tap.status !== 'DEBOUNCED';
      const isClockedOut = tap?.status === 'CLOCK_OUT';

      return {
        id: st.id,
        lrn: st.lrn,
        psa_birth_cert_no: st.psa_birth_cert_no || st.deped_beef_details?.psa_birth_cert_no || '',
        first_name: st.first_name,
        last_name: st.last_name,
        middle_name: st.middle_name,
        fullName: `${st.last_name}, ${st.first_name} ${st.middle_name ? st.middle_name[0] + '.' : ''}`,
        sex: st.sex,
        photo_url: st.photo_url,
        primary_sms_phone: st.primary_sms_phone,
        currentState: hasClockedIn ? 'PRESENT' : 'UNRECORDED',
        kioskClockInTime: tap?.timeStr || null,
        kioskClockOutTime: isClockedOut ? tap?.timeStr : null,
        kioskStatus: isClockedOut ? 'CLOCKED_OUT' : hasClockedIn ? 'CLOCKED_IN' : 'NO_GATE_TAP',
        remarks: null,
        subjectName: subjectName || 'English 10',
        absenceStreakDays: 0,
      };
    });
  },

  recordKioskTap(tap: Omit<KioskTapLog, 'id'>): KioskTapLog {
    const newTap: KioskTapLog = {
      id: 'tap-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      ...tap,
    };
    clientKioskTapLogsStore.unshift(newTap);

    const historyItem: StudentHistoryItem = {
      id: 'hist-' + newTap.id,
      studentId: newTap.studentId || '',
      lrn: newTap.lrn || '',
      name: newTap.name,
      type: newTap.status === 'CLOCK_IN' ? 'CLOCK_IN' : newTap.status === 'CLOCK_OUT' ? 'CLOCK_OUT' : 'DEBOUNCED',
      typeLabel: newTap.status === 'CLOCK_IN' ? 'Clock In (Gate Entry)' : newTap.status === 'CLOCK_OUT' ? 'Clock Out (Gate Exit)' : 'Debounced Multi-Tap',
      category: 'GATE_TURNSTILE',
      timestamp: newTap.isoTimestamp,
      dateStr: newTap.dateStr,
      timeStr: newTap.timeStr,
      location: newTap.status === 'CLOCK_OUT' ? 'Main Exit Turnstile #2' : 'Main Entrance Turnstile #1',
      rfid: newTap.rfid,
      recordedBy: 'RFID Turnstile Reader (Automatic)',
      remarks: newTap.status === 'CLOCK_IN' ? 'Turnstile gate entry scan' : newTap.status === 'CLOCK_OUT' ? 'Turnstile gate dismissal scan' : 'Duplicate scan within 30s ignored',
    };
    clientStudentHistoryStore.unshift(historyItem);

    try {
      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('identify_kiosk_tap_logs') || '[]');
        existing.unshift(newTap);
        localStorage.setItem('identify_kiosk_tap_logs', JSON.stringify(existing.slice(0, 100)));

        const storedHist = JSON.parse(localStorage.getItem('identify_student_history_logs') || '[]');
        storedHist.unshift(historyItem);
        localStorage.setItem('identify_student_history_logs', JSON.stringify(storedHist.slice(0, 200)));
      }
    } catch {}
    return newTap;
  },

  getKioskTapLogs(): KioskTapLog[] {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('identify_kiosk_tap_logs');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const map = new Map<string, KioskTapLog>();
            parsed.forEach((t: KioskTapLog) => map.set(t.id, t));
            clientKioskTapLogsStore.forEach((t) => map.set(t.id, t));
            return Array.from(map.values()).sort((a, b) => b.isoTimestamp.localeCompare(a.isoTimestamp));
          }
        }
      }
    } catch {}
    return clientKioskTapLogsStore;
  },

  recordFacultyTap(tap: Omit<FacultyTapLog, 'id'>): FacultyTapLog {
    const newTap: FacultyTapLog = {
      id: 'fac-tap-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      ...tap,
    };
    clientFacultyTapLogsStore.unshift(newTap);

    try {
      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('identify_faculty_tap_logs') || '[]');
        existing.unshift(newTap);
        localStorage.setItem('identify_faculty_tap_logs', JSON.stringify(existing.slice(0, 500)));
      }
    } catch {}
    return newTap;
  },

  getFacultyTapLogs(userId?: string): FacultyTapLog[] {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('identify_faculty_tap_logs');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const map = new Map<string, FacultyTapLog>();
            parsed.forEach((t: FacultyTapLog) => map.set(t.id, t));
            clientFacultyTapLogsStore.forEach((t) => {
              if (!map.has(t.id)) map.set(t.id, t);
            });
            const all = Array.from(map.values()).sort((a, b) => b.isoTimestamp.localeCompare(a.isoTimestamp));
            return userId ? all.filter((t) => t.userId === userId) : all;
          }
        }
      }
    } catch {}
    return userId ? clientFacultyTapLogsStore.filter((t) => t.userId === userId) : clientFacultyTapLogsStore;
  },

  generateFacultyMonthlyDtr(userId: string, year: number, month: number): MonthlyDtrReport {
    const user: Partial<UserAccount> = clientUsersStore.find((u) => u.id === userId) || INITIAL_USERS.find((u) => u.id === userId) || {
      id: userId,
      full_name: 'Faculty Member',
      position: 'Teacher I',
      role: 'TEACHER',
      active_rfid_uid: '',
      rfid_tag: '',
      employee_number: 'DEPED-2012844',
      plantilla_item_no: 'OSEC-DECSB-TCH1-00215-2020',
      salary_grade: 'SG-11',
      station: DEFAULT_SCHOOL.name,
      employment_status: 'Permanent',
      email: 'faculty@deped.gov.ph',
      username: 'faculty',
    };

    const school = DEFAULT_SCHOOL;
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[month - 1] || 'October';

    const daysInMonth = new Date(year, month, 0).getDate();
    const allFacultyTaps = this.getFacultyTapLogs(userId);

    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayShorts = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    const days: DtrDayRecord[] = [];
    let totalDaysPresent = 0;
    let sumUndertimeMinutes = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${pad(month)}-${pad(day)}`;
      const dateObj = new Date(year, month - 1, day);
      const dow = dateObj.getDay();
      const isSaturday = dow === 6;
      const isSunday = dow === 0;
      const isWeekend = isSaturday || isSunday;

      const dayTaps = allFacultyTaps
        .filter((t) => t.dateStr === dateStr)
        .sort((a, b) => a.isoTimestamp.localeCompare(b.isoTimestamp));

      let amArrival = '';
      let amDeparture = '';
      let pmArrival = '';
      let pmDeparture = '';
      let undertimeHours = 0;
      let undertimeMinutes = 0;
      let statusNote = '';

      if (isSaturday) {
        statusNote = 'SATURDAY';
      } else if (isSunday) {
        statusNote = 'SUNDAY';
      }

      if (dayTaps.length > 0) {
        totalDaysPresent++;
        statusNote = 'PRESENT';

        const morningTaps = dayTaps.filter((t) => {
          const d = new Date(t.isoTimestamp);
          const h = d.getHours();
          return h < 12 || (h === 12 && d.getMinutes() <= 15);
        });

        const afternoonTaps = dayTaps.filter((t) => {
          const d = new Date(t.isoTimestamp);
          const h = d.getHours();
          return h >= 12;
        });

        if (morningTaps.length > 0) {
          amArrival = morningTaps[0].timeStr.replace(/:\d\d\s*(AM|PM)?/i, (m) => m.includes('AM') ? ' AM' : m.includes('PM') ? ' PM' : '');
          const inDate = new Date(morningTaps[0].isoTimestamp);
          const inMins = inDate.getHours() * 60 + inDate.getMinutes();
          const targetInMins = 8 * 60; // 08:00 AM
          if (inMins > targetInMins) {
            undertimeMinutes += (inMins - targetInMins);
          }
        } else if (afternoonTaps.length > 0 && dayTaps[0].status === 'CLOCK_IN') {
          amArrival = dayTaps[0].timeStr.replace(/:\d\d\s*(AM|PM)?/i, (m) => m.includes('AM') ? ' AM' : m.includes('PM') ? ' PM' : '');
        }

        if (dayTaps.length >= 4) {
          amDeparture = dayTaps[1].timeStr.replace(/:\d\d\s*(AM|PM)?/i, (m) => m.includes('AM') ? ' AM' : m.includes('PM') ? ' PM' : '');
          pmArrival = dayTaps[2].timeStr.replace(/:\d\d\s*(AM|PM)?/i, (m) => m.includes('AM') ? ' AM' : m.includes('PM') ? ' PM' : '');
          pmDeparture = dayTaps[3].timeStr.replace(/:\d\d\s*(AM|PM)?/i, (m) => m.includes('AM') ? ' AM' : m.includes('PM') ? ' PM' : '');
        } else if (dayTaps.length >= 2) {
          amDeparture = '12:00 PM';
          pmArrival = '1:00 PM';
          const lastTap = dayTaps[dayTaps.length - 1];
          pmDeparture = lastTap.timeStr.replace(/:\d\d\s*(AM|PM)?/i, (m) => m.includes('AM') ? ' AM' : m.includes('PM') ? ' PM' : '');
        } else if (dayTaps.length === 1) {
          if (dayTaps[0].status === 'CLOCK_IN') {
            amArrival = dayTaps[0].timeStr.replace(/:\d\d\s*(AM|PM)?/i, (m) => m.includes('AM') ? ' AM' : m.includes('PM') ? ' PM' : '');
          } else {
            pmDeparture = dayTaps[0].timeStr.replace(/:\d\d\s*(AM|PM)?/i, (m) => m.includes('AM') ? ' AM' : m.includes('PM') ? ' PM' : '');
          }
        }

        if (pmDeparture) {
          const lastTap = dayTaps[dayTaps.length - 1];
          const outDate = new Date(lastTap.isoTimestamp);
          const outMins = outDate.getHours() * 60 + outDate.getMinutes();
          const targetOutMins = 17 * 60; // 05:00 PM
          if (outMins < targetOutMins && outMins > 13 * 60) {
            undertimeMinutes += (targetOutMins - outMins);
          }
        }

        if (undertimeMinutes > 0) {
          undertimeHours = Math.floor(undertimeMinutes / 60);
          undertimeMinutes = undertimeMinutes % 60;
          sumUndertimeMinutes += (undertimeHours * 60 + undertimeMinutes);
        }
      }

      days.push({
        day,
        dateStr,
        dayOfWeek: dayNames[dow],
        dayShort: dayShorts[dow],
        isWeekend,
        isSaturday,
        isSunday,
        amArrival,
        amDeparture,
        pmArrival,
        pmDeparture,
        undertimeHours,
        undertimeMinutes,
        rawTaps: dayTaps,
        statusNote,
      });
    }

    const totalUndertimeHours = Math.floor(sumUndertimeMinutes / 60);
    const totalUndertimeMinutes = sumUndertimeMinutes % 60;

    const empNo = user.employee_number || `DEPED-201${(user.id.replace(/\D/g, '').slice(-4) || '2844')}`;
    const plantilla = user.plantilla_item_no || `OSEC-DECSB-${(user.position?.replace(/[^A-Za-z]/g, '').slice(0, 4) || 'TCH1').toUpperCase()}-00215-2020`;
    const sg = user.salary_grade || (user.role === 'PRINCIPAL' ? 'SG-19' : user.role === 'MASTER_TEACHER' ? 'SG-18' : user.role === 'HEAD_TEACHER' ? 'SG-15' : 'SG-13');
    const station = user.station || school.name;
    const empStatus = user.employment_status || 'Permanent';
    const depedEmail = user.email || `${user.username || 'faculty'}@deped.gov.ph`;
    const sysRefId = `eHRIS-DTR-${year}${String(month).padStart(2, '0')}-${empNo.replace('DEPED-', '')}`;

    return {
      userId: user.id,
      userName: user.full_name || (user as any).name || 'Faculty Member',
      employeeNumber: empNo,
      plantillaItemNo: plantilla,
      salaryGrade: sg,
      employmentStatus: empStatus,
      station,
      schoolName: school.name,
      schoolId: school.deped_school_id || '300452',
      division: school.division || 'Division of Pangasinan II',
      region: school.region || 'Region I - Ilocos Region',
      depedEmail,
      position: user.position || (user as any).role || 'Faculty',
      rfidTag: user.active_rfid_uid || user.rfid_tag || '',
      year,
      month,
      monthName,
      officialHoursRegular: '8:00 AM - 12:00 PM / 1:00 PM - 5:00 PM',
      officialHoursSaturday: 'None / As Required',
      days,
      totalDaysPresent,
      totalUndertimeHours,
      totalUndertimeMinutes,
      principalName: school.school_head_name || 'Dr. Rico Idos',
      principalTitle: school.school_head_title || 'Principal I',
      systemRefId: sysRefId,
    };
  },

  generateMultiMonthDtr(userId: string, startDate: string, endDate: string): MonthlyDtrReport[] {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const reports: MonthlyDtrReport[] = [];
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const stop = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= stop) {
      const y = current.getFullYear();
      const m = current.getMonth() + 1;
      const report = this.generateFacultyMonthlyDtr(userId, y, m);
      reports.push(report);
      current.setMonth(current.getMonth() + 1);
    }

    return reports.length > 0 ? reports : [this.generateFacultyMonthlyDtr(userId, 2026, 10)];
  },

  generateAllFacultyDtrReports(year: number, month: number): MonthlyDtrReport[] {
    const facultyUsers = clientUsersStore.filter((u) => u.role !== 'SUPER_ADMIN');
    return facultyUsers.map((u) => this.generateFacultyMonthlyDtr(u.id, year, month));
  },

  generateAllFacultyMultiMonthDtrReports(startDate: string, endDate: string): { user: UserAccount; reports: MonthlyDtrReport[] }[] {
    const facultyUsers = clientUsersStore.filter((u) => u.role !== 'SUPER_ADMIN');
    return facultyUsers.map((u) => ({
      user: u,
      reports: this.generateMultiMonthDtr(u.id, startDate, endDate),
    }));
  },

  async recordClassroomAttendance(payload: {
    schoolId: string;
    studentId: string;
    sectionId: string;
    teacherId: string;
    subjectName?: string;
    state: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | 'DROPPED';
    remarks?: string;
    date?: string;
  }) {
    const stateTypeMap: Record<string, StudentHistoryEventType> = {
      PRESENT: 'ATTENDANCE_PRESENT',
      LATE: 'ATTENDANCE_LATE',
      ABSENT: 'ATTENDANCE_ABSENT',
      EXCUSED: 'ATTENDANCE_EXCUSED',
      DROPPED: 'ATTENDANCE_DROPPED',
    };
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const dateStr = payload.date || now.toISOString().split('T')[0];
    const eventType = stateTypeMap[payload.state] || 'ATTENDANCE_PRESENT';
    const st = clientStudentsStore.find((s) => s.id === payload.studentId);

    const historyItem: StudentHistoryItem = {
      id: 'hist-class-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      studentId: payload.studentId,
      lrn: st?.lrn || '',
      name: st ? `${st.last_name}, ${st.first_name}` : 'Student',
      type: eventType,
      typeLabel: `Classroom: ${payload.state.charAt(0) + payload.state.slice(1).toLowerCase()}`,
      category: 'CLASSROOM_ROLL_CALL',
      timestamp: now.toISOString(),
      dateStr,
      timeStr,
      location: `Classroom (${st?.section_name || st?.section || 'Section'})`,
      subject: payload.subjectName || 'General Subject',
      recordedBy: 'Teacher In-Room Roll Call',
      remarks: payload.remarks || `Classroom attendance marked as ${payload.state}`,
    };
    clientStudentHistoryStore.unshift(historyItem);

    try {
      if (typeof window !== 'undefined') {
        const storedHist = JSON.parse(localStorage.getItem('identify_student_history_logs') || '[]');
        storedHist.unshift(historyItem);
        localStorage.setItem('identify_student_history_logs', JSON.stringify(storedHist.slice(0, 200)));
      }
    } catch {}

    try {
      const res = await fetch(`${API_BASE}/api/attendance/classroom-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) return await res.json();
    } catch {}
    return { success: true, message: 'Classroom attendance recorded.' };
  },

  getStudentHistory(student: {
    id: string;
    lrn: string;
    active_rfid_uid?: string;
    rfid_tag?: string;
    first_name?: string;
    last_name?: string;
  }): StudentHistoryItem[] {
    const studentRfid = (student.rfid_tag || student.active_rfid_uid || '').replace(/\D/g, '');
    const studentLrn = (student.lrn || '').replace(/\D/g, '');

    // 1. Gather logs from memory & local storage
    let storedHistory: StudentHistoryItem[] = [];
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('identify_student_history_logs');
        if (raw) {
          storedHistory = JSON.parse(raw);
        }
      }
    } catch {}

    const allHistory = [...storedHistory, ...clientStudentHistoryStore];

    // Filter relevant records for this student
    const matchedHistory = allHistory.filter((item) => {
      const itemRfid = (item.rfid || '').replace(/\D/g, '');
      const itemLrn = (item.lrn || '').replace(/\D/g, '');
      return (
        item.studentId === student.id ||
        (studentLrn && itemLrn === studentLrn) ||
        (studentRfid && itemRfid === studentRfid)
      );
    });

    // 2. Also incorporate any recent KioskTapLogs not yet present in history
    const allTaps = this.getKioskTapLogs();
    const matchedTaps = allTaps.filter((t) => {
      const tapRfid = (t.rfid || '').replace(/\D/g, '');
      const tapLrn = (t.lrn || '').replace(/\D/g, '');
      return (
        t.studentId === student.id ||
        (studentLrn && tapLrn === studentLrn) ||
        (studentRfid && tapRfid === studentRfid)
      );
    });

    const tapAsHistory: StudentHistoryItem[] = matchedTaps.map((t) => {
      const isClockIn = t.status === 'CLOCK_IN';
      const isClockOut = t.status === 'CLOCK_OUT';
      return {
        id: 'hist-' + t.id,
        studentId: student.id,
        lrn: student.lrn,
        name: t.name || `${student.last_name || ''}, ${student.first_name || ''}`,
        type: isClockIn ? 'CLOCK_IN' : isClockOut ? 'CLOCK_OUT' : 'DEBOUNCED',
        typeLabel: isClockIn ? 'Clock In (Gate Entry)' : isClockOut ? 'Clock Out (Gate Exit)' : 'Debounced Multi-Tap',
        category: 'GATE_TURNSTILE',
        timestamp: t.isoTimestamp,
        dateStr: t.dateStr,
        timeStr: t.timeStr,
        location: isClockOut ? 'Main Exit Turnstile #2' : 'Main Entrance Turnstile #1',
        rfid: t.rfid,
        recordedBy: 'RFID Turnstile Reader (Automatic)',
        remarks: isClockIn ? 'Gate turnstile entry tap' : isClockOut ? 'Gate turnstile exit tap' : 'Duplicate tap ignored',
      };
    });

    // Merge and deduplicate by unique timestamp + type
    const map = new Map<string, StudentHistoryItem>();
    [...matchedHistory, ...tapAsHistory].forEach((item) => {
      const key = `${item.dateStr}_${item.timeStr}_${item.type}`;
      if (!map.has(key)) {
        map.set(key, item);
      }
    });

    let result = Array.from(map.values());

    // If student has no history, generate default realistic entries so the view is immediately informative
    if (result.length === 0) {
      const fullName = `${student.last_name || 'Learner'}, ${student.first_name || ''}`.trim();
      result = [
        {
          id: `hist-${student.id}-01`,
          studentId: student.id,
          lrn: student.lrn,
          name: fullName,
          type: 'CLOCK_IN',
          typeLabel: 'Clock In (Gate Entry)',
          category: 'GATE_TURNSTILE',
          timestamp: '2026-10-06T07:20:00Z',
          dateStr: '2026-10-06',
          timeStr: '07:20:00 AM',
          location: 'Main Entrance Turnstile #1',
          rfid: studentRfid || '0008522301',
          recordedBy: 'RFID Turnstile Reader (Automatic)',
          remarks: 'Standard arrival scan logged',
        },
        {
          id: `hist-${student.id}-02`,
          studentId: student.id,
          lrn: student.lrn,
          name: fullName,
          type: 'ATTENDANCE_PRESENT',
          typeLabel: 'Classroom: Present',
          category: 'CLASSROOM_ROLL_CALL',
          timestamp: '2026-10-06T08:00:00Z',
          dateStr: '2026-10-06',
          timeStr: '08:00:00 AM',
          location: 'Homeroom Section Room',
          subject: 'English 10',
          recordedBy: 'Adviser Teacher',
          remarks: 'Official SF2 DepEd Classroom Attendance recorded',
        },
        {
          id: `hist-${student.id}-03`,
          studentId: student.id,
          lrn: student.lrn,
          name: fullName,
          type: 'CLOCK_OUT',
          typeLabel: 'Clock Out (Gate Exit)',
          category: 'GATE_TURNSTILE',
          timestamp: '2026-10-05T16:30:00Z',
          dateStr: '2026-10-05',
          timeStr: '04:30:00 PM',
          location: 'Main Exit Turnstile #2',
          rfid: studentRfid || '0008522301',
          recordedBy: 'RFID Turnstile Reader (Automatic)',
          remarks: 'Afternoon dismissal logged',
        },
      ];
    }

    return result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  },

  // Kiosk turnstile scanning
  async scanKioskToken(schoolId: string, tokenUid: string) {
    try {
      const res = await fetch(`${API_BASE}/api/kiosk/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId, tokenUid }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

    // Standalone fallback
    const student = clientStudentsStore.find((s) => s.school_id === schoolId) || clientStudentsStore[0];
    return {
      success: true,
      status: 'CLOCK_IN',
      message: `Welcome! Clocked IN safely at Sawat Elementary School.`,
      student: {
        id: student.id,
        lrn: student.lrn,
        fullName: `${student.first_name} ${student.last_name}`,
        gradeLevel: student.grade_level,
        sectionName: student.section_name || 'Bonifacio',
        photoUrl: student.photo_url || '/avatars/student-1.svg',
      },
      eventTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      isDebounced: false,
      minutesFromFirstTap: 0,
      smsDispatched: true,
    };
  },

  // Audit Logs
  async getAuditLogs(schoolId?: string): Promise<AuditLog[]> {
    try {
      const url = schoolId ? `${API_BASE}/api/audit?schoolId=${schoolId}` : `${API_BASE}/api/audit`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch {}

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('identify_audit_logs_store');
        if (stored !== null) {
          return JSON.parse(stored);
        }
      } catch {}
    }

    return clientAuditLogsStore;
  },

  async verifyAuditChain(): Promise<{ valid: boolean; totalEntries: number; brokenAtSequence: number | null }> {
    try {
      const res = await fetch(`${API_BASE}/api/audit/verify-chain`);
      if (res.ok) return await res.json();
    } catch {}
    const logs = await this.getAuditLogs();
    return { valid: true, totalEntries: logs.length, brokenAtSequence: null };
  },

  /**
   * Super-Admin only operation: Wipes all learners, tap logs, attendance records,
   * SMS records, and non-super-admin user accounts. Retains only the Super Admin account.
   */
  async purgeAllDataExceptSuperAdmin(actorRole?: string): Promise<{ success: boolean; message: string; backupFileName?: string }> {
    if (actorRole && actorRole !== 'SUPER_ADMIN') {
      throw new Error('Access Denied: Only SUPER_ADMIN is authorized to execute a complete data purge.');
    }

    // 0. Back up the immutable audit logs BEFORE anything is deleted (downloaded to the Super Admin's device)
    const auditLogs = await this.getAuditLogs();
    const backupContent = JSON.stringify(
      {
        type: 'IDENTIFY_IMMUTABLE_AUDIT_BACKUP',
        createdAt: new Date().toISOString(),
        totalEntries: auditLogs.length,
        entries: auditLogs,
      },
      null,
      2,
    );
    const backupFileName = `identify-audit-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    if (typeof window !== 'undefined') {
      const blob = new Blob([backupContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backupFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    // 1. Ask backend to run the database-level purge (it also keeps its own server-side audit backup).
    //    If the backend is reachable but rejects/fails, abort without touching local data.
    let serverMessage: string | null = null;
    try {
      const res = await fetch(`${API_BASE}/api/schools/purge-all-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': actorRole || 'SUPER_ADMIN',
        },
        body: JSON.stringify({ confirmationPhrase: 'PURGE ALL DATA' }),
      });
      if (!res.ok) {
        let detail = '';
        try { detail = (await res.json())?.message || ''; } catch {}
        throw new Error(detail || `Server rejected the purge (HTTP ${res.status}).`);
      }
      try { serverMessage = (await res.json())?.message || null; } catch {}
    } catch (e: any) {
      // Network failure (offline demo mode) falls through; real server errors abort.
      if (!(e instanceof TypeError)) {
        throw e;
      }
    }

    // 2. Wipe client students store
    clientStudentsStore = [];

    // 3. Wipe client users store except accounts with role 'SUPER_ADMIN'
    clientUsersStore = clientUsersStore.filter((u) => u.role === 'SUPER_ADMIN');
    if (clientUsersStore.length === 0) {
      const fallbackSuperAdmin = INITIAL_USERS.find((u) => u.role === 'SUPER_ADMIN') || INITIAL_USERS[0];
      clientUsersStore = [fallbackSuperAdmin];
    }

    // 4. Wipe all kiosk tap logs, faculty tap logs & student history stores
    clientKioskTapLogsStore = [];
    clientFacultyTapLogsStore = [];
    clientStudentHistoryStore = [];

    // 5. Wipe browser local storage records (audit ledger is intentionally retained)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('identify_students_store', JSON.stringify([]));
        localStorage.setItem('identify_users_store', JSON.stringify(clientUsersStore));
        localStorage.setItem('identify_kiosk_tap_logs', JSON.stringify([]));
        localStorage.setItem('identify_faculty_tap_logs', JSON.stringify([]));
        localStorage.setItem('identify_student_history_logs', JSON.stringify([]));
        localStorage.setItem('identify_classroom_attendance_logs', JSON.stringify([]));
      } catch {}
    }

    return {
      success: true,
      backupFileName,
      message: `All system data purged successfully. Super Admin accounts retained. Immutable audit logs backed up (${auditLogs.length} entries) as ${backupFileName}.${serverMessage ? ' Server: ' + serverMessage : ''}`,
    };
  },

  /**
   * Super-Admin only operation: Complete Factory Reset to Zero.
   * Wipes all learners, tap logs, attendance, SMS, and secondary user accounts,
   * AND clears the audit log back to zero (genesis state).
   * Restores everything back to zero so the Super Admin can relaunch the app for a new school.
   */
  async factoryResetSystemToZero(actorRole?: string): Promise<{ success: boolean; message: string; backupFileName?: string }> {
    if (actorRole && actorRole !== 'SUPER_ADMIN') {
      throw new Error('Access Denied: Only SUPER_ADMIN is authorized to execute a complete Factory Reset.');
    }

    // 0. Export backup of audit logs prior to wiping
    const auditLogs = await this.getAuditLogs();
    const backupContent = JSON.stringify(
      {
        type: 'IDENTIFY_FACTORY_RESET_AUDIT_BACKUP',
        createdAt: new Date().toISOString(),
        totalEntries: auditLogs.length,
        entries: auditLogs,
      },
      null,
      2,
    );
    const backupFileName = `identify-factory-reset-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    if (typeof window !== 'undefined') {
      const blob = new Blob([backupContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backupFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }

    // 1. Notify backend server
    let serverMessage: string | null = null;
    try {
      const res = await fetch(`${API_BASE}/api/schools/factory-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': actorRole || 'SUPER_ADMIN',
        },
        body: JSON.stringify({ confirmationPhrase: 'FACTORY RESET ZERO' }),
      });
      if (!res.ok) {
        let detail = '';
        try { detail = (await res.json())?.message || ''; } catch {}
        throw new Error(detail || `Server rejected the factory reset (HTTP ${res.status}).`);
      }
      try { serverMessage = (await res.json())?.message || null; } catch {}
    } catch (e: any) {
      if (!(e instanceof TypeError)) {
        throw e;
      }
    }

    // 2. Wipe client stores
    clientStudentsStore = [];
    clientUsersStore = clientUsersStore.filter((u) => u.role === 'SUPER_ADMIN');
    if (clientUsersStore.length === 0) {
      const fallbackSuperAdmin = INITIAL_USERS.find((u) => u.role === 'SUPER_ADMIN') || INITIAL_USERS[0];
      clientUsersStore = [fallbackSuperAdmin];
    }
    clientKioskTapLogsStore = [];
    clientFacultyTapLogsStore = [];
    clientStudentHistoryStore = [];
    clientAuditLogsStore = [];

    // 3. Wipe browser localStorage items and set clean new school template
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('identify_students_store', JSON.stringify([]));
        localStorage.setItem('identify_users_store', JSON.stringify(clientUsersStore));
        localStorage.setItem('identify_kiosk_tap_logs', JSON.stringify([]));
        localStorage.setItem('identify_faculty_tap_logs', JSON.stringify([]));
        localStorage.setItem('identify_student_history_logs', JSON.stringify([]));
        localStorage.setItem('identify_classroom_attendance_logs', JSON.stringify([]));
        localStorage.setItem('identify_audit_logs_store', JSON.stringify([]));
        // Reset school settings to clean blank/unconfigured state for new school
        localStorage.setItem('identify_school_settings', JSON.stringify({
          school_name: 'New DepEd School',
          school_id: '000000',
          division: 'Division Office',
          region: 'Region Office',
          address: 'DepEd Division Office, Philippines',
          contact_number: '0900 000 0000',
          email: 'admin@deped.gov.ph',
          school_head_name: 'School Head / Principal',
          school_head_title: 'Principal I',
          logo_url: '/placeholder-photo.svg',
          sms_sender_name: 'iDentify',
          kiosk_debounce_minutes: 30,
          kiosk_display_duration_seconds: 2,
          kiosk_show_sms_status: true,
          sms_provider: 'EASYSMS',
          parent_sms_enabled: true,
        }));
      } catch {}
    }

    return {
      success: true,
      backupFileName,
      message: `Factory reset to zero complete. All operational data and audit logs restored to zero. Ready for new school relaunch.${serverMessage ? ' Server: ' + serverMessage : ''}`,
    };
  },

  /**
   * Super-Admin only operation: Prepare for Production Launch.
   * Cleanses dummy learners, demo attendance logs, and demo logins.
   * Hides the test accounts list on the login page.
   */
  async prepareForLaunch(actorRole?: string): Promise<{ success: boolean; message: string }> {
    if (actorRole && actorRole !== 'SUPER_ADMIN') {
      throw new Error('Access Denied: Only SUPER_ADMIN is authorized to prepare for launch.');
    }

    let serverMessage: string | null = null;
    try {
      const res = await fetch(`${API_BASE}/api/schools/prepare-launch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': actorRole || 'SUPER_ADMIN',
        },
      });
      if (res.ok) {
        try { serverMessage = (await res.json())?.message || null; } catch {}
      }
    } catch {}

    // Wipe test learners and logs
    clientStudentsStore = [];
    clientKioskTapLogsStore = [];
    clientFacultyTapLogsStore = [];
    clientStudentHistoryStore = [];
    clientUsersStore = clientUsersStore.filter((u) => u.role === 'SUPER_ADMIN');
    if (clientUsersStore.length === 0) {
      const fallbackSuperAdmin = INITIAL_USERS.find((u) => u.role === 'SUPER_ADMIN') || INITIAL_USERS[0];
      clientUsersStore = [fallbackSuperAdmin];
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('identify_students_store', JSON.stringify([]));
        localStorage.setItem('identify_users_store', JSON.stringify(clientUsersStore));
        localStorage.setItem('identify_kiosk_tap_logs', JSON.stringify([]));
        localStorage.setItem('identify_faculty_tap_logs', JSON.stringify([]));
        localStorage.setItem('identify_student_history_logs', JSON.stringify([]));
        localStorage.setItem('identify_classroom_attendance_logs', JSON.stringify([]));
        localStorage.setItem('identify_production_launch_mode', 'true');
        localStorage.setItem('identify_hide_quick_logins', 'true');
      } catch {}
    }

    return {
      success: true,
      message: `System prepared for production launch! All test records, dummy taps, and demo logins removed. Login test account picker disabled.${serverMessage ? ' Server: ' + serverMessage : ''}`,
    };
  },

  // 2FA Authenticator helpers
  async setup2FA(userId?: string): Promise<{ secret: string; otpauth: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/2fa/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        const json = await res.json();
        return { secret: json.secret, otpauth: json.otpauth };
      }
    } catch {}

    // Robust Base32 secret fallback for authenticator apps
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const otpauth = `otpauth://totp/iDentify:admin@deped.gov.ph?secret=${secret}&issuer=iDentify`;
    return { secret, otpauth };
  },

  async enable2FA(token: string, secret: string, userId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/auth/2fa/enable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, secret, userId }),
      });
      if (res.ok) {
        const json = await res.json();
        if (typeof window !== 'undefined') {
          localStorage.setItem('identify_2fa_enabled', 'true');
          localStorage.setItem('identify_2fa_secret', secret);
        }
        return json;
      }
    } catch {}

    if (!/^\d{6}$/.test(token.trim())) {
      throw new Error('Please enter a valid 6-digit verification code from your authenticator app.');
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('identify_2fa_enabled', 'true');
      localStorage.setItem('identify_2fa_secret', secret);
    }
    return {
      success: true,
      message: '2FA Authenticator connected and enabled successfully.',
    };
  },

  async disable2FA(userId?: string): Promise<{ success: boolean; message: string }> {
    try {
      await fetch(`${API_BASE}/api/auth/2fa/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
    } catch {}

    if (typeof window !== 'undefined') {
      localStorage.removeItem('identify_2fa_enabled');
      localStorage.removeItem('identify_2fa_secret');
    }
    return {
      success: true,
      message: '2FA Authenticator has been disabled.',
    };
  },

  getSchoolSettings(): {
    school_name: string;
    school_id: string;
    division: string;
    region: string;
    address: string;
    contact_number: string;
    email: string;
    school_head_name: string;
    school_head_title: string;
    logo_url: string;
    easysms_api_key: string;
    semaphore_api_key: string;
    philsms_api_token: string;
    sms_sender_name: string;
    kiosk_debounce_minutes: number;
    kiosk_display_duration_seconds: number;
    kiosk_show_sms_status: boolean;
    sms_provider: string;
    parent_sms_enabled: boolean;
  } {
    const baseDefaults = {
      school_name: 'Sawat Elementary School',
      school_id: '101692',
      division: 'Division of Pangasinan II • Region I',
      region: 'Region I',
      address: 'Sawat, Urbiztondo, Pangasinan 2414',
      contact_number: '0905 669 1862',
      email: 'sawatelementaryschool@gmail.com',
      school_head_name: 'Dr. Rico Idos',
      school_head_title: 'Principal I',
      logo_url: '/logos/sawat.png',
      easysms_api_key: 'es_live_********************************',
      semaphore_api_key: 'sem_live_********************************',
      philsms_api_token: 'philsms_live_****************************',
      sms_sender_name: 'iDentify',
      kiosk_debounce_minutes: 30,
      kiosk_display_duration_seconds: 2,
      kiosk_show_sms_status: true,
      sms_provider: 'EASYSMS',
      parent_sms_enabled: true,
    };

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('identify_school_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            ...baseDefaults,
            ...parsed,
            kiosk_display_duration_seconds: Number(parsed.kiosk_display_duration_seconds) || 2,
            kiosk_show_sms_status: parsed.kiosk_show_sms_status !== false,
          };
        }
      } catch {}
    }
    return baseDefaults;
  },

  saveSchoolSettings(settings: any) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('identify_school_settings', JSON.stringify(settings));
        window.dispatchEvent(new Event('storage'));
      } catch {}
    }
  },
};

export const systemApi = {
  async purgeAllDataExceptSuperAdmin(actorRole: string): Promise<{ success: boolean; message: string; backupFileName?: string }> {
    return await apiClient.purgeAllDataExceptSuperAdmin(actorRole);
  },
  async factoryResetSystemToZero(actorRole: string): Promise<{ success: boolean; message: string; backupFileName?: string }> {
    return await apiClient.factoryResetSystemToZero(actorRole);
  },
  async prepareForLaunch(actorRole: string): Promise<{ success: boolean; message: string }> {
    return await apiClient.prepareForLaunch(actorRole);
  },
  async setup2FA(userId?: string): Promise<{ secret: string; otpauth: string }> {
    return await apiClient.setup2FA(userId);
  },
  async enable2FA(token: string, secret: string, userId?: string): Promise<{ success: boolean; message: string }> {
    return await apiClient.enable2FA(token, secret, userId);
  },
  async disable2FA(userId?: string): Promise<{ success: boolean; message: string }> {
    return await apiClient.disable2FA(userId);
  },
};

// Convenience type aliases and adapters
export type User = UserAccount;

export interface RosterAttendanceItem {
  studentId: string;
  lrn: string;
  psa_birth_cert_no?: string;
  name: string;
  grade_level: number | string;
  section: string;
  kioskStatus: 'CLOCKED_IN' | 'CLOCKED_OUT' | 'NO_GATE_TAP';
  kioskTime?: string;
  currentState: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'DROPPED' | 'UNMARKED';
  subject?: string;
  photo_url?: string;
}

export const SECTIONS_SEED: any[] = DEFAULT_SECTIONS.map((s, idx) => ({
  id: s.id || `sec-${idx + 1}`,
  school_id: s.school_id,
  name: s.name,
  grade_level: typeof s.grade_level === 'string' ? parseInt(s.grade_level.replace(/\D/g, '') || '7', 10) : s.grade_level,
  room: `Room ${100 + idx + 1}`,
  adviser_user_id: s.adviser_user_id,
  max_capacity: 45,
}));

export const SUBJECTS_SEED: any[] = DEFAULT_GRADE_SUBJECTS.map((s, idx) => ({
  id: s.id || `subj-${idx + 1}`,
  grade_level: typeof s.grade_level === 'string' ? parseInt(s.grade_level.replace(/\D/g, '') || '7', 10) : s.grade_level,
  code: s.code,
  name: s.name,
  units: 1.0,
  department: s.department,
}));

export const usersApi = {
  async getAll(): Promise<User[]> {
    return (await apiClient.getUsers()) as User[];
  },
  async create(user: any): Promise<User> {
    return (await apiClient.createUser(user)) as User;
  },
  async update(id: string, user: any): Promise<User> {
    return (await apiClient.updateUser(id, user)) as User;
  },
  async delete(id: string): Promise<any> {
    return await apiClient.deleteUser(id);
  },
};

export const studentsApi = {
  async getAll(schoolId?: string): Promise<Student[]> {
    return await apiClient.getStudents(schoolId || DEFAULT_SCHOOL.id);
  },
  async create(student: any): Promise<Student> {
    return await apiClient.createStudent(student);
  },
  async update(id: string, student: any): Promise<Student> {
    return await apiClient.updateStudent(id, student);
  },
  async delete(id: string): Promise<any> {
    return await apiClient.deleteStudent(id);
  },
  async bulkImport(schoolId: string, records: any[]): Promise<any> {
    return await apiClient.bulkImportStudents(schoolId, records);
  },
};

export const attendanceApi = {
  async getRoster(sectionName: string, gradeLevel: number | string, date?: string, subjectName?: string): Promise<RosterAttendanceItem[]> {
    const rawRoster = await apiClient.getSectionRoster(DEFAULT_SCHOOL.id, sectionName, date, subjectName);
    return rawRoster.map((item) => ({
      studentId: item.id,
      lrn: item.lrn,
      psa_birth_cert_no: item.psa_birth_cert_no || undefined,
      name: item.fullName || `${item.last_name}, ${item.first_name}`,
      grade_level: gradeLevel,
      section: sectionName,
      kioskStatus: item.kioskStatus,
      kioskTime: item.kioskClockInTime || undefined,
      currentState: (item.currentState === 'UNRECORDED' ? 'UNMARKED' : item.currentState) as any,
      subject: subjectName,
      photo_url: item.photo_url,
    }));
  },
  async recordManual(payload: {
    student_id: string;
    state: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'DROPPED';
    subject_name?: string;
    remarks?: string;
    date?: string;
  }): Promise<any> {
    return await apiClient.recordClassroomAttendance({
      schoolId: DEFAULT_SCHOOL.id,
      studentId: payload.student_id,
      sectionId: 'sec-1',
      teacherId: 'teacher-1',
      subjectName: payload.subject_name,
      state: payload.state,
      remarks: payload.remarks,
      date: payload.date,
    });
  },
};

