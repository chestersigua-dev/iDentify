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
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../config/database.service");
const audit_service_1 = require("../audit/audit.service");
const bcrypt = require("bcrypt");
let UsersService = UsersService_1 = class UsersService {
    constructor(db, audit) {
        this.db = db;
        this.audit = audit;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async findAll(schoolId, role, excludeSuperAdmin) {
        if (this.db.isUsingPostgres()) {
            let query = `
        SELECT u.id, u.school_id, u.username, u.email, u.role, u.position, u.first_name, u.last_name,
               u.mobile_number, u.photo_url, u.assigned_tier, u.assigned_classes, u.rbac_permissions,
               u.is_two_factor_enabled, u.is_active, u.created_at, s.name as school_name, s.deped_school_id
        FROM users u
        LEFT JOIN schools s ON u.school_id = s.id
        WHERE 1=1
      `;
            const params = [];
            if (schoolId) {
                params.push(schoolId);
                query += ` AND u.school_id = $${params.length}`;
            }
            if (role) {
                params.push(role);
                query += ` AND u.role = $${params.length}`;
            }
            if (excludeSuperAdmin) {
                query += ` AND u.role != 'SUPER_ADMIN'`;
            }
            query += ` ORDER BY u.created_at DESC`;
            const res = await this.db.query(query, params);
            return res.rows;
        }
        let users = [...this.db.memoryStore.users];
        if (schoolId)
            users = users.filter((u) => u.school_id === schoolId);
        if (role)
            users = users.filter((u) => u.role === role);
        if (excludeSuperAdmin)
            users = users.filter((u) => u.role !== 'SUPER_ADMIN');
        return users.map((u) => {
            const sch = this.db.memoryStore.schools.find((s) => s.id === u.school_id);
            return {
                id: u.id,
                school_id: u.school_id,
                username: u.username,
                email: u.email,
                role: u.role,
                position: u.position || 'Teacher I',
                first_name: u.first_name,
                last_name: u.last_name,
                mobile_number: u.mobile_number,
                photo_url: u.photo_url || '/avatars/default-user.svg',
                assigned_tier: u.assigned_tier,
                assigned_classes: u.assigned_classes || [],
                rbac_permissions: u.rbac_permissions || {},
                is_two_factor_enabled: u.is_two_factor_enabled || false,
                is_email_verified: true,
                is_phone_verified: true,
                is_active: u.is_active !== false,
                created_at: u.created_at || new Date().toISOString(),
                school_name: sch?.name || 'DepEd Central Platform',
                deped_school_id: sch?.deped_school_id || 'CENTRAL',
            };
        });
    }
    async findById(id) {
        if (this.db.isUsingPostgres()) {
            const res = await this.db.query(`SELECT id, school_id, username, email, role, position, first_name, last_name,
                mobile_number, photo_url, assigned_tier, assigned_classes, rbac_permissions,
                is_two_factor_enabled, is_active, created_at
         FROM users WHERE id = $1`, [id]);
            if (res.rows.length === 0)
                throw new common_1.NotFoundException(`User with ID ${id} not found.`);
            return res.rows[0];
        }
        const user = this.db.memoryStore.users.find((u) => u.id === id);
        if (!user)
            throw new common_1.NotFoundException(`User with ID ${id} not found.`);
        return user;
    }
    async create(dto, actorId) {
        const password = dto.password || 'DepEdPass123!';
        const passwordHash = await bcrypt.hash(password, 10);
        const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const now = new Date().toISOString();
        if (this.db.isUsingPostgres()) {
            const q = `
        INSERT INTO users (
          id, school_id, username, email, password_hash, role, position,
          first_name, last_name, mobile_number, photo_url, assigned_tier,
          assigned_classes, rbac_permissions, is_two_factor_enabled, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, TRUE)
        RETURNING id, school_id, username, email, role, position, first_name, last_name,
                  mobile_number, photo_url, assigned_tier, assigned_classes, rbac_permissions,
                  is_two_factor_enabled, is_active, created_at;
      `;
            const values = [
                userId,
                dto.schoolId || null,
                dto.username.toLowerCase(),
                dto.email.toLowerCase(),
                passwordHash,
                dto.role,
                dto.position || 'Teacher I',
                dto.firstName,
                dto.lastName,
                dto.mobileNumber || null,
                dto.photoUrl || '/avatars/default-user.svg',
                dto.assignedTier || null,
                JSON.stringify(dto.assignedClasses || []),
                JSON.stringify(dto.rbacPermissions || {}),
                dto.isTwoFactorEnabled || false,
            ];
            const res = await this.db.query(q, values);
            await this.audit.log({
                schoolId: dto.schoolId || null,
                actorId,
                actorRole: 'SUPER_ADMIN',
                action: 'CREATE_USER',
                targetEntity: 'USER',
                targetId: userId,
                payload: { username: dto.username, email: dto.email, role: dto.role, position: dto.position },
            });
            return res.rows[0];
        }
        else {
            const newUser = {
                id: userId,
                school_id: dto.schoolId || null,
                username: dto.username.toLowerCase(),
                email: dto.email.toLowerCase(),
                password_hash: passwordHash,
                role: dto.role,
                position: dto.position || 'Teacher I',
                first_name: dto.firstName,
                last_name: dto.lastName,
                mobile_number: dto.mobileNumber || '+639170000000',
                photo_url: dto.photoUrl || '/avatars/default-user.svg',
                assigned_tier: dto.assignedTier || null,
                assigned_classes: dto.assignedClasses || [],
                rbac_permissions: dto.rbacPermissions || {},
                is_two_factor_enabled: dto.isTwoFactorEnabled || false,
                is_email_verified: true,
                is_phone_verified: true,
                is_active: true,
                created_at: now,
            };
            this.db.memoryStore.users.push(newUser);
            await this.audit.log({
                schoolId: dto.schoolId || null,
                actorId,
                actorRole: 'SUPER_ADMIN',
                action: 'CREATE_USER',
                targetEntity: 'USER',
                targetId: userId,
                payload: { username: dto.username, email: dto.email, role: dto.role, position: dto.position },
            });
            return newUser;
        }
    }
    async update(id, dto, actorId) {
        const existing = await this.findById(id);
        if (this.db.isUsingPostgres()) {
            const q = `
        UPDATE users SET
          first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          email = COALESCE($3, email),
          mobile_number = COALESCE($4, mobile_number),
          role = COALESCE($5, role),
          position = COALESCE($6, position),
          photo_url = COALESCE($7, photo_url),
          assigned_tier = COALESCE($8, assigned_tier),
          assigned_classes = COALESCE($9, assigned_classes),
          rbac_permissions = COALESCE($10, rbac_permissions),
          is_two_factor_enabled = COALESCE($11, is_two_factor_enabled),
          is_active = COALESCE($12, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $13
        RETURNING id, school_id, username, email, role, position, first_name, last_name,
                  mobile_number, photo_url, assigned_tier, assigned_classes, rbac_permissions,
                  is_two_factor_enabled, is_active;
      `;
            const res = await this.db.query(q, [
                dto.firstName,
                dto.lastName,
                dto.email,
                dto.mobileNumber,
                dto.role,
                dto.position,
                dto.photoUrl,
                dto.assignedTier,
                dto.assignedClasses ? JSON.stringify(dto.assignedClasses) : null,
                dto.rbacPermissions ? JSON.stringify(dto.rbacPermissions) : null,
                dto.isTwoFactorEnabled,
                dto.isActive,
                id,
            ]);
            await this.audit.log({
                schoolId: existing.school_id,
                actorId,
                actorRole: 'SUPER_ADMIN',
                action: 'UPDATE_USER',
                targetEntity: 'USER',
                targetId: id,
                payload: dto,
            });
            return res.rows[0];
        }
        else {
            const idx = this.db.memoryStore.users.findIndex((u) => u.id === id);
            if (idx !== -1) {
                this.db.memoryStore.users[idx] = {
                    ...this.db.memoryStore.users[idx],
                    first_name: dto.firstName || this.db.memoryStore.users[idx].first_name,
                    last_name: dto.lastName || this.db.memoryStore.users[idx].last_name,
                    email: dto.email || this.db.memoryStore.users[idx].email,
                    mobile_number: dto.mobileNumber || this.db.memoryStore.users[idx].mobile_number,
                    role: dto.role || this.db.memoryStore.users[idx].role,
                    position: dto.position || this.db.memoryStore.users[idx].position,
                    photo_url: dto.photoUrl || this.db.memoryStore.users[idx].photo_url,
                    assigned_tier: dto.assignedTier !== undefined ? dto.assignedTier : this.db.memoryStore.users[idx].assigned_tier,
                    assigned_classes: dto.assignedClasses !== undefined ? dto.assignedClasses : this.db.memoryStore.users[idx].assigned_classes,
                    rbac_permissions: dto.rbacPermissions !== undefined ? dto.rbacPermissions : this.db.memoryStore.users[idx].rbac_permissions,
                    is_two_factor_enabled: dto.isTwoFactorEnabled !== undefined ? dto.isTwoFactorEnabled : this.db.memoryStore.users[idx].is_two_factor_enabled,
                    is_active: dto.isActive !== undefined ? dto.isActive : this.db.memoryStore.users[idx].is_active,
                };
            }
            await this.audit.log({
                schoolId: existing.school_id,
                actorId,
                actorRole: 'SUPER_ADMIN',
                action: 'UPDATE_USER',
                targetEntity: 'USER',
                targetId: id,
                payload: dto,
            });
            return this.db.memoryStore.users[idx];
        }
    }
    async delete(id, actorId) {
        const existing = await this.findById(id);
        if (this.db.isUsingPostgres()) {
            await this.db.query('DELETE FROM users WHERE id = $1', [id]);
        }
        else {
            this.db.memoryStore.users = this.db.memoryStore.users.filter((u) => u.id !== id);
        }
        await this.audit.log({
            schoolId: existing.school_id,
            actorId,
            actorRole: 'SUPER_ADMIN',
            action: 'DELETE_USER',
            targetEntity: 'USER',
            targetId: id,
            payload: { deletedUsername: existing.username, role: existing.role },
        });
        return { success: true, message: `User ${existing.username} deleted successfully.` };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map