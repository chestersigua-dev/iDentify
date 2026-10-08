package com.example.identify.database

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

class IdentifyDatabaseHelper(private val context: Context) :
    SQLiteOpenHelper(context, DATABASE_NAME, null, DATABASE_VERSION) {

    companion object {
        const val DATABASE_NAME = "identify_android.db"
        const val DATABASE_VERSION = 2
        private val DATE_FORMAT = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        private val ISO_FORMAT = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
        private val TIME_FORMAT = SimpleDateFormat("hh:mm:ss a", Locale.US)
    }

    override fun onCreate(db: SQLiteDatabase) {
        // 1. Schools table
        db.execSQL(
            """
            CREATE TABLE schools (
                id TEXT PRIMARY KEY,
                deped_school_id TEXT UNIQUE,
                slug TEXT UNIQUE,
                name TEXT NOT NULL,
                short_name TEXT,
                division TEXT,
                region TEXT,
                district TEXT,
                barangay TEXT,
                municipality_city TEXT,
                province TEXT,
                postal_code TEXT,
                contact_phone TEXT,
                contact_email TEXT,
                logo_url TEXT,
                primary_color TEXT,
                accent_color TEXT,
                school_head_name TEXT,
                school_head_title TEXT,
                is_active INTEGER DEFAULT 1
            )
            """.trimIndent()
        )

        // 2. Users table
        db.execSQL(
            """
            CREATE TABLE users (
                id TEXT PRIMARY KEY,
                school_id TEXT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL,
                position TEXT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                mobile_number TEXT,
                photo_url TEXT,
                assigned_tier TEXT,
                assigned_classes TEXT,
                rbac_permissions TEXT,
                active_rfid_uid TEXT,
                employee_number TEXT,
                plantilla_item_no TEXT,
                salary_grade TEXT,
                station TEXT,
                is_active INTEGER DEFAULT 1,
                two_factor_enabled INTEGER DEFAULT 0,
                created_at TEXT
            )
            """.trimIndent()
        )

        // 3. Sections table
        db.execSQL(
            """
            CREATE TABLE sections (
                id TEXT PRIMARY KEY,
                school_id TEXT,
                name TEXT NOT NULL,
                grade_level TEXT NOT NULL,
                tier TEXT,
                shs_track TEXT,
                shs_strand TEXT,
                adviser_user_id TEXT,
                school_year TEXT DEFAULT '2025-2026'
            )
            """.trimIndent()
        )

        // 4. Students table
        db.execSQL(
            """
            CREATE TABLE students (
                id TEXT PRIMARY KEY,
                school_id TEXT,
                section_id TEXT,
                lrn TEXT UNIQUE NOT NULL,
                psa_birth_cert_no TEXT,
                last_name TEXT NOT NULL,
                first_name TEXT NOT NULL,
                middle_name TEXT,
                extension_name TEXT,
                birthdate TEXT,
                age INTEGER,
                sex TEXT,
                mother_tongue TEXT,
                is_4ps_beneficiary INTEGER DEFAULT 0,
                household_4ps_id TEXT,
                current_house_no TEXT,
                current_street TEXT,
                current_barangay TEXT,
                current_municipality_city TEXT,
                current_province TEXT,
                father_name TEXT,
                mother_name TEXT,
                primary_sms_phone TEXT,
                grade_level TEXT,
                section_name TEXT,
                active_rfid_uid TEXT UNIQUE,
                photo_url TEXT,
                enrollment_status TEXT DEFAULT 'ENROLLED',
                academic_standing TEXT DEFAULT 'PASSING',
                general_average REAL DEFAULT 85.0
            )
            """.trimIndent()
        )

        // 5. Attendance Logs table
        db.execSQL(
            """
            CREATE TABLE attendance_logs (
                id TEXT PRIMARY KEY,
                school_id TEXT,
                student_id TEXT,
                user_id TEXT,
                event_type TEXT NOT NULL,
                attendance_date TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                state TEXT NOT NULL,
                subject TEXT,
                remarks TEXT,
                rfid_uid TEXT
            )
            """.trimIndent()
        )

        // 6. Audit Logs table with cryptographic hash chain
        db.execSQL(
            """
            CREATE TABLE audit_logs (
                sequence_number INTEGER PRIMARY KEY AUTOINCREMENT,
                id TEXT UNIQUE NOT NULL,
                school_id TEXT,
                actor_id TEXT,
                actor_role TEXT,
                action TEXT NOT NULL,
                target_entity TEXT,
                target_id TEXT,
                client_ip TEXT,
                payload TEXT,
                prev_hash TEXT,
                entry_hash TEXT,
                created_at TEXT NOT NULL
            )
            """.trimIndent()
        )

        // 7. System Settings
        db.execSQL(
            """
            CREATE TABLE system_settings (
                setting_key TEXT PRIMARY KEY,
                setting_value TEXT
            )
            """.trimIndent()
        )

        seedDatabase(db)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        db.execSQL("DROP TABLE IF EXISTS system_settings")
        db.execSQL("DROP TABLE IF EXISTS audit_logs")
        db.execSQL("DROP TABLE IF EXISTS attendance_logs")
        db.execSQL("DROP TABLE IF EXISTS students")
        db.execSQL("DROP TABLE IF EXISTS sections")
        db.execSQL("DROP TABLE IF EXISTS users")
        db.execSQL("DROP TABLE IF EXISTS schools")
        onCreate(db)
    }

    override fun onOpen(db: SQLiteDatabase) {
        super.onOpen(db)
        try {
            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS audit_logs (
                    sequence_number INTEGER PRIMARY KEY AUTOINCREMENT,
                    id TEXT UNIQUE NOT NULL,
                    school_id TEXT,
                    actor_id TEXT,
                    actor_role TEXT,
                    action TEXT NOT NULL,
                    target_entity TEXT,
                    target_id TEXT,
                    client_ip TEXT,
                    payload TEXT,
                    prev_hash TEXT,
                    entry_hash TEXT,
                    created_at TEXT NOT NULL
                )
                """.trimIndent()
            )
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun seedDatabase(db: SQLiteDatabase) {
        // Seed School
        val schoolValues = ContentValues().apply {
            put("id", "11111111-1111-1111-1111-111111111111")
            put("deped_school_id", "101692")
            put("slug", "sawat-es")
            put("name", "Sawat Elementary School")
            put("short_name", "Sawat ES")
            put("division", "Division of Pangasinan II")
            put("region", "Region I")
            put("district", "Urbiztondo District")
            put("barangay", "Sawat")
            put("municipality_city", "Urbiztondo")
            put("province", "Pangasinan")
            put("postal_code", "2414")
            put("contact_phone", "0905 669 1862")
            put("contact_email", "sawatelementaryschool@gmail.com")
            put("logo_url", "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150")
            put("primary_color", "#1e3a8a")
            put("accent_color", "#0ea5e9")
            put("school_head_name", "Dr. Rico Idos")
            put("school_head_title", "Principal I")
            put("is_active", 1)
        }
        db.insert("schools", null, schoolValues)

        // Seed Users
        val users = listOf(
            ContentValues().apply {
                put("id", "00000000-0000-0000-0000-000000000001")
                put("school_id", "")
                put("username", "superadmin")
                put("email", "superadmin@deped.gov.ph")
                put("password_hash", "SuperAdmin123!")
                put("role", "SUPER_ADMIN")
                put("position", "System Administrator")
                put("first_name", "Chester")
                put("last_name", "Sigua")
                put("mobile_number", "+639171234567")
                put("photo_url", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150")
                put("is_active", 1)
                put("two_factor_enabled", 1)
                put("created_at", ISO_FORMAT.format(Date()))
            },
            ContentValues().apply {
                put("id", "11111111-1111-1111-1111-000000000002")
                put("school_id", "11111111-1111-1111-1111-111111111111")
                put("username", "principal.sawat")
                put("email", "sawatelementaryschool@gmail.com")
                put("password_hash", "Principal123!")
                put("role", "PRINCIPAL")
                put("position", "Principal I")
                put("first_name", "Dr. Rico")
                put("last_name", "Idos")
                put("mobile_number", "0905 669 1862")
                put("photo_url", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150")
                put("active_rfid_uid", "0008522401")
                put("employee_number", "DEPED-1988201")
                put("is_active", 1)
                put("two_factor_enabled", 1)
                put("created_at", ISO_FORMAT.format(Date()))
            },
            ContentValues().apply {
                put("id", "11111111-1111-1111-1111-000000000004")
                put("school_id", "11111111-1111-1111-1111-111111111111")
                put("username", "teacher.santos")
                put("email", "teacher.santos@mabini.deped.gov.ph")
                put("password_hash", "Teacher123!")
                put("role", "TEACHER")
                put("position", "Teacher III")
                put("first_name", "Maria Fe")
                put("last_name", "Santos, LPT")
                put("mobile_number", "+639201234567")
                put("photo_url", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150")
                put("active_rfid_uid", "0008522405")
                put("employee_number", "DEPED-2018955")
                put("is_active", 1)
                put("two_factor_enabled", 0)
                put("created_at", ISO_FORMAT.format(Date()))
            }
        )
        for (u in users) db.insert("users", null, u)

        // Seed Sections
        val sections = listOf(
            ContentValues().apply {
                put("id", "33333333-3333-3333-3333-000000000001")
                put("school_id", "11111111-1111-1111-1111-111111111111")
                put("name", "Bonifacio")
                put("grade_level", "Grade 10")
                put("tier", "JUNIOR_HIGH")
                put("adviser_user_id", "11111111-1111-1111-1111-000000000004")
                put("school_year", "2025-2026")
            },
            ContentValues().apply {
                put("id", "33333333-3333-3333-3333-000000000002")
                put("school_id", "11111111-1111-1111-1111-111111111111")
                put("name", "Rizal")
                put("grade_level", "Grade 10")
                put("tier", "JUNIOR_HIGH")
                put("adviser_user_id", "11111111-1111-1111-1111-000000000004")
                put("school_year", "2025-2026")
            },
            ContentValues().apply {
                put("id", "33333333-3333-3333-3333-000000000003")
                put("school_id", "11111111-1111-1111-1111-111111111111")
                put("name", "STEM - Archimedes")
                put("grade_level", "Grade 11")
                put("tier", "SENIOR_HIGH")
                put("shs_track", "Academic")
                put("shs_strand", "STEM")
                put("school_year", "2025-2026")
            }
        )
        for (sec in sections) db.insert("sections", null, sec)

        // Seed Students
        val students = listOf(
            ContentValues().apply {
                put("id", "44444444-4444-4444-4444-000000000001")
                put("school_id", "11111111-1111-1111-1111-111111111111")
                put("section_id", "33333333-3333-3333-3333-000000000001")
                put("lrn", "109283746501")
                put("psa_birth_cert_no", "1029384756-PSA-2010")
                put("last_name", "Dela Cruz")
                put("first_name", "Juan")
                put("middle_name", "Protacio")
                put("extension_name", "Jr.")
                put("birthdate", "2010-06-19")
                put("age", 15)
                put("sex", "Male")
                put("mother_tongue", "Tagalog")
                put("is_4ps_beneficiary", 1)
                put("household_4ps_id", "4PS-PANG-8829")
                put("current_barangay", "Sawat")
                put("current_municipality_city", "Urbiztondo")
                put("current_province", "Pangasinan")
                put("father_name", "Juan Dela Cruz Sr.")
                put("mother_name", "Teodora Protacio")
                put("primary_sms_phone", "+639178885678")
                put("grade_level", "Grade 10")
                put("section_name", "Bonifacio")
                put("active_rfid_uid", "0008522301")
                put("photo_url", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150")
                put("enrollment_status", "ENROLLED")
                put("academic_standing", "PASSING")
                put("general_average", 89.75)
            },
            ContentValues().apply {
                put("id", "44444444-4444-4444-4444-000000000002")
                put("school_id", "11111111-1111-1111-1111-111111111111")
                put("section_id", "33333333-3333-3333-3333-000000000001")
                put("lrn", "109283746502")
                put("psa_birth_cert_no", "2039485761-PSA-2010")
                put("last_name", "Santos")
                put("first_name", "Maria Clara")
                put("middle_name", "Delos Reyes")
                put("extension_name", "")
                put("birthdate", "2010-08-12")
                put("age", 15)
                put("sex", "Female")
                put("mother_tongue", "Tagalog")
                put("is_4ps_beneficiary", 0)
                put("household_4ps_id", "")
                put("current_barangay", "Sawat")
                put("current_municipality_city", "Urbiztondo")
                put("current_province", "Pangasinan")
                put("father_name", "Santiago Santos")
                put("mother_name", "Pia Delos Reyes")
                put("primary_sms_phone", "+639177771122")
                put("grade_level", "Grade 10")
                put("section_name", "Bonifacio")
                put("active_rfid_uid", "0008522302")
                put("photo_url", "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150")
                put("enrollment_status", "ENROLLED")
                put("academic_standing", "HONORS")
                put("general_average", 94.50)
            },
            ContentValues().apply {
                put("id", "44444444-4444-4444-4444-000000000003")
                put("school_id", "11111111-1111-1111-1111-111111111111")
                put("section_id", "33333333-3333-3333-3333-000000000001")
                put("lrn", "109283746503")
                put("psa_birth_cert_no", "3948572019-PSA-2010")
                put("last_name", "Silang")
                put("first_name", "Diego")
                put("middle_name", "Andaya")
                put("extension_name", "")
                put("birthdate", "2010-01-20")
                put("age", 16)
                put("sex", "Male")
                put("mother_tongue", "Ilocano")
                put("is_4ps_beneficiary", 0)
                put("household_4ps_id", "")
                put("current_barangay", "Sawat")
                put("current_municipality_city", "Urbiztondo")
                put("current_province", "Pangasinan")
                put("father_name", "Emilio Silang")
                put("mother_name", "Gabriela Andaya")
                put("primary_sms_phone", "+639176664455")
                put("grade_level", "Grade 10")
                put("section_name", "Bonifacio")
                put("active_rfid_uid", "0008522303")
                put("photo_url", "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150")
                put("enrollment_status", "ENROLLED")
                put("academic_standing", "AT_RISK")
                put("general_average", 74.20)
            },
            ContentValues().apply {
                put("id", "44444444-4444-4444-4444-000000000004")
                put("school_id", "11111111-1111-1111-1111-111111111111")
                put("section_id", "33333333-3333-3333-3333-000000000003")
                put("lrn", "109283746504")
                put("psa_birth_cert_no", "4857291038-PSA-2009")
                put("last_name", "Mercado")
                put("first_name", "Josefa")
                put("middle_name", "Alonzo")
                put("extension_name", "")
                put("birthdate", "2009-04-10")
                put("age", 16)
                put("sex", "Female")
                put("mother_tongue", "Tagalog")
                put("is_4ps_beneficiary", 1)
                put("household_4ps_id", "4PS-PANG-8831")
                put("current_barangay", "Sawat")
                put("current_municipality_city", "Urbiztondo")
                put("current_province", "Pangasinan")
                put("father_name", "Francisco Mercado")
                put("mother_name", "Teodora Alonzo")
                put("primary_sms_phone", "+639175553344")
                put("grade_level", "Grade 11")
                put("section_name", "STEM - Archimedes")
                put("active_rfid_uid", "0008522304")
                put("photo_url", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150")
                put("enrollment_status", "ENROLLED")
                put("academic_standing", "PASSING")
                put("general_average", 91.00)
            }
        )
        for (st in students) db.insert("students", null, st)

        // Seed Attendance Logs
        val todayStr = DATE_FORMAT.format(Date())
        val attLogs = listOf(
            ContentValues().apply {
                put("id", "att-001")
                put("school_id", "11111111-1111-1111-1111-111111111111")
                put("student_id", "44444444-4444-4444-4444-000000000001")
                put("event_type", "CLOCK_IN")
                put("attendance_date", todayStr)
                put("timestamp", "${todayStr}T07:18:22Z")
                put("state", "PRESENT")
                put("remarks", "Main Entrance Turnstile #1 Tap In")
                put("rfid_uid", "0008522301")
            },
            ContentValues().apply {
                put("id", "att-002")
                put("school_id", "11111111-1111-1111-1111-111111111111")
                put("student_id", "44444444-4444-4444-4444-000000000002")
                put("event_type", "CLOCK_IN")
                put("attendance_date", todayStr)
                put("timestamp", "${todayStr}T07:22:15Z")
                put("state", "PRESENT")
                put("remarks", "Main Entrance Turnstile #1 Tap In")
                put("rfid_uid", "0008522302")
            }
        )
        for (al in attLogs) db.insert("attendance_logs", null, al)

        // Seed Genesis Audit Block
        val genesisAudit = ContentValues().apply {
            put("id", "audit-genesis-android")
            put("school_id", "11111111-1111-1111-1111-111111111111")
            put("actor_id", "00000000-0000-0000-0000-000000000001")
            put("actor_role", "SUPER_ADMIN")
            put("action", "SYSTEM_BOOTSTRAP_PROVISION")
            put("target_entity", "ANDROID_LOCAL_SQLITE")
            put("target_id", "ROOT")
            put("client_ip", "127.0.0.1")
            put("payload", "{\"message\": \"iDentify Android Embedded SQLite & Server initial bootstrap\"}")
            put("prev_hash", "GENESIS_0000000000000000000000000000000000000000000000000000000000000000")
            put("entry_hash", sha256("iDentify-Genesis-Block-Android-SQLite-2026"))
            put("created_at", ISO_FORMAT.format(Date()))
        }
        db.insert("audit_logs", null, genesisAudit)

        // Seed Settings
        val settings = mapOf(
            "school_name" to "Sawat Elementary School",
            "school_id" to "101692",
            "kiosk_debounce_minutes" to "30",
            "kiosk_display_duration_seconds" to "2",
            "sms_provider" to "EASYSMS",
            "parent_sms_enabled" to "true"
        )
        for ((k, v) in settings) {
            val cv = ContentValues().apply {
                put("setting_key", k)
                put("setting_value", v)
            }
            db.insert("system_settings", null, cv)
        }
    }

    private fun sha256(input: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(input.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }

    // --- Query Methods for API Router ---

    fun getSchools(): JSONArray {
        val arr = JSONArray()
        val db = readableDatabase
        db.rawQuery("SELECT * FROM schools", null).use { cursor ->
            while (cursor.moveToNext()) {
                arr.put(cursorToJson(cursor))
            }
        }
        return arr
    }

    fun getSchool(idOrSlug: String): JSONObject? {
        val db = readableDatabase
        db.rawQuery("SELECT * FROM schools WHERE id = ? OR slug = ? LIMIT 1", arrayOf(idOrSlug, idOrSlug)).use { cursor ->
            if (cursor.moveToNext()) {
                return cursorToJson(cursor)
            }
        }
        return null
    }

    fun authenticate(usernameOrEmail: String, password: String): JSONObject? {
        val db = readableDatabase
        val query = "SELECT * FROM users WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)) AND password_hash = ? LIMIT 1"
        db.rawQuery(query, arrayOf(usernameOrEmail, usernameOrEmail, password)).use { cursor ->
            if (cursor.moveToNext()) {
                val user = cursorToJson(cursor)
                user.remove("password_hash")
                return user
            }
        }
        return null
    }

    fun getUsers(): JSONArray {
        val arr = JSONArray()
        val db = readableDatabase
        db.rawQuery("SELECT * FROM users", null).use { cursor ->
            while (cursor.moveToNext()) {
                val u = cursorToJson(cursor)
                u.remove("password_hash")
                arr.put(u)
            }
        }
        return arr
    }

    fun getStudents(): JSONArray {
        val arr = JSONArray()
        val db = readableDatabase
        db.rawQuery("SELECT * FROM students ORDER BY last_name ASC", null).use { cursor ->
            while (cursor.moveToNext()) {
                arr.put(cursorToJson(cursor))
            }
        }
        return arr
    }

    fun getSections(): JSONArray {
        val arr = JSONArray()
        val db = readableDatabase
        db.rawQuery("SELECT * FROM sections", null).use { cursor ->
            while (cursor.moveToNext()) {
                arr.put(cursorToJson(cursor))
            }
        }
        return arr
    }

    fun createStudent(data: JSONObject): JSONObject {
        val db = writableDatabase
        val id = UUID.randomUUID().toString()
        val cv = ContentValues().apply {
            put("id", id)
            put("school_id", data.optString("school_id", "11111111-1111-1111-1111-111111111111"))
            put("section_id", data.optString("section_id", "33333333-3333-3333-3333-000000000001"))
            put("lrn", data.optString("lrn", System.currentTimeMillis().toString()))
            put("psa_birth_cert_no", data.optString("psa_birth_cert_no", ""))
            put("last_name", data.optString("last_name", "Student"))
            put("first_name", data.optString("first_name", "New"))
            put("middle_name", data.optString("middle_name", ""))
            put("extension_name", data.optString("extension_name", ""))
            put("birthdate", data.optString("birthdate", "2010-01-01"))
            put("age", data.optInt("age", 15))
            put("sex", data.optString("sex", "Male"))
            put("mother_tongue", data.optString("mother_tongue", "Tagalog"))
            put("is_4ps_beneficiary", if (data.optBoolean("is_4ps_beneficiary")) 1 else 0)
            put("household_4ps_id", data.optString("household_4ps_id", ""))
            put("current_barangay", data.optString("current_barangay", "Sawat"))
            put("current_municipality_city", data.optString("current_municipality_city", "Urbiztondo"))
            put("current_province", data.optString("current_province", "Pangasinan"))
            put("father_name", data.optString("father_name", ""))
            put("mother_name", data.optString("mother_name", ""))
            put("primary_sms_phone", data.optString("primary_sms_phone", ""))
            put("grade_level", data.optString("grade_level", "Grade 10"))
            put("section_name", data.optString("section_name", "Bonifacio"))
            put("active_rfid_uid", data.optString("active_rfid_uid", ""))
            put("photo_url", data.optString("photo_url", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"))
            put("enrollment_status", data.optString("enrollment_status", "ENROLLED"))
            put("academic_standing", data.optString("academic_standing", "PASSING"))
            put("general_average", data.optDouble("general_average", 85.0))
        }
        db.insert("students", null, cv)
        addAudit("CREATE_STUDENT", "TEACHER", "Enrolled learner LRN: ${data.optString("lrn")}")
        data.put("id", id)
        return data
    }

    fun recordKioskTap(rfid: String): JSONObject {
        val db = writableDatabase
        val todayStr = DATE_FORMAT.format(Date())
        val nowIso = ISO_FORMAT.format(Date())
        val nowTime = TIME_FORMAT.format(Date())

        // 1. Check if student
        var student: JSONObject? = null
        db.rawQuery("SELECT * FROM students WHERE active_rfid_uid = ? LIMIT 1", arrayOf(rfid)).use { c ->
            if (c.moveToNext()) student = cursorToJson(c)
        }

        // 2. Check if user/faculty
        var user: JSONObject? = null
        if (student == null) {
            db.rawQuery("SELECT * FROM users WHERE active_rfid_uid = ? LIMIT 1", arrayOf(rfid)).use { c ->
                if (c.moveToNext()) user = cursorToJson(c)
            }
        }

        if (student == null && user == null) {
            return JSONObject().apply {
                put("success", false)
                put("message", "RFID Card ($rfid) not recognized in iDentify system.")
                put("status", "UNRECOGNIZED")
            }
        }

        val isStudent = student != null
        val personId = if (isStudent) student!!.getString("id") else user!!.getString("id")
        val personName = if (isStudent) "${student!!.getString("first_name")} ${student!!.getString("last_name")}" else "${user!!.getString("first_name")} ${user!!.getString("last_name")}"
        val phone = if (isStudent) student!!.optString("primary_sms_phone") else user!!.optString("mobile_number")
        val photoUrl = if (isStudent) student!!.optString("photo_url") else user!!.optString("photo_url")
        val lrn = if (isStudent) student!!.optString("lrn") else ""
        val gradeSection = if (isStudent) "${student!!.optString("grade_level")} - ${student!!.optString("section_name")}" else user!!.optString("position")

        // Check last tap today to toggle CLOCK_IN vs CLOCK_OUT
        var lastEventType = "CLOCK_OUT"
        val query = if (isStudent) "SELECT event_type FROM attendance_logs WHERE student_id = ? AND attendance_date = ? ORDER BY timestamp DESC LIMIT 1"
        else "SELECT event_type FROM attendance_logs WHERE user_id = ? AND attendance_date = ? ORDER BY timestamp DESC LIMIT 1"
        db.rawQuery(query, arrayOf(personId, todayStr)).use { c ->
            if (c.moveToNext()) {
                lastEventType = c.getString(0)
            }
        }

        val newEventType = if (lastEventType == "CLOCK_IN") "CLOCK_OUT" else "CLOCK_IN"
        val remarks = if (newEventType == "CLOCK_IN") "Main Gate Turnstile #1 Tap In" else "Main Exit Turnstile #2 Tap Out"

        val logId = UUID.randomUUID().toString()
        val cv = ContentValues().apply {
            put("id", logId)
            put("school_id", "11111111-1111-1111-1111-111111111111")
            if (isStudent) put("student_id", personId) else put("user_id", personId)
            put("event_type", newEventType)
            put("attendance_date", todayStr)
            put("timestamp", nowIso)
            put("state", "PRESENT")
            put("remarks", remarks)
            put("rfid_uid", rfid)
        }
        db.insert("attendance_logs", null, cv)

        addAudit("KIOSK_RFID_TAP", if (isStudent) "STUDENT" else "FACULTY", "$personName ($newEventType) at $nowTime")

        return JSONObject().apply {
            put("success", true)
            put("status", newEventType)
            put("studentId", personId)
            put("name", personName)
            put("lrn", lrn)
            put("section", gradeSection)
            put("timeStr", nowTime)
            put("timestamp", nowIso)
            put("rfid", rfid)
            put("photo_url", photoUrl)
            put("parentPhone", phone)
            put("smsDispatched", true)
            put("smsMessage", "iDentify DepEd: $personName has successfully ${if (newEventType == "CLOCK_IN") "entered" else "exited"} the school campus at $nowTime.")
        }
    }

    fun getSectionRoster(sectionName: String, date: String): JSONArray {
        val arr = JSONArray()
        val db = readableDatabase
        val query = """
            SELECT s.*, a.event_type as kiosk_status, a.timestamp as kiosk_time
            FROM students s
            LEFT JOIN (
                SELECT student_id, event_type, timestamp FROM attendance_logs 
                WHERE attendance_date = ? ORDER BY timestamp DESC
            ) a ON s.id = a.student_id
            WHERE s.section_name = ? OR ? = ''
            ORDER BY s.last_name ASC
        """.trimIndent()
        db.rawQuery(query, arrayOf(date, sectionName, sectionName)).use { c ->
            while (c.moveToNext()) {
                val st = cursorToJson(c)
                val kioskStatus = c.getString(c.getColumnIndexOrThrow("kiosk_status")) ?: "NO_GATE_TAP"
                st.put("kioskStatus", if (kioskStatus == "CLOCK_IN") "CLOCKED_IN" else if (kioskStatus == "CLOCK_OUT") "CLOCKED_OUT" else "NO_GATE_TAP")
                st.put("currentState", if (kioskStatus == "CLOCK_IN") "PRESENT" else "UNRECORDED")
                arr.put(st)
            }
        }
        return arr
    }

    fun recordClassroomAttendance(studentId: String, state: String, subject: String?, remarks: String?): JSONObject {
        val db = writableDatabase
        val todayStr = DATE_FORMAT.format(Date())
        val nowIso = ISO_FORMAT.format(Date())
        val logId = UUID.randomUUID().toString()
        val cv = ContentValues().apply {
            put("id", logId)
            put("school_id", "11111111-1111-1111-1111-111111111111")
            put("student_id", studentId)
            put("event_type", "CLASSROOM_CHECK")
            put("attendance_date", todayStr)
            put("timestamp", nowIso)
            put("state", state)
            put("subject", subject ?: "General")
            put("remarks", remarks ?: "Recorded by classroom teacher")
        }
        db.insert("attendance_logs", null, cv)
        addAudit("CLASSROOM_ATTENDANCE", "TEACHER", "Marked student $studentId as $state ($subject)")
        return JSONObject().apply {
            put("success", true)
            put("message", "Attendance saved to Android SQLite")
        }
    }

    fun getAnalyticsSummary(): JSONObject {
        val db = readableDatabase
        var totalStudents = 0
        var totalEnrolled = 643
        var presentToday = 0
        val todayStr = DATE_FORMAT.format(Date())

        db.rawQuery("SELECT COUNT(*) FROM students", null).use { c ->
            if (c.moveToNext()) totalStudents = c.getInt(0)
        }
        db.rawQuery("SELECT COUNT(DISTINCT student_id) FROM attendance_logs WHERE attendance_date = ? AND event_type = 'CLOCK_IN'", arrayOf(todayStr)).use { c ->
            if (c.moveToNext()) presentToday = c.getInt(0)
        }

        return JSONObject().apply {
            put("totalStudents", totalStudents)
            put("totalEnrolledLearners", totalEnrolled)
            put("presentToday", presentToday)
            put("attendanceRate", if (totalStudents > 0) ((presentToday.toDouble() / totalStudents) * 100).toInt() else 97)
            put("smsAlertsSent", presentToday)
            put("mode", "EMBEDDED_ANDROID_SQLITE")
            put("status", "ACTIVE")
        }
    }

    fun getAuditLogs(): JSONArray {
        val arr = JSONArray()
        val db = readableDatabase
        db.rawQuery("SELECT * FROM audit_logs ORDER BY sequence_number DESC LIMIT 50", null).use { c ->
            while (c.moveToNext()) {
                arr.put(cursorToJson(c))
            }
        }
        return arr
    }

    fun addAudit(action: String, role: String, details: String): JSONObject {
        val db = writableDatabase
        var lastHash = "GENESIS_0000000000000000000000000000000000000000000000000000000000000000"
        db.rawQuery("SELECT entry_hash FROM audit_logs ORDER BY sequence_number DESC LIMIT 1", null).use { c ->
            if (c.moveToNext()) lastHash = c.getString(0) ?: lastHash
        }
        val nowIso = ISO_FORMAT.format(Date())
        val newHash = sha256("$lastHash|$action|$role|$details|$nowIso")
        val id = UUID.randomUUID().toString()
        val cv = ContentValues().apply {
            put("id", id)
            put("school_id", "11111111-1111-1111-1111-111111111111")
            put("actor_id", "00000000-0000-0000-0000-000000000001")
            put("actor_role", role)
            put("action", action)
            put("target_entity", "SQLITE_RECORD")
            put("target_id", "LOCAL")
            put("client_ip", "127.0.0.1")
            put("payload", "{\"details\": \"$details\"}")
            put("prev_hash", lastHash)
            put("entry_hash", newHash)
            put("created_at", nowIso)
        }
        db.insert("audit_logs", null, cv)
        return JSONObject().apply {
            put("id", id)
            put("action", action)
            put("hash", newHash)
        }
    }

    fun getDatabaseStats(): JSONObject {
        val db = readableDatabase
        val counts = JSONObject()
        val tables = listOf("schools", "users", "sections", "students", "attendance_logs", "audit_logs", "system_settings")
        for (t in tables) {
            try {
                db.rawQuery("SELECT COUNT(*) FROM $t", null).use { c ->
                    if (c.moveToNext()) counts.put(t, c.getInt(0))
                }
            } catch (e: Exception) {
                counts.put(t, 0)
            }
        }
        val dbFile = context.getDatabasePath(DATABASE_NAME)
        return JSONObject().apply {
            put("databaseName", DATABASE_NAME)
            put("databasePath", dbFile.absolutePath)
            put("fileSizeBytes", if (dbFile.exists()) dbFile.length() else 0)
            put("tables", counts)
            put("driver", "Android SQLiteOpenHelper")
            put("status", "CONNECTED")
        }
    }

    private fun cursorToJson(cursor: Cursor): JSONObject {
        val obj = JSONObject()
        for (i in 0 until cursor.columnCount) {
            val name = cursor.getColumnName(i)
            when (cursor.getType(i)) {
                Cursor.FIELD_TYPE_INTEGER -> obj.put(name, cursor.getLong(i))
                Cursor.FIELD_TYPE_FLOAT -> obj.put(name, cursor.getDouble(i))
                Cursor.FIELD_TYPE_STRING -> obj.put(name, cursor.getString(i))
                Cursor.FIELD_TYPE_NULL -> obj.put(name, JSONObject.NULL)
                else -> obj.put(name, cursor.getString(i))
            }
        }
        return obj
    }
}
