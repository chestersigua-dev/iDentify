"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AttendanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../config/database.service");
const audit_service_1 = require("../audit/audit.service");
let AttendanceService = AttendanceService_1 = class AttendanceService {
    constructor(db, audit) {
        this.db = db;
        this.audit = audit;
        this.logger = new common_1.Logger(AttendanceService_1.name);
    }
    async recordClassroomAttendance(dto, clientIp) {
        if (dto.state === 'EXCUSED' && (!dto.remarks || dto.remarks.trim().length === 0)) {
            throw new common_1.BadRequestException('Mandatory note/reason is required when marking student as EXCUSED (medical certificate or official school leave).');
        }
        if (dto.state === 'DROPPED' && (!dto.remarks || dto.remarks.trim().length === 0)) {
            throw new common_1.BadRequestException('Mandatory justification note is required when marking student as DROPPED (DepEd standard).');
        }
        const attendanceDate = dto.date || new Date().toISOString().split('T')[0];
        const logId = `att-cls-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const subject = dto.subjectName || 'General / Homeroom';
        if (this.db.isUsingPostgres()) {
            const res = await this.db.query(`INSERT INTO attendance_logs (
          id, school_id, student_id, event_type, attendance_date,
          state, subject_name, remarks, kiosk_station_id
        ) VALUES ($1, $2, $3, 'CLASSROOM_CHECK', $4, $5, $6, $7, 'IN_ROOM_SESSION')
        RETURNING *`, [logId, dto.schoolId, dto.studentId, attendanceDate, dto.state, subject, dto.remarks || null]);
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
        }
        else {
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
    async getSectionRosterAttendance(schoolId, sectionId, date, subjectName) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        let students = [];
        let logs = [];
        if (this.db.isUsingPostgres()) {
            const stRes = await this.db.query(`SELECT s.id, s.lrn, s.first_name, s.last_name, s.middle_name, s.sex, s.photo_url, s.primary_sms_phone, s.grade_level
         FROM students s
         LEFT JOIN sections sec ON s.section_id = sec.id
         WHERE (s.school_id = $1 OR $1 IS NULL)
           AND ($2 = 'ALL' OR s.section_id::text = $2 OR LOWER(sec.name) = LOWER($2) OR LOWER(s.section_name) = LOWER($2))
         ORDER BY s.sex DESC, s.last_name ASC, s.first_name ASC`, [schoolId, sectionId]);
            students = stRes.rows;
            if (students.length === 0) {
                const fallbackRes = await this.db.query(`SELECT s.id, s.lrn, s.first_name, s.last_name, s.middle_name, s.sex, s.photo_url, s.primary_sms_phone, s.grade_level
           FROM students s
           WHERE (s.school_id = $1 OR $1 IS NULL)
           ORDER BY s.sex DESC, s.last_name ASC, s.first_name ASC`, [schoolId]);
                students = fallbackRes.rows;
            }
            const logRes = await this.db.query(`SELECT * FROM attendance_logs WHERE (school_id = $1 OR $1 IS NULL) AND attendance_date = $2`, [schoolId, targetDate]);
            logs = logRes.rows;
        }
        else {
            const targetSec = this.db.memoryStore.sections.find((sec) => sec.id === sectionId ||
                sec.name.toLowerCase() === sectionId.toLowerCase());
            const actualSectionId = targetSec?.id;
            const actualSectionName = targetSec?.name.toLowerCase();
            students = this.db.memoryStore.students.filter((s) => {
                if (schoolId && s.school_id && s.school_id !== schoolId)
                    return false;
                if (!sectionId || sectionId === 'ALL')
                    return true;
                const sSecId = s.section_id;
                const sSecName = (s.section_name || s.section || '').toLowerCase();
                return (sSecId === sectionId ||
                    sSecId === actualSectionId ||
                    sSecName === sectionId.toLowerCase() ||
                    (actualSectionName && sSecName === actualSectionName));
            });
            if (students.length === 0 && this.db.memoryStore.students.length > 0) {
                students = this.db.memoryStore.students.filter((s) => !schoolId || !s.school_id || s.school_id === schoolId);
            }
            logs = this.db.memoryStore.attendance_logs.filter((a) => (!schoolId || !a.school_id || a.school_id === schoolId) && a.attendance_date === targetDate);
        }
        return students.map((student) => {
            const studentLogs = logs.filter((l) => l.student_id === student.id);
            const clockIn = studentLogs.find((l) => l.event_type === 'CLOCK_IN');
            const clockOut = studentLogs.find((l) => l.event_type === 'CLOCK_OUT');
            const classCheck = studentLogs.find((l) => l.event_type === 'CLASSROOM_CHECK' && (!subjectName || l.subject_name === subjectName || l.subject_name === 'General / Homeroom'));
            let currentState = 'UNRECORDED';
            if (classCheck) {
                currentState = classCheck.state;
            }
            else if (clockIn) {
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
    async getStudentAttendanceDiary(schoolId, studentId) {
        if (this.db.isUsingPostgres()) {
            const res = await this.db.query(`SELECT * FROM attendance_logs WHERE school_id = $1 AND student_id = $2 ORDER BY timestamp DESC LIMIT 60`, [schoolId, studentId]);
            return res.rows;
        }
        return this.db.memoryStore.attendance_logs
            .filter((l) => l.school_id === schoolId && l.student_id === studentId)
            .reverse()
            .slice(0, 60);
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = AttendanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        audit_service_1.AuditService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map