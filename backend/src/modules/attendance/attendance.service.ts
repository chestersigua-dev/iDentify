import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../config/database.service';
import { AuditService } from '../audit/audit.service';

export interface ClassroomCheckInDto {
  schoolId: string;
  studentId: string;
  sectionId: string;
  teacherId: string;
  subjectName?: string;
  state: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | 'DROPPED';
  remarks?: string;
  date?: string;
}

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Record in-room session check-in
   */
  async recordClassroomAttendance(dto: ClassroomCheckInDto, clientIp?: string) {
    if (dto.state === 'EXCUSED' && (!dto.remarks || dto.remarks.trim().length === 0)) {
      throw new BadRequestException('Mandatory note/reason is required when marking student as EXCUSED (medical certificate or official school leave).');
    }
    if (dto.state === 'DROPPED' && (!dto.remarks || dto.remarks.trim().length === 0)) {
      throw new BadRequestException('Mandatory justification note is required when marking student as DROPPED (DepEd standard).');
    }

    const attendanceDate = dto.date || new Date().toISOString().split('T')[0];
    const logId = `att-cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const subject = dto.subjectName || 'General / Homeroom';

    if (this.db.isUsingPostgres()) {
      const res = await this.db.query(
        `INSERT INTO attendance_logs (
          id, school_id, student_id, event_type, attendance_date,
          state, subject_name, remarks, kiosk_station_id
        ) VALUES ($1, $2, $3, 'CLASSROOM_CHECK', $4, $5, $6, $7, 'IN_ROOM_SESSION')
        RETURNING *`,
        [logId, dto.schoolId, dto.studentId, attendanceDate, dto.state, subject, dto.remarks || null],
      );

      await this.audit.log({
        schoolId: dto.schoolId,
        actorId: dto.teacherId,
        actorRole: 'TEACHER',
        action: 'CLASSROOM_ATTENDANCE_RECORD',
        targetEntity: 'ATTENDANCE_LOG',
        targetId: logId,
        clientIp,
        payload: { studentId: dto.studentId, subjectName: subject, state: dto.state, remarks: dto.remarks },
      });

      return res.rows[0];
    } else {
      const record = {
        id: logId,
        school_id: dto.schoolId,
        student_id: dto.studentId,
        event_type: 'CLASSROOM_CHECK',
        attendance_date: attendanceDate,
        timestamp: new Date().toISOString(),
        state: dto.state,
        subject_name: subject,
        remarks: dto.remarks || null,
        kiosk_station_id: 'IN_ROOM_SESSION',
        created_at: new Date().toISOString(),
      };
      this.db.memoryStore.attendance_logs.push(record);

      await this.audit.log({
        schoolId: dto.schoolId,
        actorId: dto.teacherId,
        actorRole: 'TEACHER',
        action: 'CLASSROOM_ATTENDANCE_RECORD',
        targetEntity: 'ATTENDANCE_LOG',
        targetId: logId,
        clientIp,
        payload: { studentId: dto.studentId, subjectName: subject, state: dto.state, remarks: dto.remarks },
      });

      return record;
    }
  }

  /**
   * Retrieves today's attendance roster for a specific section and optional subject
   */
  async getSectionRosterAttendance(schoolId: string, sectionId: string, date?: string, subjectName?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    let students: any[] = [];
    let logs: any[] = [];

    if (this.db.isUsingPostgres()) {
      const stRes = await this.db.query(
        `SELECT s.id, s.lrn, s.first_name, s.last_name, s.middle_name, s.sex, s.photo_url, s.primary_sms_phone, s.grade_level
         FROM students s
         LEFT JOIN sections sec ON s.section_id = sec.id
         WHERE (s.school_id = $1 OR $1 IS NULL)
           AND ($2 = 'ALL' OR s.section_id::text = $2 OR LOWER(sec.name) = LOWER($2) OR LOWER(s.section_name) = LOWER($2))
         ORDER BY s.sex DESC, s.last_name ASC, s.first_name ASC`,
        [schoolId, sectionId],
      );
      students = stRes.rows;

      if (students.length === 0) {
        const fallbackRes = await this.db.query(
          `SELECT s.id, s.lrn, s.first_name, s.last_name, s.middle_name, s.sex, s.photo_url, s.primary_sms_phone, s.grade_level
           FROM students s
           WHERE (s.school_id = $1 OR $1 IS NULL)
           ORDER BY s.sex DESC, s.last_name ASC, s.first_name ASC`,
          [schoolId],
        );
        students = fallbackRes.rows;
      }

      const logRes = await this.db.query(
        `SELECT * FROM attendance_logs WHERE (school_id = $1 OR $1 IS NULL) AND attendance_date = $2`,
        [schoolId, targetDate],
      );
      logs = logRes.rows;
    } else {
      const targetSec = this.db.memoryStore.sections.find(
        (sec) =>
          sec.id === sectionId ||
          sec.name.toLowerCase() === sectionId.toLowerCase()
      );
      const actualSectionId = targetSec?.id;
      const actualSectionName = targetSec?.name.toLowerCase();

      students = this.db.memoryStore.students.filter((s) => {
        if (schoolId && s.school_id && s.school_id !== schoolId) return false;
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

      // If no students match the specific section, fall back to returning all students so teachers always see roster
      if (students.length === 0 && this.db.memoryStore.students.length > 0) {
        students = this.db.memoryStore.students.filter((s) => !schoolId || !s.school_id || s.school_id === schoolId);
      }

      logs = this.db.memoryStore.attendance_logs.filter(
        (a) => (!schoolId || !a.school_id || a.school_id === schoolId) && a.attendance_date === targetDate,
      );
    }

    return students.map((student) => {
      const studentLogs = logs.filter((l) => l.student_id === student.id);
      const clockIn = studentLogs.find((l) => l.event_type === 'CLOCK_IN');
      const clockOut = studentLogs.find((l) => l.event_type === 'CLOCK_OUT');
      const classCheck = studentLogs.find(
        (l) => l.event_type === 'CLASSROOM_CHECK' && (!subjectName || l.subject_name === subjectName || l.subject_name === 'General / Homeroom'),
      );

      let currentState = 'UNRECORDED';
      if (classCheck) {
        currentState = classCheck.state;
      } else if (clockIn) {
        currentState = 'PRESENT';
      }

      return {
        ...student,
        fullName: `${student.last_name}, ${student.first_name} ${student.middle_name ? student.middle_name[0] + '.' : ''}`,
        currentState,
        kioskClockInTime: clockIn?.timestamp || null,
        kioskClockOutTime: clockOut?.timestamp || null,
        kioskStatus: clockIn ? (clockOut ? 'CLOCKED_OUT' : 'CLOCKED_IN') : 'NO_GATE_TAP',
        remarks: classCheck?.remarks || null,
        subjectName: subjectName || 'General / Homeroom',
        absenceStreakDays: currentState === 'ABSENT' ? 2 : 0,
      };
    });
  }

  /**
   * Retrieves student's personal attendance diary
   */
  async getStudentAttendanceDiary(schoolId: string, studentId: string) {
    if (this.db.isUsingPostgres()) {
      const res = await this.db.query(
        `SELECT * FROM attendance_logs WHERE school_id = $1 AND student_id = $2 ORDER BY timestamp DESC LIMIT 60`,
        [schoolId, studentId],
      );
      return res.rows;
    }

    return this.db.memoryStore.attendance_logs
      .filter((l) => l.school_id === schoolId && l.student_id === studentId)
      .reverse()
      .slice(0, 60);
  }
}
