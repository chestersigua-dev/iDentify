package com.example.identify.server

import android.content.Context
import com.example.identify.database.IdentifyDatabaseHelper
import org.json.JSONObject
import java.io.*
import java.net.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class IdentifyHttpServer(
    private val context: Context,
    private val dbHelper: IdentifyDatabaseHelper,
    val port: Int = 4000
) {
    private var serverSocket: ServerSocket? = null
    private var isRunning = false
    private var executor: ExecutorService? = null

    fun start() {
        if (isRunning) return
        try {
            serverSocket = ServerSocket(port, 50, InetAddress.getByName("0.0.0.0"))
            isRunning = true
            executor = Executors.newFixedThreadPool(8)

            Thread {
                while (isRunning) {
                    try {
                        val client = serverSocket?.accept() ?: break
                        executor?.submit { handleClient(client) }
                    } catch (e: Exception) {
                        if (!isRunning) break
                    }
                }
            }.start()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun stop() {
        isRunning = false
        try {
            serverSocket?.close()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        executor?.shutdown()
    }

    fun isServerRunning(): Boolean = isRunning

    fun getLocalIpAddress(): String {
        try {
            val interfaces = NetworkInterface.getNetworkInterfaces()
            while (interfaces.hasMoreElements()) {
                val iface = interfaces.nextElement()
                val addresses = iface.inetAddresses
                while (addresses.hasMoreElements()) {
                    val addr = addresses.nextElement()
                    if (!addr.isLoopbackAddress && addr is Inet4Address) {
                        return addr.hostAddress ?: "127.0.0.1"
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return "127.0.0.1"
    }

    private fun handleClient(socket: Socket) {
        try {
            socket.soTimeout = 10000
            val input = BufferedReader(InputStreamReader(socket.getInputStream()))
            val rawOutput = socket.getOutputStream()

            val requestLine = input.readLine() ?: return
            val parts = requestLine.split(" ")
            if (parts.size < 2) return

            val method = parts[0].uppercase()
            val rawPath = parts[1]

            // Read headers
            val headers = mutableMapOf<String, String>()
            var line: String?
            var contentLength = 0
            while (input.readLine().also { line = it } != null) {
                if (line.isNullOrEmpty()) break
                val colonIdx = line!!.indexOf(":")
                if (colonIdx > 0) {
                    val key = line!!.substring(0, colonIdx).trim().lowercase()
                    val value = line!!.substring(colonIdx + 1).trim()
                    headers[key] = value
                    if (key == "content-length") {
                        contentLength = value.toIntOrNull() ?: 0
                    }
                }
            }

            // Read body
            val bodyBuilder = StringBuilder()
            if (contentLength > 0) {
                val buffer = CharArray(contentLength)
                var totalRead = 0
                while (totalRead < contentLength) {
                    val read = input.read(buffer, totalRead, contentLength - totalRead)
                    if (read == -1) break
                    totalRead += read
                }
                bodyBuilder.append(buffer, 0, totalRead)
            }
            val body = bodyBuilder.toString()

            // Handle preflight OPTIONS
            if (method == "OPTIONS") {
                sendResponse(rawOutput, 204, "No Content", "text/plain", ByteArray(0))
                return
            }

            // Extract path and query
            val questionIdx = rawPath.indexOf("?")
            val path = if (questionIdx >= 0) rawPath.substring(0, questionIdx) else rawPath
            val queryStr = if (questionIdx >= 0) rawPath.substring(questionIdx + 1) else ""
            val queryParams = parseQueryParams(queryStr)

            // API Route dispatch
            if (path.startsWith("/api/")) {
                handleApiRequest(rawOutput, method, path, queryParams, body)
            } else {
                handleStaticAsset(rawOutput, path)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            try {
                socket.close()
            } catch (e: Exception) {
            }
        }
    }

    private fun handleApiRequest(
        out: OutputStream,
        method: String,
        path: String,
        params: Map<String, String>,
        body: String
    ) {
        val jsonBody = try {
            if (body.isNotEmpty()) JSONObject(body) else JSONObject()
        } catch (e: Exception) {
            JSONObject()
        }

        try {
            when {
                // Health Check
                path == "/api/health" || path == "/api/system/health" -> {
                    val res = JSONObject().apply {
                        put("status", "ok")
                        put("platform", "Android")
                        put("mode", "EMBEDDED_LOCAL_SERVER")
                        put("serverPort", port)
                        put("database", "SQLite (identify_android.db)")
                        put("deped_version", "3.0.0-android")
                    }
                    sendJsonResponse(out, 200, res)
                }

                // System / Database status
                path == "/api/system/status" || path == "/api/system/stats" -> {
                    val stats = dbHelper.getDatabaseStats()
                    sendJsonResponse(out, 200, stats)
                }

                // Schools
                path == "/api/schools" && method == "GET" -> {
                    sendJsonArrayResponse(out, 200, dbHelper.getSchools())
                }
                path.startsWith("/api/schools/") && method == "GET" -> {
                    val slugOrId = path.removePrefix("/api/schools/")
                    val school = dbHelper.getSchool(slugOrId)
                    if (school != null) {
                        sendJsonResponse(out, 200, school)
                    } else {
                        val all = dbHelper.getSchools()
                        if (all.length() > 0) sendJsonResponse(out, 200, all.getJSONObject(0))
                        else sendError(out, 404, "School not found")
                    }
                }

                // Authentication
                path == "/api/auth/login" && method == "POST" -> {
                    val username = jsonBody.optString("username", jsonBody.optString("email"))
                    val password = jsonBody.optString("password")
                    val user = dbHelper.authenticate(username, password)
                    if (user != null) {
                        val res = JSONObject().apply {
                            put("success", true)
                            put("user", user)
                            put("token", "android_embedded_jwt_${System.currentTimeMillis()}")
                            put("message", "Authenticated on Android embedded SQLite database.")
                        }
                        sendJsonResponse(out, 200, res)
                    } else {
                        // Return default super admin if fallback needed or error
                        val res = JSONObject().apply {
                            put("success", false)
                            put("message", "Invalid credentials. Try superadmin / SuperAdmin123! or principal.sawat / Principal123!")
                        }
                        sendJsonResponse(out, 401, res)
                    }
                }
                path == "/api/auth/me" && method == "GET" -> {
                    val users = dbHelper.getUsers()
                    val me = if (users.length() > 0) users.getJSONObject(0) else JSONObject()
                    sendJsonResponse(out, 200, me)
                }

                // Users
                path == "/api/users" && method == "GET" -> {
                    sendJsonArrayResponse(out, 200, dbHelper.getUsers())
                }

                // Students
                path == "/api/students" && method == "GET" -> {
                    sendJsonArrayResponse(out, 200, dbHelper.getStudents())
                }
                path == "/api/students" && method == "POST" -> {
                    val created = dbHelper.createStudent(jsonBody)
                    sendJsonResponse(out, 201, created)
                }

                // Sections
                path == "/api/sections" && method == "GET" -> {
                    sendJsonArrayResponse(out, 200, dbHelper.getSections())
                }

                // Attendance Roster
                path == "/api/attendance/roster" && method == "GET" -> {
                    val section = params["section"] ?: params["sectionName"] ?: "Bonifacio"
                    val date = params["date"] ?: ""
                    val roster = dbHelper.getSectionRoster(section, date)
                    sendJsonArrayResponse(out, 200, roster)
                }
                path == "/api/attendance/classroom" && method == "POST" -> {
                    val studentId = jsonBody.optString("studentId")
                    val state = jsonBody.optString("state", "PRESENT")
                    val subject = jsonBody.optString("subjectName", jsonBody.optString("subject"))
                    val remarks = jsonBody.optString("remarks")
                    val res = dbHelper.recordClassroomAttendance(studentId, state, subject, remarks)
                    sendJsonResponse(out, 200, res)
                }

                // Kiosk RFID Tap
                path == "/api/kiosk/tap" && method == "POST" -> {
                    val rfid = jsonBody.optString("rfid", jsonBody.optString("token_uid", params["rfid"] ?: ""))
                    val res = dbHelper.recordKioskTap(rfid)
                    sendJsonResponse(out, 200, res)
                }

                // Analytics
                path == "/api/analytics/summary" && method == "GET" -> {
                    sendJsonResponse(out, 200, dbHelper.getAnalyticsSummary())
                }

                // Audit Logs
                path == "/api/audit" && method == "GET" -> {
                    sendJsonArrayResponse(out, 200, dbHelper.getAuditLogs())
                }

                // 2FA Endpoints
                path == "/api/auth/2fa/setup" -> {
                    val secret = "JBSWY3DPEHPK3PXP"
                    val res = JSONObject().apply {
                        put("secret", secret)
                        put("otpauth", "otpauth://totp/iDentify:admin@deped.gov.ph?secret=$secret&issuer=iDentify")
                    }
                    sendJsonResponse(out, 200, res)
                }
                path == "/api/auth/2fa/enable" || path == "/api/auth/2fa/disable" -> {
                    val res = JSONObject().apply {
                        put("success", true)
                        put("message", "2FA setting synchronized with local Android server.")
                    }
                    sendJsonResponse(out, 200, res)
                }

                // Reset / Purge
                path == "/api/system/reset" && method == "POST" -> {
                    context.deleteDatabase(IdentifyDatabaseHelper.DATABASE_NAME)
                    val res = JSONObject().apply {
                        put("success", true)
                        put("message", "Database reset and re-seeded.")
                    }
                    sendJsonResponse(out, 200, res)
                }

                else -> {
                    sendError(out, 404, "Endpoint $path not found on Android local server.")
                }
            }
        } catch (e: Exception) {
            sendError(out, 500, "Server error: ${e.message}")
        }
    }

    private fun handleStaticAsset(out: OutputStream, requestPath: String) {
        var cleanPath = requestPath.trimStart('/')
        if (cleanPath.isEmpty() || cleanPath == "index.html") {
            cleanPath = "index.html"
        }

        // Try to load asset
        val assetPath = "web/$cleanPath"
        val fallbackPath = "web/index.html"

        var stream: InputStream? = null
        var resolvedPath = assetPath
        try {
            stream = context.assets.open(assetPath)
        } catch (e: IOException) {
            // SPA fallback: return index.html for client-side routing
            try {
                stream = context.assets.open(fallbackPath)
                resolvedPath = fallbackPath
            } catch (e2: IOException) {
                sendError(out, 404, "Asset not found: $cleanPath")
                return
            }
        }

        val contentType = getMimeType(resolvedPath)
        val bytes = stream?.readBytes() ?: ByteArray(0)
        stream?.close()
        sendResponse(out, 200, "OK", contentType, bytes)
    }

    private fun getMimeType(path: String): String {
        return when {
            path.endsWith(".html") -> "text/html; charset=utf-8"
            path.endsWith(".css") -> "text/css; charset=utf-8"
            path.endsWith(".js") -> "application/javascript; charset=utf-8"
            path.endsWith(".json") -> "application/json; charset=utf-8"
            path.endsWith(".svg") -> "image/svg+xml"
            path.endsWith(".png") -> "image/png"
            path.endsWith(".jpg") || path.endsWith(".jpeg") -> "image/jpeg"
            path.endsWith(".ico") -> "image/x-icon"
            path.endsWith(".woff2") -> "font/woff2"
            path.endsWith(".woff") -> "font/woff"
            path.endsWith(".ttf") -> "font/ttf"
            else -> "application/octet-stream"
        }
    }

    private fun parseQueryParams(queryStr: String): Map<String, String> {
        val map = mutableMapOf<String, String>()
        if (queryStr.isEmpty()) return map
        for (pair in queryStr.split("&")) {
            val idx = pair.indexOf("=")
            if (idx > 0) {
                val key = URLDecoder.decode(pair.substring(0, idx), "UTF-8")
                val value = URLDecoder.decode(pair.substring(idx + 1), "UTF-8")
                map[key] = value
            }
        }
        return map
    }

    private fun sendJsonResponse(out: OutputStream, status: Int, json: JSONObject) {
        val bytes = json.toString().toByteArray(Charsets.UTF_8)
        sendResponse(out, status, "OK", "application/json; charset=utf-8", bytes)
    }

    private fun sendJsonArrayResponse(out: OutputStream, status: Int, json: org.json.JSONArray) {
        val bytes = json.toString().toByteArray(Charsets.UTF_8)
        sendResponse(out, status, "OK", "application/json; charset=utf-8", bytes)
    }

    private fun sendError(out: OutputStream, status: Int, message: String) {
        val json = JSONObject().apply {
            put("error", true)
            put("status", status)
            put("message", message)
        }
        val bytes = json.toString().toByteArray(Charsets.UTF_8)
        sendResponse(out, status, "Error", "application/json; charset=utf-8", bytes)
    }

    private fun sendResponse(
        out: OutputStream,
        status: Int,
        statusText: String,
        contentType: String,
        body: ByteArray
    ) {
        val writer = PrintWriter(OutputStreamWriter(out, Charsets.UTF_8))
        writer.print("HTTP/1.1 $status $statusText\r\n")
        writer.print("Content-Type: $contentType\r\n")
        writer.print("Content-Length: ${body.size}\r\n")
        writer.print("Connection: close\r\n")
        writer.print("Access-Control-Allow-Origin: *\r\n")
        writer.print("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n")
        writer.print("Access-Control-Allow-Headers: *\r\n")
        writer.print("\r\n")
        writer.flush()
        out.write(body)
        out.flush()
    }
}
