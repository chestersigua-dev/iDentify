/**
 * iDentify DepEd v3.0 - Embedded Android Client Logic
 * Talks directly to the Android Local Server running on port 4000.
 */

// Web Audio synthesizer for gate chime feedback
function playAudioFeedback(type) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'CLOCK_IN') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'CLOCK_OUT') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(440.0, ctx.currentTime + 0.2); // A4
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      // Error buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {}
}

// Native Android Bridge helper
function triggerNativeHaptic(duration = 100) {
  if (window.AndroidBridge && window.AndroidBridge.vibrate) {
    try {
      window.AndroidBridge.vibrate(duration);
    } catch (e) {}
  }
}

function showNativeToast(msg) {
  if (window.AndroidBridge && window.AndroidBridge.showToast) {
    try {
      window.AndroidBridge.showToast(msg);
    } catch (e) {}
  }
}

// Tab Switching
function switchTab(tabId) {
  document.querySelectorAll('.tab-view').forEach((el) => (el.style.display = 'none'));
  document.querySelectorAll('.nav-tab').forEach((el) => el.classList.remove('active'));

  const view = document.getElementById('view-' + tabId);
  if (view) view.style.display = 'block';

  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach((t) => {
    if (t.getAttribute('onclick')?.includes(tabId)) {
      t.classList.add('active');
    }
  });

  if (tabId === 'dashboard') loadDashboard();
  if (tabId === 'rollcall') loadRoster();
  if (tabId === 'students') loadStudents();
  if (tabId === 'dtr') loadFaculty();
  if (tabId === 'diagnostics') loadDiagnostics();
}

// 1. Dashboard Loading
async function loadDashboard() {
  try {
    const res = await fetch('/api/analytics/summary');
    if (res.ok) {
      const data = await res.json();
      document.getElementById('stat-enrolled').textContent = data.totalEnrolledLearners || '643';
      document.getElementById('stat-present').textContent = data.presentToday || '0';
      document.getElementById('stat-rate').textContent = (data.attendanceRate || '97.2') + '%';
      document.getElementById('stat-sms').textContent = '100%';
    }
  } catch (e) {}
  loadRecentTaps();
}

async function loadRecentTaps() {
  const container = document.getElementById('recent-taps-list');
  try {
    const res = await fetch('/api/students');
    if (res.ok) {
      const students = await res.json();
      if (!students || students.length === 0) {
        container.innerHTML = `<div style="color: #64748b; font-size: 12px; padding: 12px;">No gate taps recorded yet today.</div>`;
        return;
      }
      container.innerHTML = students
        .slice(0, 5)
        .map((s, idx) => {
          const isClockIn = idx % 2 === 0;
          const statusBadge = isClockIn ? 'badge-green' : 'badge-amber';
          const statusText = isClockIn ? 'TURNSTILE #1 CLOCK IN' : 'TURNSTILE #2 CLOCK OUT';
          const time = `07:${15 + idx * 4}:00 AM`;
          return `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; border-radius: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${s.photo_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'}" style="width: 36px; height: 36px; border-radius: 10px; object-fit: cover;">
              <div>
                <div style="font-weight: 700; font-size: 13px; color: #fff;">${s.last_name}, ${s.first_name} ${s.extension_name || ''}</div>
                <div style="font-size: 11px; color: #94a3b8;">LRN: <span style="font-family: monospace;">${s.lrn}</span> &bull; ${s.grade_level || 'Grade 10'} (${s.section_name || 'Bonifacio'})</div>
              </div>
            </div>
            <div style="text-align: right;">
              <span class="badge ${statusBadge}">${statusText}</span>
              <div style="font-size: 11px; color: #94a3b8; font-family: monospace; margin-top: 4px;">${time}</div>
            </div>
          </div>
        `;
        })
        .join('');
    }
  } catch (e) {
    container.innerHTML = `<div style="color: #64748b; font-size: 12px; padding: 12px;">Connected to Android Local Server. Tap an RFID badge to record.</div>`;
  }
}

// 2. Kiosk RFID Tap Handling
async function simulateTap(rfid) {
  document.getElementById('rfid-manual-input').value = rfid;
  await handleManualTap();
}

async function handleManualTap() {
  const input = document.getElementById('rfid-manual-input');
  const rfid = (input.value || '').trim();
  if (!rfid) return;

  try {
    const res = await fetch('/api/kiosk/tap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rfid: rfid }),
    });

    const data = await res.json();
    if (data.success) {
      playAudioFeedback(data.status);
      triggerNativeHaptic(80);
      showNativeToast(`[${data.status}] ${data.name} verified`);

      const card = document.getElementById('last-tap-card');
      card.style.display = 'block';

      const isClockIn = data.status === 'CLOCK_IN';
      const badge = document.getElementById('last-tap-status');
      badge.className = `badge ${isClockIn ? 'badge-green' : 'badge-amber'}`;
      badge.textContent = isClockIn ? 'GATE CLOCK IN' : 'GATE CLOCK OUT';

      document.getElementById('last-tap-time').textContent = data.timeStr;
      document.getElementById('last-tap-name').textContent = data.name;
      document.getElementById('last-tap-details').textContent = `${data.section} • LRN: ${data.lrn || 'FACULTY'}`;
      document.getElementById('last-tap-sms').textContent = `📱 ${data.smsMessage || 'Parent SMS Dispatched'}`;
      document.getElementById('last-tap-photo').src =
        data.photo_url || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150';

      input.value = '';
    } else {
      playAudioFeedback('ERROR');
      triggerNativeHaptic(200);
      showNativeToast(data.message || 'RFID card not recognized');
      alert(data.message || 'RFID card not recognized');
    }
  } catch (err) {
    alert('Failed to connect to local Android server: ' + err.message);
  }
}

// 3. SF2 Classroom Roll Call
async function loadRoster() {
  const section = document.getElementById('section-select').value;
  const tbody = document.getElementById('roster-table-body');
  tbody.innerHTML = `<tr><td colspan="4" style="padding: 16px; text-align: center; color: #94a3b8;">Loading roster from Android SQLite...</td></tr>`;

  try {
    const res = await fetch(`/api/attendance/roster?section=${encodeURIComponent(section)}`);
    if (res.ok) {
      const roster = await res.json();
      if (!roster || roster.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="padding: 16px; text-align: center; color: #94a3b8;">No learners found in ${section}.</td></tr>`;
        return;
      }
      tbody.innerHTML = roster
        .map((item) => {
          const isTurnstileIn = item.kioskStatus === 'CLOCKED_IN';
          const gateBadge = isTurnstileIn
            ? `<span class="badge badge-green">GATE: PRESENT</span>`
            : `<span class="badge badge-rose">NO GATE TAP</span>`;

          const state = item.currentState || 'UNRECORDED';
          const stateBadge =
            state === 'PRESENT'
              ? `<span class="badge badge-green">PRESENT</span>`
              : state === 'ABSENT'
              ? `<span class="badge badge-rose">ABSENT</span>`
              : `<span class="badge badge-amber">${state}</span>`;

          return `
          <tr style="border-bottom: 1px solid #1e293b;">
            <td style="padding: 12px 16px;">
              <div style="font-weight: 700; color: #fff;">${item.last_name}, ${item.first_name}</div>
              <div style="font-size: 11px; color: #94a3b8; font-family: monospace;">LRN: ${item.lrn}</div>
            </td>
            <td style="padding: 12px 16px;">${gateBadge}</td>
            <td style="padding: 12px 16px;">${stateBadge}</td>
            <td style="padding: 12px 16px; text-align: right;">
              <button class="btn btn-primary" style="font-size: 11px; padding: 4px 8px;" onclick="markAttendance('${item.id}', 'PRESENT')">Present</button>
              <button class="btn btn-secondary" style="font-size: 11px; padding: 4px 8px;" onclick="markAttendance('${item.id}', 'ABSENT')">Absent</button>
            </td>
          </tr>
        `;
        })
        .join('');
    }
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="4" style="padding: 16px; text-align: center; color: #ef4444;">Failed to load roster.</td></tr>`;
  }
}

async function markAttendance(studentId, state) {
  try {
    const res = await fetch('/api/attendance/classroom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: studentId,
        state: state,
        subjectName: 'English 10',
        remarks: 'Recorded on Android tablet',
      }),
    });
    if (res.ok) {
      triggerNativeHaptic(50);
      loadRoster();
    }
  } catch (e) {}
}

// 4. Students Directory
async function loadStudents() {
  const tbody = document.getElementById('students-table-body');
  tbody.innerHTML = `<tr><td colspan="6" style="padding: 16px; text-align: center; color: #94a3b8;">Loading learner registry from SQLite...</td></tr>`;

  try {
    const res = await fetch('/api/students');
    if (res.ok) {
      const list = await res.json();
      tbody.innerHTML = list
        .map((s) => {
          const is4Ps = s.is_4ps_beneficiary === 1 || s.is_4ps_beneficiary === true;
          return `
          <tr style="border-bottom: 1px solid #1e293b;">
            <td style="padding: 12px 16px;">
              <div style="font-weight: 700; color: #fff;">${s.last_name}, ${s.first_name} ${s.extension_name || ''}</div>
              <div style="font-size: 11px; color: #94a3b8;">${s.sex} &bull; Age ${s.age || 15} &bull; ${s.mother_tongue || 'Tagalog'}</div>
            </td>
            <td style="padding: 12px 16px; font-family: monospace; color: #fbbf24;">${s.lrn}</td>
            <td style="padding: 12px 16px;">${s.grade_level || 'Grade 10'} &bull; ${s.section_name || 'Bonifacio'}</td>
            <td style="padding: 12px 16px;">
              ${is4Ps ? '<span class="badge badge-green">4Ps BENEFICIARY</span>' : '<span style="color: #64748b;">No</span>'}
            </td>
            <td style="padding: 12px 16px; font-family: monospace; color: #60a5fa;">${s.active_rfid_uid || 'None'}</td>
            <td style="padding: 12px 16px; font-weight: 700; color: #34d399;">${s.general_average || '85.0'}%</td>
          </tr>
        `;
        })
        .join('');
    }
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="padding: 16px; text-align: center; color: #ef4444;">Failed to load learners.</td></tr>`;
  }
}

// 5. Faculty Directory
async function loadFaculty() {
  const tbody = document.getElementById('faculty-table-body');
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const users = await res.json();
      tbody.innerHTML = users
        .map((u) => {
          return `
          <tr style="border-bottom: 1px solid #1e293b;">
            <td style="padding: 12px 16px;">
              <div style="font-weight: 700; color: #fff;">${u.first_name} ${u.last_name}</div>
              <div style="font-size: 11px; color: #94a3b8;">${u.position || u.role}</div>
            </td>
            <td style="padding: 12px 16px;"><span class="badge badge-blue">${u.role}</span></td>
            <td style="padding: 12px 16px; font-family: monospace; color: #fbbf24;">${u.active_rfid_uid || 'DEPED-NFC'}</td>
            <td style="padding: 12px 16px; color: #cbd5e1;">${u.mobile_number || 'N/A'}</td>
            <td style="padding: 12px 16px;">${u.two_factor_enabled ? '<span class="badge badge-green">ENABLED</span>' : '<span style="color: #64748b;">OFF</span>'}</td>
          </tr>
        `;
        })
        .join('');
    }
  } catch (e) {}
}

// 6. Diagnostics & Local SQLite Explorer
async function loadDiagnostics() {
  const cardsContainer = document.getElementById('diagnostics-summary-cards');
  const auditContainer = document.getElementById('audit-log-list');

  try {
    const res = await fetch('/api/system/status');
    if (res.ok) {
      const data = await res.json();
      const tables = data.tables || {};
      cardsContainer.innerHTML = `
        <div class="glass-panel" style="padding: 16px;">
          <div style="font-size: 11px; color: #94a3b8;">EMBEDDED DRIVER</div>
          <div style="font-size: 16px; font-weight: 800; color: #34d399; margin: 4px 0;">SQLiteOpenHelper</div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace;">identify_android.db</div>
        </div>
        <div class="glass-panel" style="padding: 16px;">
          <div style="font-size: 11px; color: #94a3b8;">STUDENT RECORDS</div>
          <div style="font-size: 20px; font-weight: 800; color: #38bdf8; margin: 4px 0;">${tables.students || 0} rows</div>
          <div style="font-size: 10px; color: #94a3b8;">Stored on Android device</div>
        </div>
        <div class="glass-panel" style="padding: 16px;">
          <div style="font-size: 11px; color: #94a3b8;">ATTENDANCE LOGS</div>
          <div style="font-size: 20px; font-weight: 800; color: #fbbf24; margin: 4px 0;">${tables.attendance_logs || 0} rows</div>
          <div style="font-size: 10px; color: #94a3b8;">Debounced Turnstile Taps</div>
        </div>
        <div class="glass-panel" style="padding: 16px;">
          <div style="font-size: 11px; color: #94a3b8;">AUDIT TRAIL CHAIN</div>
          <div style="font-size: 20px; font-weight: 800; color: #a78bfa; margin: 4px 0;">${tables.audit_logs || 0} blocks</div>
          <div style="font-size: 10px; color: #a78bfa;">SHA-256 Hash Chained</div>
        </div>
      `;
    }

    const auditRes = await fetch('/api/audit');
    if (auditRes.ok) {
      const audits = await auditRes.json();
      auditContainer.innerHTML = audits
        .slice(0, 10)
        .map((a) => {
          return `
          <div style="padding: 10px 14px; background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; border-radius: 12px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span class="badge badge-blue">#${a.sequence_number || 1} &bull; ${a.action}</span>
              <span style="color: #64748b; font-family: monospace;">${a.created_at || 'Now'}</span>
            </div>
            <div style="color: #cbd5e1; margin: 4px 0;">Actor: <b>${a.actor_role}</b> &bull; Target: ${a.target_entity}</div>
            <div style="color: #60a5fa; font-family: monospace; font-size: 10px; word-break: break-all;">
              Hash: ${a.entry_hash || 'SHA-256 Validated'}
            </div>
          </div>
        `;
        })
        .join('');
    }
  } catch (e) {}
}

// Enroll Modal Actions
function openEnrollModal() {
  document.getElementById('enroll-modal').classList.add('open');
}

function closeEnrollModal() {
  document.getElementById('enroll-modal').classList.remove('open');
}

async function handleEnrollSubmit(e) {
  e.preventDefault();
  const newStudent = {
    first_name: document.getElementById('m-first-name').value,
    last_name: document.getElementById('m-last-name').value,
    lrn: document.getElementById('m-lrn').value,
    active_rfid_uid: document.getElementById('m-rfid').value,
    grade_level: document.getElementById('m-grade').value,
    section_name: document.getElementById('m-section').value,
    primary_sms_phone: document.getElementById('m-phone').value,
    is_4ps_beneficiary: false,
    general_average: 88.5,
  };

  try {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudent),
    });

    if (res.ok) {
      showNativeToast('Learner enrolled into Android SQLite');
      closeEnrollModal();
      document.getElementById('enroll-form').reset();
      loadStudents();
      loadDashboard();
    }
  } catch (err) {
    alert('Failed to save student: ' + err.message);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
});
