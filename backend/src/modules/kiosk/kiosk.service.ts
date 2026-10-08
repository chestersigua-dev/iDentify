import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../config/database.service';
import { StudentsService } from '../students/students.service';
import { SmsService } from '../sms/sms.service';
import { AuditService } from '../audit/audit.service';
import Redis from 'ioredis';

export interface KioskScanInput {
  schoolId: string;
  tokenUid: string; // RFID UID or scanned Barcode / QR string
  kioskStationId?: string;
}

export interface KioskScanResponse {
  success: boolean;
  status: 'CLOCK_IN' | 'CLOCK_OUT' | 'DEBOUNCED';
  message: string;
  student: {
    id: string;
    lrn: string;
    fullName: string;
    gradeLevel: string;
    sectionName: string;
    photoUrl: string;
  };
  eventTimestamp: string;
  isDebounced: boolean;
  minutesFromFirstTap: number;
  smsDispatched: boolean;
}

@Injectable()
export class KioskService {
  private readonly logger = new Logger(KioskService.name);
  private redisClient: Redis | null = null;
  // Local cache fallback for debounce tracking (Key: `${schoolId}:${studentId}:${dateString}`)
  private localDebounceCache: Map<string, { firstTapTime: number; lastEventType: string }> = new Map();

  constructor(
    private readonly db: DatabaseService,
    private readonly studentsService: StudentsService,
    private readonly smsService: SmsService,
    private readonly audit: AuditService,
  ) {
    this.initRedis();
  }

  private initRedis() {
    try {
      const host = process.env.REDIS_HOST || 'localhost';
      const port = Number(process.env.REDIS_PORT) || 6379;
      this.redisClient = new Redis({
        host,
        port,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Do not spam reconnects if offline
        connectTimeout: 1000,
        lazyConnect: true,
      });
      this.redisClient.on('error', (err) => {
        // Silently handle error and fallback to in-memory debounce map
        this.redisClient = null;
      });
      this.redisClient.connect().catch(() => {
        this.redisClient = null;
      });
    } catch {
      this.redisClient = null;
    }
  }

  /**
   * Kiosk Turnstile State Machine & 30-Minute Debounce Engine
   */
  async processScan(input: KioskScanInput, clientIp?: string): Promise<KioskScanResponse> {
    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));
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

    // 1. Identify student by RFID / QR token
    const student = await this.studentsService.findByTokenUid(input.schoolId, input.tokenUid);
    if (!student) {
      throw new NotFoundException(`No enrolled student found matching token '${input.tokenUid}'.`);
    }

    // Retrieve school branding info
    let schoolName = 'DepEd High School';
    try {
      if (this.db.isUsingPostgres()) {
        const sRes = await this.db.query('SELECT name FROM schools WHERE id = $1', [input.schoolId]);
        if (sRes.rows.length > 0) schoolName = sRes.rows[0].name;
      } else {
        const sch = this.db.memoryStore.schools.find((s) => s.id === input.schoolId);
        if (sch) schoolName = sch.name;
      }
    } catch {}

    // 2. State Machine Evaluation
    // Key: schoolId:studentId:dateStr
    const cacheKey = `kiosk_tap:${input.schoolId}:${student.id}:${dateStr}`;
    let firstTapTimestamp: number | null = null;
    let existingStatus: string | null = null;

    if (this.redisClient && this.redisClient.status === 'ready') {
      try {
        const cached = await this.redisClient.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          firstTapTimestamp = parsed.firstTapTime;
          existingStatus = parsed.lastEventType;
        }
      } catch (e: any) {
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
    let status: 'CLOCK_IN' | 'CLOCK_OUT' | 'DEBOUNCED';
    let isDebounced = false;
    let minutesFromFirstTap = 0;
    let triggerSms = false;

    if (!firstTapTimestamp) {
      // RULE 1: First tap of the day = Clock-In
      status = 'CLOCK_IN';
      minutesFromFirstTap = 0;
      triggerSms = true;

      const cacheVal = { firstTapTime: currentEpoch, lastEventType: 'CLOCK_IN', lastTapTime: currentEpoch };
      if (this.redisClient && this.redisClient.status === 'ready') {
        await this.redisClient.set(cacheKey, JSON.stringify(cacheVal), 'EX', 86400); // 24 hours
      }
      this.localDebounceCache.set(cacheKey, cacheVal);
    } else {
      const elapsedMinutes = Math.floor((currentEpoch - firstTapTimestamp) / (1000 * 60));
      minutesFromFirstTap = elapsedMinutes;

      if (existingStatus === 'CLOCK_OUT') {
        // Already clocked out earlier today
        status = 'DEBOUNCED';
        isDebounced = true;
        triggerSms = false;
      } else if (elapsedMinutes < 30) {
        // RULE 2: Tap within 30 minutes of first tap = multi-tap debounce event
        // Log event, maintain Clock-In status, prevent accidental double-tap at turnstile
        status = 'DEBOUNCED';
        isDebounced = true;
        triggerSms = false;
      } else {
        // RULE 3: Next tap executed after 30-minute window = Clock-Out
        status = 'CLOCK_OUT';
        triggerSms = true;

        const cacheVal = { firstTapTime: firstTapTimestamp, lastEventType: 'CLOCK_OUT', lastTapTime: currentEpoch };
        if (this.redisClient && this.redisClient.status === 'ready') {
          await this.redisClient.set(cacheKey, JSON.stringify(cacheVal), 'EX', 86400);
        }
        this.localDebounceCache.set(cacheKey, cacheVal);
      }
    }

    // 3. Persist to immutable attendance ledger
    const attendanceLogId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const eventTypeForDb = status === 'DEBOUNCED' ? 'CLOCK_IN' : status;

    if (this.db.isUsingPostgres()) {
      await this.db.query(
        `INSERT INTO attendance_logs (
          id, school_id, student_id, event_type, attendance_date, timestamp,
          kiosk_station_id, scanned_token_uid, state, is_debounced_duplicate,
          minutes_from_first_tap
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
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
        ],
      );
    } else {
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

    // 4. Asynchronous SMS dispatch to registered parent number
    let smsSent = false;
    if (triggerSms && student.primary_sms_phone) {
      // Async dispatch without blocking 2-second flash UI
      this.smsService
        .sendSms({
          schoolId: input.schoolId,
          studentId: student.id,
          attendanceLogId,
          recipientPhone: student.primary_sms_phone,
          studentName: `${student.first_name} ${student.last_name}`,
          schoolName,
          eventType: status as 'CLOCK_IN' | 'CLOCK_OUT',
          timestamp: usTimestampStr,
        })
        .catch((e) => this.logger.error(`SMS dispatch failed: ${e.message}`));
      smsSent = true;
    }

    const fullName = `${student.first_name} ${student.middle_name ? student.middle_name[0] + '.' : ''} ${student.last_name} ${student.extension_name || ''}`.trim();

    return {
      success: true,
      status,
      message:
        status === 'CLOCK_IN'
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
}
