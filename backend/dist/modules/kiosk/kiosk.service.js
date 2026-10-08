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
var KioskService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KioskService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../config/database.service");
const students_service_1 = require("../students/students.service");
const sms_service_1 = require("../sms/sms.service");
const audit_service_1 = require("../audit/audit.service");
const ioredis_1 = require("ioredis");
let KioskService = KioskService_1 = class KioskService {
    constructor(db, studentsService, smsService, audit) {
        this.db = db;
        this.studentsService = studentsService;
        this.smsService = smsService;
        this.audit = audit;
        this.logger = new common_1.Logger(KioskService_1.name);
        this.redisClient = null;
        this.localDebounceCache = new Map();
        this.initRedis();
    }
    initRedis() {
        try {
            const host = process.env.REDIS_HOST || 'localhost';
            const port = Number(process.env.REDIS_PORT) || 6379;
            this.redisClient = new ioredis_1.default({
                host,
                port,
                maxRetriesPerRequest: 1,
                retryStrategy: () => null,
                connectTimeout: 1000,
                lazyConnect: true,
            });
            this.redisClient.on('error', (err) => {
                this.redisClient = null;
            });
            this.redisClient.connect().catch(() => {
                this.redisClient = null;
            });
        }
        catch {
            this.redisClient = null;
        }
    }
    async processScan(input, clientIp) {
        const now = new Date();
        const pad = (n) => (n < 10 ? '0' + n : String(n));
        const hours = now.getHours();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        const timeStr = `${pad(hours12)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${ampm}`;
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const usTimestampStr = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} ${timeStr}`;
        const dateStr = now.toISOString().split('T')[0];
        const student = await this.studentsService.findByTokenUid(input.schoolId, input.tokenUid);
        if (!student) {
            throw new common_1.NotFoundException(`No enrolled student found matching token '${input.tokenUid}'.`);
        }
        let schoolName = 'DepEd High School';
        try {
            if (this.db.isUsingPostgres()) {
                const sRes = await this.db.query('SELECT name FROM schools WHERE id = $1', [input.schoolId]);
                if (sRes.rows.length > 0)
                    schoolName = sRes.rows[0].name;
            }
            else {
                const sch = this.db.memoryStore.schools.find((s) => s.id === input.schoolId);
                if (sch)
                    schoolName = sch.name;
            }
        }
        catch { }
        const cacheKey = `kiosk_tap:${input.schoolId}:${student.id}:${dateStr}`;
        let firstTapTimestamp = null;
        let existingStatus = null;
        if (this.redisClient && this.redisClient.status === 'ready') {
            try {
                const cached = await this.redisClient.get(cacheKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    firstTapTimestamp = parsed.firstTapTime;
                    existingStatus = parsed.lastEventType;
                }
            }
            catch (e) {
                this.logger.warn(`Redis read error: ${e.message}`);
            }
        }
        if (firstTapTimestamp === null) {
            const local = this.localDebounceCache.get(cacheKey);
            if (local) {
                firstTapTimestamp = local.firstTapTime;
                existingStatus = local.lastEventType;
            }
        }
        const currentEpoch = now.getTime();
        let status;
        let isDebounced = false;
        let minutesFromFirstTap = 0;
        let triggerSms = false;
        if (!firstTapTimestamp) {
            status = 'CLOCK_IN';
            minutesFromFirstTap = 0;
            triggerSms = true;
            const cacheVal = { firstTapTime: currentEpoch, lastEventType: 'CLOCK_IN', lastTapTime: currentEpoch };
            if (this.redisClient && this.redisClient.status === 'ready') {
                await this.redisClient.set(cacheKey, JSON.stringify(cacheVal), 'EX', 86400);
            }
            this.localDebounceCache.set(cacheKey, cacheVal);
        }
        else {
            const elapsedMinutes = Math.floor((currentEpoch - firstTapTimestamp) / (1000 * 60));
            minutesFromFirstTap = elapsedMinutes;
            if (existingStatus === 'CLOCK_OUT') {
                status = 'DEBOUNCED';
                isDebounced = true;
                triggerSms = false;
            }
            else if (elapsedMinutes < 30) {
                status = 'DEBOUNCED';
                isDebounced = true;
                triggerSms = false;
            }
            else {
                status = 'CLOCK_OUT';
                triggerSms = true;
                const cacheVal = { firstTapTime: firstTapTimestamp, lastEventType: 'CLOCK_OUT', lastTapTime: currentEpoch };
                if (this.redisClient && this.redisClient.status === 'ready') {
                    await this.redisClient.set(cacheKey, JSON.stringify(cacheVal), 'EX', 86400);
                }
                this.localDebounceCache.set(cacheKey, cacheVal);
            }
        }
        const attendanceLogId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const eventTypeForDb = status === 'DEBOUNCED' ? 'CLOCK_IN' : status;
        if (this.db.isUsingPostgres()) {
            await this.db.query(`INSERT INTO attendance_logs (
          id, school_id, student_id, event_type, attendance_date, timestamp,
          kiosk_station_id, scanned_token_uid, state, is_debounced_duplicate,
          minutes_from_first_tap
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
                attendanceLogId,
                input.schoolId,
                student.id,
                eventTypeForDb,
                dateStr,
                now.toISOString(),
                input.kioskStationId || 'MAIN_GATE_KIOSK_1',
                input.tokenUid,
                'PRESENT',
                isDebounced,
                minutesFromFirstTap,
            ]);
        }
        else {
            this.db.memoryStore.attendance_logs.push({
                id: attendanceLogId,
                school_id: input.schoolId,
                student_id: student.id,
                event_type: eventTypeForDb,
                attendance_date: dateStr,
                timestamp: now.toISOString(),
                kiosk_station_id: input.kioskStationId || 'MAIN_GATE_KIOSK_1',
                scanned_token_uid: input.tokenUid,
                state: 'PRESENT',
                is_debounced_duplicate: isDebounced,
                minutes_from_first_tap: minutesFromFirstTap,
                created_at: now.toISOString(),
            });
        }
        let smsSent = false;
        if (triggerSms && student.primary_sms_phone) {
            this.smsService
                .sendSms({
                schoolId: input.schoolId,
                studentId: student.id,
                attendanceLogId,
                recipientPhone: student.primary_sms_phone,
                studentName: `${student.first_name} ${student.last_name}`,
                schoolName,
                eventType: status,
                timestamp: usTimestampStr,
            })
                .catch((e) => this.logger.error(`SMS dispatch failed: ${e.message}`));
            smsSent = true;
        }
        const fullName = `${student.first_name} ${student.middle_name ? student.middle_name[0] + '.' : ''} ${student.last_name} ${student.extension_name || ''}`.trim();
        return {
            success: true,
            status,
            message: status === 'CLOCK_IN'
                ? `Welcome to ${schoolName}! Clocked IN at ${usTimestampStr}.`
                : status === 'CLOCK_OUT'
                    ? `Goodbye! Safely Clocked OUT at ${usTimestampStr}.`
                    : existingStatus === 'CLOCK_OUT'
                        ? `Already Clocked OUT. Duplicate tap ignored.`
                        : `Already Clocked IN (${minutesFromFirstTap} min ago). Multi-tap debounced.`,
            student: {
                id: student.id,
                lrn: student.lrn,
                fullName,
                gradeLevel: student.grade_level,
                sectionName: student.section_name || 'Regular',
                photoUrl: student.photo_url || '/avatars/student-default.svg',
            },
            eventTimestamp: usTimestampStr,
            isDebounced,
            minutesFromFirstTap,
            smsDispatched: smsSent,
        };
    }
};
exports.KioskService = KioskService;
exports.KioskService = KioskService = KioskService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        students_service_1.StudentsService,
        sms_service_1.SmsService,
        audit_service_1.AuditService])
], KioskService);
//# sourceMappingURL=kiosk.service.js.map