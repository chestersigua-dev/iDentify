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
var StudentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../config/database.service");
const audit_service_1 = require("../audit/audit.service");
let StudentsService = StudentsService_1 = class StudentsService {
    constructor(db, audit) {
        this.db = db;
        this.audit = audit;
        this.logger = new common_1.Logger(StudentsService_1.name);
    }
    async findAll(schoolId, sectionId, gradeLevel) {
        if (this.db.isUsingPostgres()) {
            let query = `
        SELECT s.*, sec.name as section_name, sec.grade_level as section_grade_level,
               tok.token_uid as active_rfid_uid
        FROM students s
        LEFT JOIN sections sec ON s.section_id = sec.id
        LEFT JOIN student_tokens tok ON s.id = tok.student_id AND tok.is_active = TRUE
        WHERE s.school_id = $1
      `;
            const params = [schoolId];
            if (sectionId) {
                params.push(sectionId);
                query += ` AND s.section_id = $${params.length}`;
            }
            if (gradeLevel) {
                params.push(gradeLevel);
                query += ` AND s.grade_level = $${params.length}`;
            }
            query += ` ORDER BY s.last_name ASC, s.first_name ASC`;
            const res = await this.db.query(query, params);
            return res.rows;
        }
        let students = this.db.memoryStore.students.filter((s) => s.school_id === schoolId);
        if (sectionId)
            students = students.filter((s) => s.section_id === sectionId);
        if (gradeLevel)
            students = students.filter((s) => s.grade_level === gradeLevel);
        return students.map((s) => {
            const sec = this.db.memoryStore.sections.find((x) => x.id === s.section_id);
            const tok = this.db.memoryStore.student_tokens.find((t) => t.student_id === s.id && t.is_active);
            return {
                ...s,
                section_name: sec?.name || 'Unassigned',
                section_grade_level: sec?.grade_level || s.grade_level,
                active_rfid_uid: tok?.token_uid || null,
            };
        });
    }
    async findByLrn(schoolId, lrn) {
        if (this.db.isUsingPostgres()) {
            const res = await this.db.query(`SELECT s.*, sec.name as section_name, tok.token_uid as active_rfid_uid
         FROM students s
         LEFT JOIN sections sec ON s.section_id = sec.id
         LEFT JOIN student_tokens tok ON s.id = tok.student_id AND tok.is_active = TRUE
         WHERE s.school_id = $1 AND s.lrn = $2`, [schoolId, lrn]);
            if (res.rows.length === 0)
                throw new common_1.NotFoundException(`Student with LRN ${lrn} not found.`);
            return res.rows[0];
        }
        const student = this.db.memoryStore.students.find((s) => s.school_id === schoolId && s.lrn === lrn);
        if (!student)
            throw new common_1.NotFoundException(`Student with LRN ${lrn} not found.`);
        const sec = this.db.memoryStore.sections.find((x) => x.id === student.section_id);
        const tok = this.db.memoryStore.student_tokens.find((t) => t.student_id === student.id && t.is_active);
        return {
            ...student,
            section_name: sec?.name || 'Unassigned',
            active_rfid_uid: tok?.token_uid || null,
        };
    }
    async findByTokenUid(schoolId, tokenUid) {
        if (this.db.isUsingPostgres()) {
            const res = await this.db.query(`SELECT s.*, sec.name as section_name, tok.token_uid
         FROM student_tokens tok
         JOIN students s ON tok.student_id = s.id
         LEFT JOIN sections sec ON s.section_id = sec.id
         WHERE tok.school_id = $1 AND tok.token_uid = $2 AND tok.is_active = TRUE`, [schoolId, tokenUid]);
            if (res.rows.length === 0)
                return null;
            return res.rows[0];
        }
        const token = this.db.memoryStore.student_tokens.find((t) => t.school_id === schoolId && t.token_uid.toUpperCase() === tokenUid.toUpperCase() && t.is_active);
        if (!token)
            return null;
        const student = this.db.memoryStore.students.find((s) => s.id === token.student_id);
        if (!student)
            return null;
        const sec = this.db.memoryStore.sections.find((x) => x.id === student.section_id);
        return {
            ...student,
            section_name: sec?.name || 'Unassigned',
            token_uid: token.token_uid,
        };
    }
    async assignRfidToken(schoolId, dto, actorId) {
        const student = await this.findByLrn(schoolId, dto.lrn);
        if (this.db.isUsingPostgres()) {
            await this.db.query(`UPDATE student_tokens SET is_active = FALSE, revoked_at = CURRENT_TIMESTAMP
         WHERE school_id = $1 AND (student_id = $2 OR token_uid = $3)`, [schoolId, student.id, dto.tokenUid]);
            const res = await this.db.query(`INSERT INTO student_tokens (school_id, student_id, token_type, token_uid, is_active)
         VALUES ($1, $2, $3, $4, TRUE) RETURNING *`, [schoolId, student.id, dto.tokenType || 'RFID', dto.tokenUid]);
            await this.audit.log({
                schoolId,
                actorId,
                actorRole: 'SUPER_ADMIN',
                action: 'ASSIGN_RFID_TOKEN',
                targetEntity: 'STUDENT_TOKEN',
                targetId: res.rows[0].id,
                payload: { lrn: dto.lrn, tokenUid: dto.tokenUid },
            });
            return res.rows[0];
        }
        else {
            this.db.memoryStore.student_tokens = this.db.memoryStore.student_tokens.map((t) => {
                if (t.school_id === schoolId && (t.student_id === student.id || t.token_uid === dto.tokenUid)) {
                    return { ...t, is_active: false, revoked_at: new Date().toISOString() };
                }
                return t;
            });
            const newToken = {
                id: `tok-${Date.now()}`,
                school_id: schoolId,
                student_id: student.id,
                token_type: dto.tokenType || 'RFID',
                token_uid: dto.tokenUid,
                is_active: true,
                issued_at: new Date().toISOString(),
            };
            this.db.memoryStore.student_tokens.push(newToken);
            await this.audit.log({
                schoolId,
                actorId,
                actorRole: 'SUPER_ADMIN',
                action: 'ASSIGN_RFID_TOKEN',
                targetEntity: 'STUDENT_TOKEN',
                targetId: newToken.id,
                payload: { lrn: dto.lrn, tokenUid: dto.tokenUid },
            });
            return newToken;
        }
    }
    async create(schoolId, data, actorId, actorRole = 'TEACHER') {
        if (!data.lrn || !/^\d{12}$/.test(data.lrn)) {
            throw new common_1.BadRequestException('Learner Reference Number (LRN) must be a 12-digit numeric identifier.');
        }
        const studentId = `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const student = {
            id: studentId,
            school_id: schoolId,
            section_id: data.section_id || null,
            lrn: data.lrn,
            psa_birth_cert_no: data.psa_birth_cert_no || null,
            last_name: data.last_name,
            first_name: data.first_name,
            middle_name: data.middle_name || null,
            extension_name: data.extension_name || null,
            birthdate: data.birthdate || '2010-01-01',
            age: data.age || 15,
            sex: data.sex || 'Male',
            mother_tongue: data.mother_tongue || 'Tagalog',
            ip_community: data.ip_community || null,
            is_4ps_beneficiary: !!data.is_4ps_beneficiary,
            household_4ps_id: data.household_4ps_id || null,
            has_disability: !!data.has_disability,
            disability_visual: !!data.disability_visual,
            disability_hearing: !!data.disability_hearing,
            disability_learning: !!data.disability_learning,
            disability_intellectual: !!data.disability_intellectual,
            disability_mobility: !!data.disability_mobility,
            disability_speech: !!data.disability_speech,
            disability_autism: !!data.disability_autism,
            disability_details: data.disability_details || null,
            current_house_no: data.current_house_no || '',
            current_street: data.current_street || '',
            current_sitio_purok: data.current_sitio_purok || '',
            current_barangay: data.current_barangay || 'Barangay 1',
            current_municipality_city: data.current_municipality_city || 'City',
            current_province: data.current_province || 'Province',
            current_region: data.current_region || 'NCR',
            current_zip_code: data.current_zip_code || '1000',
            permanent_address: data.permanent_address || '',
            father_last_name: data.father_last_name || '',
            father_first_name: data.father_first_name || '',
            father_contact_no: data.father_contact_no || '',
            mother_maiden_last_name: data.mother_maiden_last_name || '',
            mother_first_name: data.mother_first_name || '',
            mother_contact_no: data.mother_contact_no || '',
            guardian_last_name: data.guardian_last_name || '',
            guardian_first_name: data.guardian_first_name || '',
            guardian_relationship: data.guardian_relationship || '',
            primary_sms_phone: data.primary_sms_phone || '+639170000000',
            grade_level: data.grade_level || 'Grade 10',
            shs_track: data.shs_track || null,
            shs_strand: data.shs_strand || null,
            photo_url: data.photo_url || '/avatars/student-default.svg',
            enrollment_status: 'ENROLLED',
            academic_standing: data.academic_standing || 'PASSING',
            general_average: data.general_average || 88.0,
            created_at: new Date().toISOString(),
        };
        if (this.db.isUsingPostgres()) {
            const q = `
        INSERT INTO students (
          id, school_id, section_id, lrn, psa_birth_cert_no, last_name, first_name,
          middle_name, extension_name, birthdate, age, sex, mother_tongue, ip_community,
          is_4ps_beneficiary, household_4ps_id, has_disability, disability_visual,
          disability_hearing, disability_learning, disability_intellectual, disability_mobility,
          disability_speech, disability_autism, disability_details, current_house_no,
          current_street, current_sitio_purok, current_barangay, current_municipality_city,
          current_province, current_region, current_zip_code, permanent_address,
          father_last_name, father_first_name, father_contact_no, mother_maiden_last_name,
          mother_first_name, mother_contact_no, guardian_last_name, guardian_first_name,
          guardian_relationship, primary_sms_phone, grade_level, shs_track, shs_strand,
          photo_url, enrollment_status, academic_standing, general_average
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,
          $26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51
        ) RETURNING *;
      `;
            const values = Object.values(student).slice(0, 51);
            const res = await this.db.query(q, values);
            await this.audit.log({
                schoolId,
                actorId,
                actorRole,
                action: 'CREATE_STUDENT_BEEF',
                targetEntity: 'STUDENT',
                targetId: studentId,
                payload: { lrn: data.lrn, name: `${data.first_name} ${data.last_name}` },
            });
            return res.rows[0];
        }
        else {
            this.db.memoryStore.students.push(student);
            await this.audit.log({
                schoolId,
                actorId,
                actorRole,
                action: 'CREATE_STUDENT_BEEF',
                targetEntity: 'STUDENT',
                targetId: studentId,
                payload: { lrn: data.lrn, name: `${data.first_name} ${data.last_name}` },
            });
            return student;
        }
    }
    async update(id, data, actorId, actorRole = 'TEACHER') {
        if (this.db.isUsingPostgres()) {
            const res = await this.db.query(`UPDATE students SET
          last_name = COALESCE($1, last_name),
          first_name = COALESCE($2, first_name),
          primary_sms_phone = COALESCE($3, primary_sms_phone),
          grade_level = COALESCE($4, grade_level),
          section_id = COALESCE($5, section_id),
          academic_standing = COALESCE($6, academic_standing),
          general_average = COALESCE($7, general_average),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $8 RETURNING *`, [
                data.last_name,
                data.first_name,
                data.primary_sms_phone,
                data.grade_level,
                data.section_id,
                data.academic_standing,
                data.general_average,
                id,
            ]);
            if (res.rows.length === 0)
                throw new common_1.NotFoundException('Student not found');
            return res.rows[0];
        }
        else {
            const idx = this.db.memoryStore.students.findIndex((s) => s.id === id);
            if (idx === -1)
                throw new common_1.NotFoundException('Student not found');
            this.db.memoryStore.students[idx] = {
                ...this.db.memoryStore.students[idx],
                ...data,
            };
            return this.db.memoryStore.students[idx];
        }
    }
    async delete(id, actorId, actorRole = 'TEACHER') {
        if (this.db.isUsingPostgres()) {
            await this.db.query('DELETE FROM students WHERE id = $1', [id]);
        }
        else {
            this.db.memoryStore.students = this.db.memoryStore.students.filter((s) => s.id !== id);
        }
        return { success: true, message: 'Student record deleted.' };
    }
    async bulkImport(schoolId, records, actorId) {
        const imported = [];
        for (const r of records) {
            if (r.lrn) {
                const student = await this.create(schoolId, r, actorId, 'SUPER_ADMIN');
                imported.push(student);
            }
        }
        return {
            success: true,
            count: imported.length,
            records: imported,
        };
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = StudentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        audit_service_1.AuditService])
], StudentsService);
//# sourceMappingURL=students.service.js.map