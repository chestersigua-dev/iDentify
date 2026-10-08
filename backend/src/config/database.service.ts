import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool, PoolClient, QueryResult } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;
  private isPostgresConnected = false;

  // In-memory data store fallback if Postgres is temporarily unreachable during standalone local runs
  public memoryStore: Record<string, any[]> = {
    schools: [],
    users: [],
    sections: [],
    students: [],
    student_tokens: [],
    attendance_logs: [],
    classroom_sessions: [],
    sms_logs: [],
    audit_logs: [],
  };

  async onModuleInit() {
    await this.initDatabase();
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  private async initDatabase() {
    const connectionString =
      process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USER || 'identify_user'}:${process.env.DB_PASSWORD || 'identify_secure_pass_2026'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'identify_saas_db'}?schema=public`;

    try {
      this.pool = new Pool({
        connectionString,
        connectionTimeoutMillis: 3000,
        idleTimeoutMillis: 10000,
        max: 20,
      });

      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      this.isPostgresConnected = true;
      this.logger.log('Successfully connected to PostgreSQL with Row-Level Security.');
    } catch (err: any) {
      this.isPostgresConnected = false;
      this.logger.warn(
        `PostgreSQL not reachable at ${connectionString}. Active in-memory fallback enabled: ${err.message}`,
      );
      this.seedInMemory();
    }
  }

  /**
   * Executes a database query with tenant RLS session context set.
   * If schoolId is provided, SET LOCAL app.current_school_id = schoolId is executed.
   */
  async queryWithTenant<T = any>(
    schoolId: string | null,
    text: string,
    params?: any[],
  ): Promise<QueryResult<T>> {
    if (this.isPostgresConnected && this.pool) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        if (schoolId) {
          await client.query('SELECT set_config($1, $2, true)', [
            'app.current_school_id',
            schoolId,
          ]);
        } else {
          await client.query('SELECT set_config($1, $2, true)', [
            'app.current_school_id',
            '',
          ]);
        }
        const result = await client.query<T>(text, params);
        await client.query('COMMIT');
        return result;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } else {
      // Memory store query simulation
      return this.simulateQuery<T>(text, params, schoolId);
    }
  }

  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    return this.queryWithTenant<T>(null, text, params);
  }

  isUsingPostgres(): boolean {
    return this.isPostgresConnected;
  }

  private seedInMemory() {
    this.memoryStore.schools = [
      {
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
        is_active: true,
      },
    ];

    this.memoryStore.users = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        school_id: null,
        username: 'superadmin',
        email: 'superadmin@deped.gov.ph',
        password_hash: 'SuperAdmin123!',
        role: 'SUPER_ADMIN',
        position: 'System Administrator',
        first_name: 'Chester',
        last_name: 'Sigua',
        mobile_number: '+639171234567',
        photo_url: '/avatars/superadmin.png',
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
      },
      {
        id: '11111111-1111-1111-1111-000000000002',
        school_id: '11111111-1111-1111-1111-111111111111',
        username: 'principal.sawat',
        email: 'sawatelementaryschool@gmail.com',
        password_hash: 'Principal123!',
        role: 'PRINCIPAL',
        position: 'Principal I',
        first_name: 'Rico',
        last_name: 'Idos',
        mobile_number: '0905 669 1862',
        photo_url: '/avatars/principal-idos.png',
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
      },
      {
        id: '11111111-1111-1111-1111-000000000007',
        school_id: '11111111-1111-1111-1111-111111111111',
        username: 'ao.bautista',
        email: 'ao.bautista@sawat.deped.gov.ph',
        password_hash: 'AdminAssistant123!',
        role: 'ADMIN_ASSISTANT',
        position: 'Administrative Assistant II',
        first_name: 'Maria Elena',
        last_name: 'Bautista',
        mobile_number: '+639185551234',
        photo_url: '/avatars/ao-bautista.png',
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
      },
      {
        id: '11111111-1111-1111-1111-000000000003',
        school_id: '11111111-1111-1111-1111-111111111111',
        username: 'headteacher.jhs',
        email: 'ht.jhs@mabini.deped.gov.ph',
        password_hash: 'HeadTeacher123!',
        role: 'HEAD_TEACHER',
        position: 'Head Teacher II',
        first_name: 'Corazon',
        last_name: 'Aquino-Reyes',
        assigned_tier: 'JUNIOR_HIGH',
        mobile_number: '+639191234567',
        photo_url: '/avatars/ht-corazon.png',
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
      },
      {
        id: '11111111-1111-1111-1111-000000000008',
        school_id: '11111111-1111-1111-1111-111111111111',
        username: 'masterteacher.ramos',
        email: 'mt.ramos@mabini.deped.gov.ph',
        password_hash: 'MasterTeacher123!',
        role: 'MASTER_TEACHER',
        position: 'Master Teacher I',
        first_name: 'Danilo',
        last_name: 'Ramos, LPT',
        mobile_number: '+639198765432',
        photo_url: '/avatars/mt-ramos.png',
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
      },
      {
        id: '11111111-1111-1111-1111-000000000004',
        school_id: '11111111-1111-1111-1111-111111111111',
        username: 'teacher.santos',
        email: 'teacher.santos@mabini.deped.gov.ph',
        password_hash: 'Teacher123!',
        role: 'TEACHER',
        position: 'Teacher III',
        first_name: 'Maria Fe',
        last_name: 'Santos, LPT',
        mobile_number: '+639201234567',
        photo_url: '/avatars/teacher-santos.png',
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
      },
      {
        id: '11111111-1111-1111-1111-000000000009',
        school_id: '11111111-1111-1111-1111-111111111111',
        username: 'staff.dizon',
        email: 'staff.dizon@sawat.deped.gov.ph',
        password_hash: 'Staff123!',
        role: 'STAFF',
        position: 'Staff',
        first_name: 'Roberto',
        last_name: 'Dizon',
        mobile_number: '+639219998877',
        photo_url: '/avatars/staff-dizon.png',
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
      },
    ];

    this.memoryStore.sections = [
      {
        id: '33333333-3333-3333-3333-000000000001',
        school_id: '11111111-1111-1111-1111-111111111111',
        name: 'Bonifacio',
        grade_level: 'Grade 10',
        tier: 'JUNIOR_HIGH',
        adviser_user_id: '11111111-1111-1111-1111-000000000004',
        school_year: '2025-2026',
      },
      {
        id: '33333333-3333-3333-3333-000000000002',
        school_id: '11111111-1111-1111-1111-111111111111',
        name: 'Rizal',
        grade_level: 'Grade 10',
        tier: 'JUNIOR_HIGH',
        adviser_user_id: '11111111-1111-1111-1111-000000000004',
        school_year: '2025-2026',
      },
      {
        id: '33333333-3333-3333-3333-000000000003',
        school_id: '11111111-1111-1111-1111-111111111111',
        name: 'STEM - Archimedes',
        grade_level: 'Grade 11',
        tier: 'SENIOR_HIGH',
        shs_track: 'Academic Track',
        shs_strand: 'STEM',
        adviser_user_id: '11111111-1111-1111-1111-000000000004',
        school_year: '2025-2026',
      },
      {
        id: '33333333-3333-3333-3333-000000000004',
        school_id: '11111111-1111-1111-1111-111111111111',
        name: 'HUMSS - Recto',
        grade_level: 'Grade 12',
        tier: 'SENIOR_HIGH',
        shs_track: 'Academic Track',
        shs_strand: 'HUMSS',
        school_year: '2025-2026',
      },
    ];

    this.memoryStore.students = [
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
        current_house_no: 'Lot 14 Blk 3',
        current_street: 'Mabini St.',
        current_barangay: 'San Joaquin',
        current_municipality_city: 'Pasig City',
        current_province: 'Metro Manila',
        current_region: 'NCR',
        father_last_name: 'Dela Cruz',
        father_first_name: 'Juan',
        father_contact_no: '+639178881234',
        mother_maiden_last_name: 'Protacio',
        mother_first_name: 'Teodora',
        mother_contact_no: '+639178885678',
        primary_sms_recipient: 'MOTHER',
        primary_sms_phone: '+639178885678',
        grade_level: 'Grade 10',
        photo_url: '/avatars/student-1.svg',
        enrollment_status: 'ENROLLED',
        academic_standing: 'PASSING',
        general_average: 89.75,
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
        current_house_no: '45',
        current_street: 'Luna St.',
        current_barangay: 'San Joaquin',
        current_municipality_city: 'Pasig City',
        current_province: 'Metro Manila',
        current_region: 'NCR',
        father_last_name: 'Santos',
        father_first_name: 'Santiago',
        father_contact_no: '+639177771122',
        primary_sms_recipient: 'FATHER',
        primary_sms_phone: '+639177771122',
        grade_level: 'Grade 10',
        photo_url: '/avatars/student-2.svg',
        enrollment_status: 'ENROLLED',
        academic_standing: 'HONORS',
        general_average: 94.5,
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
        current_barangay: 'San Joaquin',
        current_municipality_city: 'Pasig City',
        current_province: 'Metro Manila',
        current_region: 'NCR',
        mother_maiden_last_name: 'Andaya',
        mother_first_name: 'Maria',
        primary_sms_phone: '+639176664455',
        grade_level: 'Grade 10',
        photo_url: '/avatars/student-3.svg',
        enrollment_status: 'ENROLLED',
        academic_standing: 'AT_RISK',
        general_average: 74.2,
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
        household_4ps_id: '4PS-NCR-PASIG-9931',
        current_barangay: 'San Joaquin',
        current_municipality_city: 'Pasig City',
        current_province: 'Metro Manila',
        current_region: 'NCR',
        primary_sms_phone: '+639175553344',
        grade_level: 'Grade 11',
        shs_track: 'Academic Track',
        shs_strand: 'STEM',
        photo_url: '/avatars/student-4.svg',
        enrollment_status: 'ENROLLED',
        academic_standing: 'PASSING',
        general_average: 91.0,
      },
    ];

    this.memoryStore.student_tokens = [
      {
        id: 'token-1',
        school_id: '11111111-1111-1111-1111-111111111111',
        student_id: '44444444-4444-4444-4444-000000000001',
        token_type: 'RFID',
        token_uid: '0008522301',
        is_active: true,
      },
      {
        id: 'token-2',
        school_id: '11111111-1111-1111-1111-111111111111',
        student_id: '44444444-4444-4444-4444-000000000002',
        token_type: 'RFID',
        token_uid: '0008522302',
        is_active: true,
      },
      {
        id: 'token-3',
        school_id: '11111111-1111-1111-1111-111111111111',
        student_id: '44444444-4444-4444-4444-000000000003',
        token_type: 'RFID',
        token_uid: '0008522303',
        is_active: true,
      },
      {
        id: 'token-4',
        school_id: '11111111-1111-1111-1111-111111111111',
        student_id: '44444444-4444-4444-4444-000000000004',
        token_type: 'RFID',
        token_uid: '0008522304',
        is_active: true,
      },
    ];

    this.memoryStore.attendance_logs = [
      {
        id: 'att-seed-01',
        school_id: '11111111-1111-1111-1111-111111111111',
        student_id: '44444444-4444-4444-4444-000000000001',
        event_type: 'CLOCK_IN',
        attendance_date: '2026-10-06',
        timestamp: '2026-10-06T07:18:22Z',
        state: 'PRESENT',
        subject: null,
        remarks: 'Main Entrance Turnstile #1 Tap In',
      },
      {
        id: 'att-seed-02',
        school_id: '11111111-1111-1111-1111-111111111111',
        student_id: '44444444-4444-4444-4444-000000000001',
        event_type: 'CLASSROOM_CHECK',
        attendance_date: '2026-10-06',
        timestamp: '2026-10-06T08:00:00Z',
        state: 'PRESENT',
        subject: 'English 10',
        remarks: 'SF2 DepEd Classroom Attendance recorded',
      },
      {
        id: 'att-seed-03',
        school_id: '11111111-1111-1111-1111-111111111111',
        student_id: '44444444-4444-4444-4444-000000000001',
        event_type: 'CLOCK_OUT',
        attendance_date: '2026-10-05',
        timestamp: '2026-10-05T16:35:10Z',
        state: 'PRESENT',
        subject: null,
        remarks: 'Main Exit Turnstile #2 Tap Out',
      },
      {
        id: 'att-seed-04',
        school_id: '11111111-1111-1111-1111-111111111111',
        student_id: '44444444-4444-4444-4444-000000000002',
        event_type: 'CLOCK_IN',
        attendance_date: '2026-10-06',
        timestamp: '2026-10-06T07:22:15Z',
        state: 'PRESENT',
        subject: null,
        remarks: 'Main Entrance Turnstile #1 Tap In',
      },
      {
        id: 'att-seed-05',
        school_id: '11111111-1111-1111-1111-111111111111',
        student_id: '44444444-4444-4444-4444-000000000002',
        event_type: 'CLOCK_OUT',
        attendance_date: '2026-10-05',
        timestamp: '2026-10-05T16:28:10Z',
        state: 'PRESENT',
        subject: null,
        remarks: 'Main Exit Turnstile #2 Tap Out',
      },
    ];

    this.memoryStore.audit_logs = [
      {
        id: 'audit-genesis',
        sequence_number: 1,
        school_id: '11111111-1111-1111-1111-111111111111',
        actor_id: '00000000-0000-0000-0000-000000000001',
        actor_role: 'SUPER_ADMIN',
        action: 'SYSTEM_BOOTSTRAP_PROVISION',
        target_entity: 'SYSTEM',
        target_id: 'ROOT',
        client_ip: '127.0.0.1',
        payload: { message: 'Genesis initial deployment with DepEd standards and SOC 2 hash-chain' },
        prev_hash: 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000',
        entry_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        created_at: new Date().toISOString(),
      },
    ];
  }

  private simulateQuery<T>(text: string, params: any[] = [], schoolId: string | null): QueryResult<T> {
    const lower = text.toLowerCase();

    // Emulate basic table selects
    let rows: any[] = [];
    if (lower.includes('from schools')) {
      rows = [...this.memoryStore.schools];
      if (params.length > 0 && lower.includes('id = $1')) {
        rows = rows.filter((s) => s.id === params[0] || s.slug === params[0]);
      } else if (params.length > 0 && lower.includes('slug = $1')) {
        rows = rows.filter((s) => s.slug === params[0]);
      }
    } else if (lower.includes('from users')) {
      rows = [...this.memoryStore.users];
      if (schoolId) rows = rows.filter((u) => u.school_id === schoolId || u.school_id === null);
      if (lower.includes('email = $1')) {
        rows = rows.filter((u) => u.email.toLowerCase() === params[0]?.toLowerCase());
      }
    } else if (lower.includes('from students')) {
      rows = [...this.memoryStore.students];
      if (schoolId) rows = rows.filter((st) => st.school_id === schoolId);
      if (lower.includes('lrn = $1')) {
        rows = rows.filter((st) => st.lrn === params[0]);
      }
    } else if (lower.includes('from sections')) {
      rows = [...this.memoryStore.sections];
      if (schoolId) rows = rows.filter((sec) => sec.school_id === schoolId);
    } else if (lower.includes('from student_tokens')) {
      rows = [...this.memoryStore.student_tokens];
      if (schoolId) rows = rows.filter((tok) => tok.school_id === schoolId);
      if (lower.includes('token_uid = $1')) {
        rows = rows.filter((tok) => tok.token_uid === params[0]);
      }
    } else if (lower.includes('from attendance_logs')) {
      rows = [...this.memoryStore.attendance_logs];
      if (schoolId) rows = rows.filter((a) => a.school_id === schoolId);
    } else if (lower.includes('from audit_logs')) {
      rows = [...this.memoryStore.audit_logs];
      if (schoolId) rows = rows.filter((al) => al.school_id === schoolId);
    }

    return {
      rows: rows as T[],
      command: 'SELECT',
      rowCount: rows.length,
      oid: 0,
      fields: [],
    };
  }
}
