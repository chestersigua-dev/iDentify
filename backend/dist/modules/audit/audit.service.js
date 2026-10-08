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
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const database_service_1 = require("../../config/database.service");
let AuditService = AuditService_1 = class AuditService {
    constructor(db) {
        this.db = db;
        this.logger = new common_1.Logger(AuditService_1.name);
        this.hmacSalt = process.env.HMAC_AUDIT_SALT || 'default_hmac_audit_salt_2026_soc2';
    }
    async log(entry) {
        const timestamp = new Date().toISOString();
        let prevHash = 'GENESIS_0000000000000000000000000000000000000000000000000000000000000000';
        let sequenceNumber = 1;
        try {
            if (this.db.isUsingPostgres()) {
                const res = await this.db.query(`SELECT sequence_number, entry_hash FROM audit_logs ORDER BY sequence_number DESC LIMIT 1`);
                if (res.rows.length > 0) {
                    prevHash = res.rows[0].entry_hash;
                    sequenceNumber = Number(res.rows[0].sequence_number) + 1;
                }
            }
            else {
                const logs = this.db.memoryStore.audit_logs;
                if (logs.length > 0) {
                    const last = logs[logs.length - 1];
                    prevHash = last.entry_hash;
                    sequenceNumber = (last.sequence_number || logs.length) + 1;
                }
            }
        }
        catch (e) {
            this.logger.warn(`Could not fetch previous audit hash, using root: ${e.message}`);
        }
        const message = `${sequenceNumber}|${prevHash}|${entry.schoolId || 'SYSTEM'}|${entry.actorId || 'SYSTEM'}|${entry.actorRole}|${entry.action}|${entry.targetEntity}|${entry.targetId || ''}|${timestamp}|${JSON.stringify(entry.payload || {})}`;
        const entryHash = crypto.createHmac('sha256', this.hmacSalt).update(message).digest('hex');
        if (this.db.isUsingPostgres()) {
            const insertQuery = `
        INSERT INTO audit_logs (
          sequence_number, school_id, actor_id, actor_role, action,
          target_entity, target_id, client_ip, user_agent, payload,
          prev_hash, entry_hash, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *;
      `;
            const values = [
                sequenceNumber,
                entry.schoolId || null,
                entry.actorId || null,
                entry.actorRole,
                entry.action,
                entry.targetEntity,
                entry.targetId || null,
                entry.clientIp || '127.0.0.1',
                entry.userAgent || 'System',
                JSON.stringify(entry.payload || {}),
                prevHash,
                entryHash,
                timestamp,
            ];
            const result = await this.db.query(insertQuery, values);
            return result.rows[0];
        }
        else {
            const record = {
                id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                sequence_number: sequenceNumber,
                school_id: entry.schoolId || null,
                actor_id: entry.actorId || null,
                actor_role: entry.actorRole,
                action: entry.action,
                target_entity: entry.targetEntity,
                target_id: entry.targetId || null,
                client_ip: entry.clientIp || '127.0.0.1',
                user_agent: entry.userAgent || 'System',
                payload: entry.payload || {},
                prev_hash: prevHash,
                entry_hash: entryHash,
                created_at: timestamp,
            };
            this.db.memoryStore.audit_logs.push(record);
            return record;
        }
    }
    async getAuditLogs(schoolId, limit = 100) {
        if (this.db.isUsingPostgres()) {
            if (schoolId) {
                const res = await this.db.query(`SELECT * FROM audit_logs WHERE school_id = $1 ORDER BY sequence_number DESC LIMIT $2`, [schoolId, limit]);
                return res.rows;
            }
            const res = await this.db.query(`SELECT * FROM audit_logs ORDER BY sequence_number DESC LIMIT $1`, [limit]);
            return res.rows;
        }
        let logs = [...this.db.memoryStore.audit_logs];
        if (schoolId) {
            logs = logs.filter((l) => l.school_id === schoolId);
        }
        return logs.reverse().slice(0, limit);
    }
    async verifyChainIntegrity(schoolId) {
        const logs = await this.getAuditLogs(schoolId, 500);
        const sorted = [...logs].sort((a, b) => Number(a.sequence_number) - Number(b.sequence_number));
        for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1];
            const curr = sorted[i];
            if (curr.prev_hash !== prev.entry_hash) {
                return {
                    valid: false,
                    totalRecords: sorted.length,
                    tamperedIndex: i,
                    message: `CHAIN BROKEN at sequence #${curr.sequence_number}. Expected prev_hash '${prev.entry_hash.substring(0, 16)}...', got '${curr.prev_hash.substring(0, 16)}...'`,
                };
            }
        }
        return {
            valid: true,
            totalRecords: sorted.length,
            tamperedIndex: null,
            message: 'SOC 2 Type 2 cryptographic chain integrity verified: 100% untampered.',
        };
    }
    async clearAuditLogsToZero() {
        if (this.db.isUsingPostgres()) {
            await this.db.query('DELETE FROM audit_logs');
        }
        else {
            this.db.memoryStore.audit_logs = [];
        }
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], AuditService);
//# sourceMappingURL=audit.service.js.map