package com.example.identify

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.webkit.*
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.identify.database.IdentifyDatabaseHelper
import com.example.identify.server.IdentifyHttpServer
import org.json.JSONObject

class MainActivity : ComponentActivity() {

    private lateinit var dbHelper: IdentifyDatabaseHelper
    private lateinit var httpServer: IdentifyHttpServer
    private var webView: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // 1. Initialize SQLite Database
        dbHelper = IdentifyDatabaseHelper(this)

        // 2. Start Embedded Android HTTP Server on Port 4000
        httpServer = IdentifyHttpServer(this, dbHelper, 4000)
        httpServer.start()

        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Color(0xFF2563EB),
                    background = Color(0xFF020617),
                    surface = Color(0xFF0F172A),
                    onBackground = Color(0xFFF8FAFC),
                    onSurface = Color(0xFFF8FAFC)
                )
            ) {
                MainContent(
                    httpServer = httpServer,
                    dbHelper = dbHelper,
                    onReload = { webView?.reload() },
                    onToggleKiosk = { toggleKioskMode() },
                    onAttachWebView = { wv -> webView = wv }
                )
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        httpServer.stop()
        dbHelper.close()
    }

    @Suppress("DEPRECATION")
    private fun toggleKioskMode() {
        val window = window ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val controller = window.insetsController
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() or WindowInsets.Type.navigationBars())
                controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            window.decorView.systemUiVisibility = (
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            or View.SYSTEM_UI_FLAG_FULLSCREEN
                            or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    )
        }
        Toast.makeText(this, "Kiosk Fullscreen Active: System bars hidden for turnstile.", Toast.LENGTH_SHORT).show()
    }
}

@Composable
fun MainContent(
    httpServer: IdentifyHttpServer,
    dbHelper: IdentifyDatabaseHelper,
    onReload: () -> Unit,
    onToggleKiosk: () -> Unit,
    onAttachWebView: (WebView) -> Unit
) {
    var showDiagnostics by remember { mutableStateOf(false) }
    var localIp by remember { mutableStateOf("127.0.0.1") }
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        localIp = httpServer.getLocalIpAddress()
    }

    Scaffold(
        topBar = {
            TopAppBarSection(
                localIp = localIp,
                port = httpServer.port,
                onReload = onReload,
                onToggleKiosk = onToggleKiosk,
                onShowDiagnostics = { showDiagnostics = true }
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(Color(0xFF020617))
        ) {
            AndroidWebViewContainer(
                url = "http://127.0.0.1:${httpServer.port}/",
                context = context,
                onAttach = onAttachWebView
            )

            if (showDiagnostics) {
                DiagnosticsDialog(
                    dbHelper = dbHelper,
                    httpServer = httpServer,
                    localIp = localIp,
                    onDismiss = { showDiagnostics = false }
                )
            }
        }
    }
}

@Composable
fun TopAppBarSection(
    localIp: String,
    port: Int,
    onReload: () -> Unit,
    onToggleKiosk: () -> Unit,
    onShowDiagnostics: () -> Unit
) {
    Surface(
        color = Color(0xFF090D1A),
        shadowElevation = 8.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // App Branding & Live Status Indicators
            Row(verticalAlignment = Alignment.CenterVertically) {
                Image(
                    painter = painterResource(id = R.drawable.ic_logo_thumbprint),
                    contentDescription = "iDentify Thumbprint Logo",
                    modifier = Modifier.size(32.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            "iDentify",
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                            fontSize = 14.sp
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        // Green Server Active Pill
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFF064E3B)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .background(Color(0xFF10B981), RoundedCornerShape(3.dp))
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    "PORT $port",
                                    color = Color(0xFF6EE7B7),
                                    fontSize = 9.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                    Text(
                        "LAN: http://$localIp:$port  •  SQLite: OK",
                        color = Color(0xFF94A3B8),
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            // Quick Actions
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onToggleKiosk) {
                    Text("🖥️", fontSize = 16.sp)
                }
                IconButton(onClick = onReload) {
                    Text("🔄", fontSize = 16.sp)
                }
                IconButton(onClick = onShowDiagnostics) {
                    Text("💾", fontSize = 16.sp)
                }
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun AndroidWebViewContainer(
    url: String,
    context: Context,
    onAttach: (WebView) -> Unit
) {
    AndroidView(
        factory = { ctx ->
            WebView(ctx).apply {
                onAttach(this)
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    allowFileAccess = true
                    allowContentAccess = true
                    mediaPlaybackRequiresUserGesture = false
                    useWideViewPort = true
                    loadWithOverviewMode = true
                }
                setBackgroundColor(0xFF020617.toInt())

                addJavascriptInterface(WebAppInterface(context), "AndroidBridge")

                webChromeClient = object : WebChromeClient() {
                    override fun onPermissionRequest(request: PermissionRequest?) {
                        request?.grant(request.resources)
                    }
                }

                webViewClient = object : WebViewClient() {
                    override fun onReceivedError(
                        view: WebView?,
                        errorCode: Int,
                        description: String?,
                        failingUrl: String?
                    ) {
                        // If port 4000 took 200ms to bind, retry after delay
                        view?.postDelayed({ view.loadUrl(url) }, 500)
                    }
                }

                loadUrl(url)
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}

class WebAppInterface(private val context: Context) {
    @JavascriptInterface
    fun showToast(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }

    @JavascriptInterface
    fun vibrate(durationMs: Long) {
        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator?.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator?.vibrate(durationMs)
        }
    }
}

@Composable
fun DiagnosticsDialog(
    dbHelper: IdentifyDatabaseHelper,
    httpServer: IdentifyHttpServer,
    localIp: String,
    onDismiss: () -> Unit
) {
    val stats = remember { dbHelper.getDatabaseStats() }
    val tables = stats.optJSONObject("tables") ?: JSONObject()

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                "iDentify Android Server & DB Status",
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Surface(
                    color = Color(0xFF0F172A),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("• Embedded Server: RUNNING", color = Color(0xFF10B981), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        Text("• Internal URL: http://127.0.0.1:${httpServer.port}", color = Color(0xFF94A3B8), fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                        Text("• Wi-Fi / LAN URL: http://$localIp:${httpServer.port}", color = Color(0xFF38BDF8), fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("• Local Database: SQLite", color = Color(0xFFF59E0B), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        Text("• File: ${stats.optString("databaseName")}", color = Color(0xFF94A3B8), fontSize = 11.sp)
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
                Text("SQLite Tables & Record Counts:", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(4.dp))
                tables.keys().forEach { table ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(table, color = Color(0xFFCBD5E1), fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                        Text("${tables.getInt(table)} records", color = Color(0xFF38BDF8), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close", color = Color(0xFF38BDF8))
            }
        },
        containerColor = Color(0xFF020617)
    )
}
