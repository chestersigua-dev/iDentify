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
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../config/database.service");
let SmsService = SmsService_1 = class SmsService {
    constructor(db) {
        this.db = db;
        this.logger = new common_1.Logger(SmsService_1.name);
        this.provider = (process.env.SMS_PROVIDER || 'MOCK').toUpperCase();
    }
    formatMessage(studentName, eventType, schoolName, time) {
        const action = eventType === 'CLOCK_IN' ? 'IN' : 'OUT';
        return `[iDentify DepEd Notice] ${studentName} has safely clocked ${action} at ${schoolName} at ${time}.`;
    }
    async sendSms(payload) {
        const messageBody = this.formatMessage(payload.studentName, payload.eventType, payload.schoolName, payload.timestamp);
        let result;
        if (this.provider === 'EASYSMS') {
            result = await this.sendViaEasySms(payload.recipientPhone, messageBody);
        }
        else if (this.provider === 'SEMAPHORE') {
            result = await this.sendViaSemaphore(payload.recipientPhone, messageBody);
        }
        else if (this.provider === 'PHILSMS') {
            result = await this.sendViaPhilSms(payload.recipientPhone, messageBody);
        }
        else {
            result = {
                provider: 'MOCK',
                recipientPhone: payload.recipientPhone,
                message: messageBody,
                status: 'SENT',
                providerMessageId: `mock-msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            };
            this.logger.log(`[SMS MOCK DISPATCH] Sent to ${payload.recipientPhone}: "${messageBody}"`);
        }
        await this.logSms(payload, result);
        return result;
    }
    async sendViaEasySms(recipient, message, customApiKey, customSenderName) {
        const apiKey = customApiKey || process.env.EASYSMS_API_KEY || process.env.EASYSENDSMS_API_KEY;
        const senderName = customSenderName || process.env.EASYSMS_SENDER_NAME || 'iDentify';
        let formattedPhone = recipient.replace(/[^0-9+]/g, '');
        if (formattedPhone.startsWith('09')) {
            formattedPhone = '63' + formattedPhone.slice(1);
        }
        else if (formattedPhone.startsWith('+63')) {
            formattedPhone = formattedPhone.slice(1);
        }
        try {
            const res = await fetch('https://restapi.easysendsms.app/v1/rest/sms/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': apiKey || '',
                },
                body: JSON.stringify({
                    from: senderName,
                    to: formattedPhone,
                    text: message,
                }),
            });
            const data = await res.json().catch(() => ({}));
            return {
                provider: 'EASYSMS',
                recipientPhone: recipient,
                message,
                status: res.ok ? 'SENT' : 'FAILED',
                providerMessageId: data?.message_id || data?.id || data?.batch_id || 'easysms-ack',
                error: !res.ok ? (data?.message || data?.error || `HTTP ${res.status}`) : undefined,
            };
        }
        catch (e) {
            this.logger.error(`EasySMS dispatch failed: ${e.message}`);
            return {
                provider: 'EASYSMS',
                recipientPhone: recipient,
                message,
                status: 'FAILED',
                error: e.message,
            };
        }
    }
    async sendViaSemaphore(recipient, message) {
        const apiKey = process.env.SEMAPHORE_API_KEY;
        const senderName = process.env.SEMAPHORE_SENDER_NAME || 'iDentify';
        try {
            const res = await fetch('https://api.semaphore.co/api/v4/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apikey: apiKey,
                    number: recipient,
                    message,
                    sendername: senderName,
                }),
            });
            const data = await res.json();
            return {
                provider: 'SEMAPHORE',
                recipientPhone: recipient,
                message,
                status: res.ok ? 'SENT' : 'FAILED',
                providerMessageId: Array.isArray(data) ? data[0]?.message_id : 'semaphore-ack',
            };
        }
        catch (e) {
            this.logger.error(`Semaphore SMS dispatch failed: ${e.message}`);
            return {
                provider: 'SEMAPHORE',
                recipientPhone: recipient,
                message,
                status: 'FAILED',
                error: e.message,
            };
        }
    }
    async sendViaPhilSms(recipient, message) {
        const token = process.env.PHILSMS_API_TOKEN;
        const senderId = process.env.PHILSMS_SENDER_ID || 'iDentify';
        try {
            const res = await fetch('https://dashboard.philsms.com/api/v3/sms/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    recipient,
                    sender_id: senderId,
                    type: 'plain',
                    message,
                }),
            });
            const data = await res.json();
            return {
                provider: 'PHILSMS',
                recipientPhone: recipient,
                message,
                status: data?.status === 'success' ? 'SENT' : 'FAILED',
                providerMessageId: data?.data?.uid,
            };
        }
        catch (e) {
            this.logger.error(`PhilSMS dispatch failed: ${e.message}`);
            return {
                provider: 'PHILSMS',
                recipientPhone: recipient,
                message,
                status: 'FAILED',
                error: e.message,
            };
        }
    }
    async logSms(payload, result) {
        if (this.db.isUsingPostgres()) {
            await this.db.query(`INSERT INTO sms_logs (
          school_id, student_id, attendance_log_id, provider,
          recipient_phone, message_body, status, provider_message_id,
          error_message, dispatched_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`, [
                payload.schoolId,
                payload.studentId,
                payload.attendanceLogId || null,
                result.provider,
                result.recipientPhone,
                result.message,
                result.status,
                result.providerMessageId || null,
                result.error || null,
            ]);
        }
        else {
            this.db.memoryStore.sms_logs.push({
                id: `sms-${Date.now()}`,
                school_id: payload.schoolId,
                student_id: payload.studentId,
                attendance_log_id: payload.attendanceLogId || null,
                provider: result.provider,
                recipient_phone: result.recipientPhone,
                message_body: result.message,
                status: result.status,
                provider_message_id: result.providerMessageId || null,
                error_message: result.error || null,
                dispatched_at: new Date().toISOString(),
            });
        }
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], SmsService);
//# sourceMappingURL=sms.service.js.map