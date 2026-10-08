import { DatabaseService } from '../../config/database.service';
export interface SmsDispatchPayload {
    schoolId: string;
    studentId: string;
    attendanceLogId?: string;
    recipientPhone: string;
    studentName: string;
    schoolName: string;
    eventType: 'CLOCK_IN' | 'CLOCK_OUT';
    timestamp: string;
}
export interface SmsSendResult {
    provider: string;
    recipientPhone: string;
    message: string;
    status: 'SENT' | 'FAILED' | 'QUEUED';
    providerMessageId?: string;
    error?: string;
}
export declare class SmsService {
    private readonly db;
    private readonly logger;
    private readonly provider;
    constructor(db: DatabaseService);
    formatMessage(studentName: string, eventType: 'CLOCK_IN' | 'CLOCK_OUT', schoolName: string, time: string): string;
    sendSms(payload: SmsDispatchPayload): Promise<SmsSendResult>;
    sendViaEasySms(recipient: string, message: string, customApiKey?: string, customSenderName?: string): Promise<SmsSendResult>;
    private sendViaSemaphore;
    private sendViaPhilSms;
    private logSms;
}
