'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Student, 
  studentsApi, 
  AcademicSection, 
  GradeSubject, 
  SECTIONS_SEED, 
  SUBJECTS_SEED,
  apiClient,
  KioskTapLog,
  StudentHistoryItem,
  StudentHistoryEventType,
  formatUsDateTime
} from '@/lib/api';
import { useTenant } from '@/lib/tenant-context';
import { 
  Users, 
  Plus, 
  Upload, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  Camera, 
  X, 
  Download, 
  Eye, 
  ShieldCheck, 
  BookOpen, 
  Calendar, 
  MapPin, 
  Phone,
  Clock,
  Radio,
  History,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LogIn,
  LogOut,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

interface StudentBeefDatabaseViewProps {
  students: Student[];
  onRefresh: () => void;
  canManage: boolean; // Principal, AO, Super Admin
  initialOpenImport?: boolean;
}

export function StudentBeefDatabaseView({ students, onRefresh, canManage, initialOpenImport }: StudentBeefDatabaseViewProps) {
  const { currentRole, currentUser, school } = useTenant();
  const [activeViewTab, setActiveViewTab] = useState<'roster' | 'import_csv'>(
    initialOpenImport ? 'import_csv' : 'roster'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [tapLogs, setTapLogs] = useState<KioskTapLog[]>([]);
  const [detailsTab, setDetailsTab] = useState<'profile' | 'history'>('profile');
  const [historySortField, setHistorySortField] = useState<'type' | 'timestamp'>('timestamp');
  const [historySortDirection, setHistorySortDirection] = useState<'asc' | 'desc'>('desc');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('ALL');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  // Unified history for currently viewed student
  const studentHistory = useMemo(() => {
    if (!selectedStudent) return [];
    return apiClient.getStudentHistory(selectedStudent);
  }, [selectedStudent, tapLogs]);

  // Filtered and Sorted History Records
  const filteredAndSortedHistory = useMemo(() => {
    let list = [...studentHistory];

    // Filter by type
    if (historyTypeFilter !== 'ALL') {
      if (historyTypeFilter === 'CLOCK_IN') {
        list = list.filter((i) => i.type === 'CLOCK_IN');
      } else if (historyTypeFilter === 'CLOCK_OUT') {
        list = list.filter((i) => i.type === 'CLOCK_OUT');
      } else if (historyTypeFilter === 'CLASSROOM') {
        list = list.filter((i) => i.category === 'CLASSROOM_ROLL_CALL');
      } else if (historyTypeFilter === 'DEBOUNCED') {
        list = list.filter((i) => i.type === 'DEBOUNCED');
      }
    }

    // Filter by search query
    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.typeLabel.toLowerCase().includes(q) ||
          i.dateStr.toLowerCase().includes(q) ||
          i.timeStr.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          (i.subject && i.subject.toLowerCase().includes(q)) ||
          (i.recordedBy && i.recordedBy.toLowerCase().includes(q)) ||
          (i.remarks && i.remarks.toLowerCase().includes(q))
      );
    }

    // Sort by type or timestamp
    list.sort((a, b) => {
      if (historySortField === 'type') {
        const typeComp = a.typeLabel.localeCompare(b.typeLabel);
        if (typeComp !== 0) {
          return historySortDirection === 'asc' ? typeComp : -typeComp;
        }
        return b.timestamp.localeCompare(a.timestamp);
      } else {
        const timeComp = b.timestamp.localeCompare(a.timestamp);
        return historySortDirection === 'desc' ? timeComp : -timeComp;
      }
    });

    return list;
  }, [studentHistory, historyTypeFilter, historySearchQuery, historySortField, historySortDirection]);

  // History counts for tab badges and filter chips
  const historyCounts = useMemo(() => {
    const total = studentHistory.length;
    const clockIn = studentHistory.filter((i) => i.type === 'CLOCK_IN').length;
    const clockOut = studentHistory.filter((i) => i.type === 'CLOCK_OUT').length;
    const classroom = studentHistory.filter((i) => i.category === 'CLASSROOM_ROLL_CALL').length;
    const debounced = studentHistory.filter((i) => i.type === 'DEBOUNCED').length;
    return { total, clockIn, clockOut, classroom, debounced };
  }, [studentHistory]);

  const handleExportStudentHistoryCSV = (student: Student, history: StudentHistoryItem[]) => {
    const headers = [
      'Learner LRN',
      'Learner Full Name',
      'Grade & Section',
      'Event Type Code',
      'Event Type Label',
      'Channel / Category',
      'US Formatted Date Time (Month Day Year hh:mm:ss)',
      'Date (YYYY-MM-DD)',
      'Time (AM/PM)',
      'ISO Timestamp',
      'Location / Gate Device',
      'Subject',
      'Verified RFID Tag UID',
      'Recorded By',
      'Remarks',
    ];

    const rows = history.map((item) => [
      `"${student.lrn}"`,
      `"${student.last_name}, ${student.first_name}"`,
      `"Grade ${student.grade_level} - ${student.section || student.section_name || ''}"`,
      `"${item.type}"`,
      `"${item.typeLabel}"`,
      `"${item.category}"`,
      `"${formatUsDateTime(item.dateStr || item.timestamp, item.timeStr)}"`,
      `"${item.dateStr}"`,
      `"${item.timeStr}"`,
      `"${item.timestamp}"`,
      `"${item.location}"`,
      `"${item.subject || 'N/A'}"`,
      `"${item.rfid || 'N/A'}"`,
      `"${item.recordedBy || 'N/A'}"`,
      `"${(item.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DEPED_ATTENDANCE_HISTORY_${student.lrn}_${student.last_name}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Fetch real-time gate turnstile tap logs
  useEffect(() => {
    const fetchTaps = () => {
      try {
        const logs = apiClient.getKioskTapLogs();
        setTapLogs(logs);
      } catch {}
    };
    fetchTaps();
    const interval = setInterval(fetchTaps, 2500);
    return () => clearInterval(interval);
  }, []);

  // DepEd Basic Education Enrollment Form (BEEF) State
  const [beefFormData, setBeefFormData] = useState({
    lrn: '',
    rfid_tag: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    extension_name: '',
    birthdate: '2012-05-15',
    sex: 'M' as 'M' | 'F',
    mother_tongue: 'Tagalog',
    is_ip: false,
    ip_community: '',
    is_4ps: false,
    household_id_4ps: '',
    has_disability: false,
    disability_type: '',
    current_address: 'Brgy. San Jose, City of San Fernando, Pampanga',
    permanent_address: 'Brgy. San Jose, City of San Fernando, Pampanga',
    father_name: '',
    father_contact: '+639171234567',
    mother_name: '',
    mother_contact: '+639181234567',
    guardian_name: '',
    guardian_contact: '+639191234567',
    last_grade_completed: 'Grade 6',
    last_school_attended: 'San Fernando Elementary School',
    last_school_id: '105942',
    grade_level: 7,
    section: 'Bonifacio',
    emergency_contact: '+639171234567',
    photo_url: '',
    psa_birth_cert_no: '',
  });

  // CSV Import State
  const [importCsvText, setImportCsvText] = useState('');
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Sync tab with initialOpenImport
  React.useEffect(() => {
    if (initialOpenImport) {
      setActiveViewTab('import_csv');
    }
  }, [initialOpenImport]);

  // Helper: Retrieve clock-in tap record for a student
  const getStudentTap = (student: Student) => {
    const sRfid = (student.rfid_tag || student.active_rfid_uid || '').replace(/\D/g, '');
    return tapLogs.find(
      (t) =>
        (t.lrn && t.lrn === student.lrn) ||
        (student.id && t.studentId === student.id) ||
        (sRfid && t.rfid.replace(/\D/g, '') === sRfid)
    );
  };

  // Filtered Students
  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase();
    const psaVal = (s.psa_birth_cert_no || s.deped_beef_details?.psa_birth_cert_no || '').toLowerCase();
    const matchesSearch = 
      !searchQuery.trim() ||
      s.first_name.toLowerCase().includes(q) ||
      s.last_name.toLowerCase().includes(q) ||
      s.lrn.includes(searchQuery) ||
      psaVal.includes(q) ||
      (s.rfid_tag && s.rfid_tag.toLowerCase().includes(q)) ||
      (s.active_rfid_uid && s.active_rfid_uid.toLowerCase().includes(q));

    const sGradeNum = String(s.grade_level || '').replace(/\D/g, '') || String(s.grade_level || '');
    const filterGradeNum = selectedGrade === 'ALL' ? '' : String(selectedGrade).replace(/\D/g, '') || selectedGrade;
    const matchesGrade = selectedGrade === 'ALL' || sGradeNum === filterGradeNum;

    const sSec = (s.section_name || s.section || '').toLowerCase();
    const filterSec = selectedSection.toLowerCase();
    const matchesSection = selectedSection === 'ALL' || sSec === filterSec || sSec.includes(filterSec) || filterSec.includes(sSec);

    return matchesSearch && matchesGrade && matchesSection;
  });

  const handleOpenCreate = () => {
    setEditingStudentId(null);
    setBeefFormData({
      lrn: `1059422${Math.floor(10000 + Math.random() * 90000)}`,
      rfid_tag: `${String(Math.floor(1000000000 + Math.random() * 9000000000))}`,
      first_name: '',
      middle_name: '',
      last_name: '',
      extension_name: '',
      birthdate: '2012-05-15',
      sex: 'M',
      mother_tongue: 'Tagalog',
      is_ip: false,
      ip_community: '',
      is_4ps: false,
      household_id_4ps: '',
      has_disability: false,
      disability_type: '',
      current_address: 'San Fernando, Pampanga',
      permanent_address: 'San Fernando, Pampanga',
      father_name: '',
      father_contact: '+639171234567',
      mother_name: '',
      mother_contact: '+639181234567',
      guardian_name: '',
      guardian_contact: '',
      last_grade_completed: 'Grade 6',
      last_school_attended: 'San Fernando Elementary School',
      last_school_id: '105942',
      grade_level: 7,
      section: 'Bonifacio',
      emergency_contact: '+639171234567',
      photo_url: `https://images.unsplash.com/photo-1544717305-2782549b5136?w=250&auto=format&fit=crop&q=80`,
      psa_birth_cert_no: `1029384756-PSA-${Math.floor(2010 + Math.random() * 3)}`,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudentId(student.id);
    const details = student.deped_beef_details || {};
    const rawRfid = (student.rfid_tag || student.active_rfid_uid || '').replace(/\D/g, '').slice(0, 10);
    const cleanRfid = rawRfid ? rawRfid.padStart(10, '0') : '';
    const psaVal = student.psa_birth_cert_no || details.psa_birth_cert_no || '';

    setBeefFormData({
      lrn: student.lrn,
      rfid_tag: cleanRfid,
      first_name: student.first_name,
      middle_name: student.middle_name || '',
      last_name: student.last_name,
      extension_name: student.extension_name || details.extension_name || '',
      birthdate: student.birthdate || details.birthdate || '2012-05-15',
      sex: ((student.gender || student.sex || 'M') as 'M' | 'F') === 'F' ? 'F' : 'M',
      mother_tongue: student.mother_tongue || details.mother_tongue || 'Tagalog',
      is_ip: details.is_ip || false,
      ip_community: details.ip_community || '',
      is_4ps: student.is_4ps_beneficiary ?? details.is_4ps ?? false,
      household_id_4ps: student.household_4ps_id || details.household_id_4ps || '',
      has_disability: student.has_disability ?? details.has_disability ?? false,
      disability_type: student.disability_details || details.disability_type || '',
      current_address: details.current_address || `${student.current_barangay || ''}, ${student.current_municipality_city || ''}, ${student.current_province || 'Pampanga'}`.replace(/^,\s*/, ''),
      permanent_address: details.permanent_address || 'Pampanga',
      father_name: details.father_name || (student.father_last_name ? `${student.father_first_name || ''} ${student.father_last_name}`.trim() : ''),
      father_contact: details.father_contact || student.primary_sms_phone || '',
      mother_name: details.mother_name || (student.mother_first_name ? `${student.mother_first_name} ${student.mother_maiden_last_name || ''}`.trim() : ''),
      mother_contact: details.mother_contact || '',
      guardian_name: details.guardian_name || '',
      guardian_contact: details.guardian_contact || '',
      last_grade_completed: details.last_grade_completed || 'Grade 6',
      last_school_attended: details.last_school_attended || 'Elementary',
      last_school_id: details.last_school_id || '105942',
      grade_level: Number(String(student.grade_level || '7').replace(/\D/g, '')) || 7,
      section: student.section || student.section_name || 'Bonifacio',
      emergency_contact: student.emergency_contact || student.primary_sms_phone || '+639171234567',
      photo_url: student.photo_url || '',
      psa_birth_cert_no: psaVal,
    });
    setIsDetailsModalOpen(false);
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (beefFormData.rfid_tag && !/^\d{10}$/.test(beefFormData.rfid_tag)) {
      alert('RFID Turnstile Tag must be a 10-digit number only (e.g. 0008522301).');
      return;
    }

    try {
      const beefPayload = {
        extension_name: beefFormData.extension_name,
        birthdate: beefFormData.birthdate,
        psa_birth_cert_no: beefFormData.psa_birth_cert_no,
        mother_tongue: beefFormData.mother_tongue,
        is_ip: beefFormData.is_ip,
        ip_community: beefFormData.ip_community,
        is_4ps: beefFormData.is_4ps,
        household_id_4ps: beefFormData.household_id_4ps,
        has_disability: beefFormData.has_disability,
        disability_type: beefFormData.disability_type,
        current_address: beefFormData.current_address,
        permanent_address: beefFormData.permanent_address,
        father_name: beefFormData.father_name,
        father_contact: beefFormData.father_contact,
        mother_name: beefFormData.mother_name,
        mother_contact: beefFormData.mother_contact,
        guardian_name: beefFormData.guardian_name,
        guardian_contact: beefFormData.guardian_contact,
        last_grade_completed: beefFormData.last_grade_completed,
        last_school_attended: beefFormData.last_school_attended,
        last_school_id: beefFormData.last_school_id,
      };

      if (editingStudentId) {
        await studentsApi.update(editingStudentId, {
          lrn: beefFormData.lrn,
          psa_birth_cert_no: beefFormData.psa_birth_cert_no,
          first_name: beefFormData.first_name,
          middle_name: beefFormData.middle_name,
          last_name: beefFormData.last_name,
          gender: beefFormData.sex,
          grade_level: Number(beefFormData.grade_level),
          section: beefFormData.section,
          rfid_tag: beefFormData.rfid_tag,
          emergency_contact: beefFormData.emergency_contact || beefFormData.father_contact || beefFormData.mother_contact,
          photo_url: beefFormData.photo_url,
          deped_beef_details: {
            ...beefPayload,
            psa_birth_cert_no: beefFormData.psa_birth_cert_no,
          },
        });
      } else {
        await studentsApi.create({
          lrn: beefFormData.lrn,
          psa_birth_cert_no: beefFormData.psa_birth_cert_no,
          first_name: beefFormData.first_name,
          middle_name: beefFormData.middle_name,
          last_name: beefFormData.last_name,
          gender: beefFormData.sex,
          grade_level: Number(beefFormData.grade_level),
          section: beefFormData.section,
          rfid_tag: beefFormData.rfid_tag,
          emergency_contact: beefFormData.emergency_contact || beefFormData.father_contact || beefFormData.mother_contact,
          photo_url: beefFormData.photo_url,
          deped_beef_details: {
            ...beefPayload,
            psa_birth_cert_no: beefFormData.psa_birth_cert_no,
          },
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(`Error saving student: ${err.message}`);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete student ${name}? This record will be archived.`)) return;
    try {
      await studentsApi.delete(id);
      onRefresh();
    } catch (err: any) {
      alert(`Error deleting student: ${err.message}`);
    }
  };

  const handleBulkImportCsv = async () => {
    if (!importCsvText.trim()) {
      alert('Please paste CSV data or template content first.');
      return;
    }
    setIsImporting(true);
    setImportLogs([]);

    const lines = importCsvText.trim().split('\n');
    const logs: string[] = [];
    let count = 0;

    // Check header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const lrnIdx = headers.indexOf('lrn');
    const firstIdx = headers.indexOf('first_name');
    const lastIdx = headers.indexOf('last_name');
    const gradeIdx = headers.indexOf('grade_level');
    const secIdx = headers.indexOf('section');
    const rfidIdx = headers.indexOf('rfid_tag');
    const contactIdx = headers.indexOf('emergency_contact');

    if (lrnIdx === -1 || firstIdx === -1 || lastIdx === -1) {
      logs.push('❌ Invalid Header: CSV must contain at least lrn, first_name, last_name columns.');
      setImportLogs(logs);
      setIsImporting(false);
      return;
    }

    logs.push(`🔍 Found ${lines.length - 1} records to import into DepEd BEEF Registry...`);

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(',').map(p => p.trim());
      const lrn = parts[lrnIdx];
      const firstName = parts[firstIdx];
      const lastName = parts[lastIdx];
      const grade = gradeIdx !== -1 && parts[gradeIdx] ? parseInt(parts[gradeIdx], 10) : 7;
      const sec = secIdx !== -1 && parts[secIdx] ? parts[secIdx] : 'Bonifacio';
      const rfid = rfidIdx !== -1 && parts[rfidIdx] ? parts[rfidIdx] : `${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const contact = contactIdx !== -1 && parts[contactIdx] ? parts[contactIdx] : '+639171234567';

      try {
        await studentsApi.create({
          lrn,
          first_name: firstName,
          middle_name: '',
          last_name: lastName,
          gender: 'M',
          grade_level: grade,
          section: sec,
          rfid_tag: rfid,
          emergency_contact: contact,
          photo_url: `https://images.unsplash.com/photo-${1534528741775 + i}?w=250&auto=format&fit=crop&q=80`,
          deped_beef_details: {
            mother_tongue: 'Tagalog',
            is_4ps: false,
            current_address: 'San Fernando, Pampanga',
            emergency_contact: contact,
          }
        });
        count++;
        logs.push(`✅ [${i}] Imported Learner: ${lrn} - ${lastName}, ${firstName} (G${grade}-${sec})`);
      } catch (err: any) {
        logs.push(`⚠️ [${i}] Skipped ${lrn}: ${err.message || 'Duplicate LRN or server error'}`);
      }
    }

    logs.push(`🎉 Import completed! Successfully added ${count} learner records.`);
    setImportLogs(logs);
    setIsImporting(false);
    onRefresh();
  };

  const handleExportDepedCsv = () => {
    if (filteredStudents.length === 0) {
      alert('No learner records found to export. Please adjust your filters or enroll learners first.');
      return;
    }

    // DepEd Enhanced Basic Education Enrollment Form (BEEF) Official Standard CSV Schema
    const headers = [
      'DepEd_School_ID',
      'LRN',
      'PSA_Birth_Cert_No',
      'Last_Name',
      'First_Name',
      'Middle_Name',
      'Extension_Name',
      'Birthdate',
      'Age',
      'Sex',
      'Mother_Tongue',
      'Is_IP',
      'IP_Community',
      'Is_4Ps',
      'Household_ID_4Ps',
      'Has_Disability',
      'Disability_Type',
      'Grade_Level',
      'Section',
      'RFID_Smart_Card_10Digit',
      'RFID_Gate_Turnstile_Tap_Status',
      'Gate_Tap_Timestamp_US_Format',
      'Current_Address',
      'Permanent_Address',
      'Father_Name',
      'Father_Contact',
      'Mother_Name',
      'Mother_Contact',
      'Guardian_Name',
      'Guardian_Contact',
      'Emergency_SMS_Contact',
      'Last_Grade_Completed',
      'Last_School_Attended',
      'Last_School_ID'
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredStudents.map((s) => {
      const details = s.deped_beef_details || {};
      const tap = getStudentTap(s);
      const rfidClean = (s.rfid_tag || s.active_rfid_uid || '').replace(/\D/g, '').slice(0, 10);
      const psaNo = s.psa_birth_cert_no || details.psa_birth_cert_no || '';

      return [
        escapeCsv(s.school_id || school?.deped_school_id || '101692'),
        escapeCsv(s.lrn),
        escapeCsv(psaNo),
        escapeCsv(s.last_name),
        escapeCsv(s.first_name),
        escapeCsv(s.middle_name || ''),
        escapeCsv(details.extension_name || s.extension_name || ''),
        escapeCsv(s.birthdate || details.birthdate || ''),
        escapeCsv(s.age || '15'),
        escapeCsv((s.gender || s.sex || 'M') === 'F' || s.sex === 'Female' ? 'Female' : 'Male'),
        escapeCsv(details.mother_tongue || s.mother_tongue || 'Tagalog'),
        escapeCsv(details.is_ip ? 'YES' : 'NO'),
        escapeCsv(details.ip_community || 'None'),
        escapeCsv((details.is_4ps || s.is_4ps_beneficiary) ? 'YES' : 'NO'),
        escapeCsv(details.household_id_4ps || s.household_4ps_id || 'N/A'),
        escapeCsv((details.has_disability || s.has_disability) ? 'YES' : 'NO'),
        escapeCsv(details.disability_type || s.disability_details || 'None'),
        escapeCsv(String(s.grade_level || '7')),
        escapeCsv(s.section_name || s.section || 'Bonifacio'),
        escapeCsv(rfidClean),
        escapeCsv(tap ? (tap.status === 'CLOCK_OUT' ? 'CLOCKED_OUT' : 'CLOCKED_IN') : 'NO_GATE_TAP'),
        escapeCsv(tap ? formatUsDateTime(tap.dateStr || tap.isoTimestamp, tap.timeStr) : 'None'),
        escapeCsv(details.current_address || `${s.current_barangay || ''}, ${s.current_municipality_city || ''}, ${s.current_province || 'Pampanga'}`.replace(/^,\s*/, '')),
        escapeCsv(details.permanent_address || details.current_address || 'Pampanga'),
        escapeCsv(details.father_name || (s.father_last_name ? `${s.father_first_name || ''} ${s.father_last_name}`.trim() : 'N/A')),
        escapeCsv(details.father_contact || s.primary_sms_phone || 'N/A'),
        escapeCsv(details.mother_name || (s.mother_first_name ? `${s.mother_first_name} ${s.mother_maiden_last_name || ''}`.trim() : 'N/A')),
        escapeCsv(details.mother_contact || 'N/A'),
        escapeCsv(details.guardian_name || 'N/A'),
        escapeCsv(details.guardian_contact || 'N/A'),
        escapeCsv(s.emergency_contact || s.primary_sms_phone || '+639170000000'),
        escapeCsv(details.last_grade_completed || 'Grade 6'),
        escapeCsv(details.last_school_attended || 'Elementary'),
        escapeCsv(details.last_school_id || '105942')
      ].join(',');
    });

    // Prepend UTF-8 BOM so Excel opens Filipino names and accented characters cleanly
    const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().split('T')[0];
    const gradeTag = selectedGrade === 'ALL' ? 'AllGrades' : `Grade${selectedGrade}`;
    const secTag = selectedSection === 'ALL' ? 'AllSections' : selectedSection.replace(/\s+/g, '_');
    link.download = `DepEd_BEEF_Learners_${gradeTag}_${secTag}_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const sampleCsvTemplate = `lrn,first_name,last_name,grade_level,section,rfid_tag,emergency_contact
105942200101,Juan,Dela Cruz,7,Bonifacio,0008522301,+639171112233
105942200102,Maria,Santos,7,Bonifacio,0008522302,+639172223344
105942200103,Joshua,Reyes,8,Rizal,0008522303,+639173334455
105942200104,Angela,Aquino,9,Luna,0008522304,+639174445566
105942200105,Gabriel,Mendoza,10,Mabini,0008522305,+639175556677`;

  useEffect(() => {
    if (initialOpenImport) {
      setActiveViewTab('import_csv');
      if (!importCsvText) {
        setImportCsvText(sampleCsvTemplate);
      }
    }
  }, [initialOpenImport]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <BookOpen className="w-3.5 h-3.5 inline mr-1" /> DepEd Basic Education Enrollment Form (BEEF) Repository
            </span>
            <span className="text-xs text-slate-400 font-mono">School: {school.name}</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Learner &amp; Student Records Database</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Dedicated multi-tenant database supporting 12-digit DepEd LRNs, socioeconomic indicators (4Ps/IP), PSA validation, and parent notification contacts.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Subtab Toggle */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveViewTab('roster')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeViewTab === 'roster'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Learners Directory ({filteredStudents.length})
            </button>
            {canManage && (
              <button
                onClick={() => {
                  setActiveViewTab('import_csv');
                  if (!importCsvText) setImportCsvText(sampleCsvTemplate);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeViewTab === 'import_csv'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Batch CSV Ingestion</span>
              </button>
            )}
          </div>

          {activeViewTab === 'roster' && (
            <button
              onClick={handleExportDepedCsv}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-2 shadow shrink-0"
              title="Export database records as DepEd CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export DepEd CSV</span>
            </button>
          )}

          {canManage && activeViewTab === 'roster' && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-blue-600/25 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll Learner (BEEF)</span>
            </button>
          )}
        </div>
      </div>

      {/* DEDICATED INLINE BATCH CSV / EXCEL INGESTION HUB */}
      {activeViewTab === 'import_csv' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">DepEd Bulk Learner Ingestion Hub</h3>
                <p className="text-xs text-slate-400">Paste CSV or tab-delimited records matching DepEd BEEF schema</p>
              </div>
            </div>
            <button
              onClick={() => setActiveViewTab('roster')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              &larr; Back to Learner Directory
            </button>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
            <strong>Required Column Order:</strong>
            <code className="block mt-1 font-mono text-blue-200 bg-slate-950 p-2.5 rounded-lg border border-blue-900/40">
              lrn,first_name,last_name,grade_level,section,rfid_tag,emergency_contact
            </code>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">CSV Data Stream Input</label>
              <button
                type="button"
                onClick={() => setImportCsvText(sampleCsvTemplate)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Load Official DepEd BEEF Template
              </button>
            </div>
            <textarea
              rows={9}
              value={importCsvText}
              onChange={(e) => setImportCsvText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500 shadow-inner"
              placeholder="Paste DepEd CSV rows here..."
            />
          </div>

          {importLogs.length > 0 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-h-48 overflow-y-auto space-y-1 font-mono text-[11px]">
              <div className="text-xs font-bold text-slate-400 pb-1 mb-1 border-b border-slate-800">
                Live Ingestion Audit Log:
              </div>
              {importLogs.map((log, i) => (
                <div key={i} className={log.startsWith('❌') ? 'text-rose-400 font-semibold' : log.startsWith('⚠️') ? 'text-amber-400' : 'text-slate-300'}>
                  {log}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500 font-mono">
              {importCsvText ? `${importCsvText.trim().split('\n').length - 1} records detected` : 'No data loaded'}
            </span>
            <button
              disabled={isImporting || !importCsvText.trim()}
              onClick={handleBulkImportCsv}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition"
            >
              <Upload className="w-4 h-4" />
              <span>{isImporting ? 'Ingesting Learner Records...' : 'Execute DepEd BEEF Batch Ingestion'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ROSTER TABLE VIEW */}
      {activeViewTab === 'roster' && (
        <>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by learner LRN, student full name, or RFID card ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400">Grade:</span>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Grades (7-12)</option>
              <option value="7">Grade 7</option>
              <option value="8">Grade 8</option>
              <option value="9">Grade 9</option>
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Section:</span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Sections</option>
              {SECTIONS_SEED.map(sec => (
                <option key={sec.id} value={sec.name}>{sec.name} (G{sec.grade_level})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Learners Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">Registered Learners ({filteredStudents.length})</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportDepedCsv}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-2 shadow"
              title="Export database matching current filters as DepEd CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export DepEd CSV ({filteredStudents.length})</span>
            </button>
            <span className="text-xs text-slate-500 hidden md:inline">DepEd Order No. 03, s. 2018 Compliant</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Learner Profile</th>
                <th className="px-5 py-3.5">LRN (12-Digit)</th>
                <th className="px-5 py-3.5">PSA Birth Cert No.</th>
                <th className="px-5 py-3.5">Grade & Section</th>
                <th className="px-5 py-3.5">RFID Smart Card</th>
                <th className="px-5 py-3.5">RFID Gate Turnstile Status</th>
                <th className="px-5 py-3.5">BEEF Status</th>
                <th className="px-5 py-3.5">Parent / Contact</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    No learners match the current search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const details = s.deped_beef_details || {};
                  const psaNo = s.psa_birth_cert_no || details.psa_birth_cert_no || '';
                  const rfidClean = (s.rfid_tag || s.active_rfid_uid || '').replace(/\D/g, '').slice(0, 10);
                  const tap = getStudentTap(s);

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      {/* Learner Profile with Clickable Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={s.photo_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80`}
                            alt={s.first_name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-700 bg-slate-800 flex-shrink-0 cursor-pointer hover:border-blue-400 transition"
                            onClick={() => handleOpenEdit(s)}
                            title="Click to edit learner details"
                            onError={(e: any) => {
                              e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(s)}
                              className="text-left font-semibold text-white hover:text-blue-400 hover:underline transition flex items-center gap-1 group cursor-pointer"
                              title="Click to edit learner details"
                            >
                              <span>
                                {s.last_name}, {s.first_name} {s.middle_name ? `${s.middle_name[0]}.` : ''} {details.extension_name || s.extension_name || ''}
                              </span>
                              <Edit3 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition" />
                            </button>
                            <div className="text-xs text-slate-400">
                              {s.gender === 'M' || s.sex === 'Male' ? 'Male' : 'Female'} • Age {s.age || '15'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Separate LRN Field (Clickable to Edit) */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(s)}
                          className="font-mono text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 group cursor-pointer"
                          title="Click to edit learner details"
                        >
                          <span>{s.lrn}</span>
                          <Edit3 className="w-2.5 h-2.5 text-blue-400/60 opacity-0 group-hover:opacity-100 transition" />
                        </button>
                        <span className="text-[10px] text-slate-500 block">DepEd Learner ID</span>
                      </td>

                      {/* Separate PSA Certificate Number Field */}
                      <td className="px-5 py-4">
                        {psaNo ? (
                          <div className="font-mono text-xs text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg inline-block">
                            {psaNo}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">No PSA Attached</span>
                        )}
                      </td>

                      {/* Grade & Section */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {String(s.grade_level || '').startsWith('Grade') ? s.grade_level : `Grade ${s.grade_level}`} - {s.section_name || s.section || 'Unassigned'}
                        </span>
                      </td>

                      {/* RFID Smart Card (10-Digit Only) */}
                      <td className="px-5 py-4 font-mono text-xs text-slate-300">
                        {rfidClean ? (
                          <div className="flex items-center gap-1.5 text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2.5 py-1 rounded-lg w-fit">
                            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                            <span>{rfidClean}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 italic">Unassigned</span>
                        )}
                      </td>

                      {/* RFID Gate Turnstile Status */}
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudent(s);
                            setDetailsTab('history');
                            setIsDetailsModalOpen(true);
                          }}
                          className="text-left group/tap cursor-pointer focus:outline-none"
                          title="Click to view complete attendance & tap history (clock-in, clock-out, classroom)"
                        >
                          {tap ? (
                            <div className="inline-flex flex-col gap-0.5">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover/tap:bg-emerald-500/20 group-hover/tap:border-emerald-400/40 transition">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span>{tap.status === 'CLOCK_OUT' ? 'Clocked Out' : 'Clocked In'}</span>
                              </div>
                              <span className="text-[11px] text-slate-300 font-mono pl-1 pt-0.5">
                                {formatUsDateTime(tap.dateStr || tap.isoTimestamp, tap.timeStr)}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono pl-1 group-hover/tap:text-cyan-400 transition flex items-center gap-1">
                                <span>Tag: {tap.rfid}</span> • <span className="underline decoration-dotted">View History</span>
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex flex-col gap-0.5">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 group-hover/tap:bg-slate-700 group-hover/tap:text-slate-200 transition">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                                <span>No Gate Tap</span>
                              </div>
                              <span className="text-[10px] text-slate-500 italic pl-1">
                                Awaiting RFID Scan
                              </span>
                            </div>
                          )}
                        </button>
                      </td>

                      {/* BEEF Status */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(details.is_4ps || s.is_4ps_beneficiary) && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                              4Ps
                            </span>
                          )}
                          {details.is_ip && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-semibold border border-amber-500/20">
                              IP
                            </span>
                          )}
                          {(details.has_disability || s.has_disability) && (
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-semibold border border-purple-500/20">
                              SNED
                            </span>
                          )}
                          {!(details.is_4ps || s.is_4ps_beneficiary) && !details.is_ip && !(details.has_disability || s.has_disability) && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700">
                              Standard
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Parent / SMS Contact */}
                      <td className="px-5 py-4 text-xs text-slate-400">
                        <div>{s.emergency_contact || s.primary_sms_phone || details.father_contact || details.mother_contact || 'N/A'}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          {details.father_name || details.mother_name || details.guardian_name || (s.father_last_name ? `${s.father_first_name || ''} ${s.father_last_name}` : 'Guardian Registered')}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setDetailsTab('history');
                              setIsDetailsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition"
                            title="View Attendance & Tap History (Clock-In, Clock-Out & Attendance sortable by type)"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedStudent(s);
                              setDetailsTab('profile');
                              setIsDetailsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                            title="View Full DepEd BEEF Record"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canManage && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(s)}
                                className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition"
                                title="Edit Learner BEEF Information"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(s.id, `${s.last_name}, ${s.first_name}`)}
                                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                                title="Delete/Archive Student"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* DepEd BEEF Creation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 glass-modal-backdrop bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {editingStudentId ? 'Edit Learner BEEF Record' : 'Enroll Learner (DepEd BEEF)'}
                  </h3>
                  <p className="text-xs text-slate-400">DepEd Basic Education Enrollment Form (Annex A)</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveStudent} className="p-6 overflow-y-auto space-y-6">
              {/* Section 1: Learner Basic Identification */}
              <div>
                <h4 className="text-xs uppercase tracking-wider font-bold text-blue-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Part 1: Learner Identification & Biometrics
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Learner Reference Number (LRN) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={12}
                      value={beefFormData.lrn}
                      onChange={(e) => setBeefFormData({ ...beefFormData, lrn: e.target.value })}
                      placeholder="12-digit DepEd LRN (e.g. 105942200001)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">
                        RFID Turnstile Tag ID (10 Digits)
                      </label>
                      <span className="text-[10px] font-mono text-cyan-400">
                        {beefFormData.rfid_tag.length}/10 digits
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={beefFormData.rfid_tag}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setBeefFormData({ ...beefFormData, rfid_tag: val });
                      }}
                      placeholder="10-digit number only (e.g. 0008522301)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-cyan-400 font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">10-digit numerical card ID for gate turnstile tap</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      PSA Birth Certificate No.
                    </label>
                    <input
                      type="text"
                      value={beefFormData.psa_birth_cert_no}
                      onChange={(e) => setBeefFormData({ ...beefFormData, psa_birth_cert_no: e.target.value })}
                      placeholder="e.g. 1029384756-PSA-2010"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Separate PSA Certificate registry number</p>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={beefFormData.first_name}
                      onChange={(e) => setBeefFormData({ ...beefFormData, first_name: e.target.value })}
                      placeholder="e.g. Juan"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Middle Name</label>
                    <input
                      type="text"
                      value={beefFormData.middle_name}
                      onChange={(e) => setBeefFormData({ ...beefFormData, middle_name: e.target.value })}
                      placeholder="e.g. Castro"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={beefFormData.last_name}
                      onChange={(e) => setBeefFormData({ ...beefFormData, last_name: e.target.value })}
                      placeholder="e.g. Dela Cruz"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Extension (Jr/III)</label>
                    <input
                      type="text"
                      value={beefFormData.extension_name}
                      onChange={(e) => setBeefFormData({ ...beefFormData, extension_name: e.target.value })}
                      placeholder="e.g. Jr., III"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Birthdate, Sex, Mother Tongue, Photo URL */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={beefFormData.birthdate}
                      onChange={(e) => setBeefFormData({ ...beefFormData, birthdate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Sex</label>
                    <select
                      value={beefFormData.sex}
                      onChange={(e) => setBeefFormData({ ...beefFormData, sex: e.target.value as 'M' | 'F' })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Mother Tongue</label>
                    <input
                      type="text"
                      value={beefFormData.mother_tongue}
                      onChange={(e) => setBeefFormData({ ...beefFormData, mother_tongue: e.target.value })}
                      placeholder="e.g. Tagalog, Kapampangan"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Photo URL</label>
                    <input
                      type="text"
                      value={beefFormData.photo_url}
                      onChange={(e) => setBeefFormData({ ...beefFormData, photo_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Enrollment Placement */}
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs uppercase tracking-wider font-bold text-indigo-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                  Part 2: Grade Level & Section Placement
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Grade Level *</label>
                    <select
                      value={beefFormData.grade_level}
                      onChange={(e) => setBeefFormData({ ...beefFormData, grade_level: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value={7}>Grade 7</option>
                      <option value={8}>Grade 8</option>
                      <option value={9}>Grade 9</option>
                      <option value={10}>Grade 10</option>
                      <option value={11}>Grade 11</option>
                      <option value={12}>Grade 12</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Section *</label>
                    <select
                      value={beefFormData.section}
                      onChange={(e) => setBeefFormData({ ...beefFormData, section: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      {SECTIONS_SEED.map(sec => (
                        <option key={sec.id} value={sec.name}>{sec.name} (Grade {sec.grade_level})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Last School Attended</label>
                    <input
                      type="text"
                      value={beefFormData.last_school_attended}
                      onChange={(e) => setBeefFormData({ ...beefFormData, last_school_attended: e.target.value })}
                      placeholder="School name"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Socioeconomic and Special Needs (DepEd BEEF Mandate) */}
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs uppercase tracking-wider font-bold text-emerald-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Part 3: Socioeconomic & Special Needs Indicators
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 4Ps Checkbox */}
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={beefFormData.is_4ps}
                        onChange={(e) => setBeefFormData({ ...beefFormData, is_4ps: e.target.checked })}
                        className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold text-white">4Ps Beneficiary Household</span>
                    </label>
                    {beefFormData.is_4ps && (
                      <input
                        type="text"
                        value={beefFormData.household_id_4ps}
                        onChange={(e) => setBeefFormData({ ...beefFormData, household_id_4ps: e.target.value })}
                        placeholder="4Ps Household ID No."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    )}
                  </div>

                  {/* IP Checkbox */}
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={beefFormData.is_ip}
                        onChange={(e) => setBeefFormData({ ...beefFormData, is_ip: e.target.checked })}
                        className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold text-white">Indigenous People (IP)</span>
                    </label>
                    {beefFormData.is_ip && (
                      <input
                        type="text"
                        value={beefFormData.ip_community}
                        onChange={(e) => setBeefFormData({ ...beefFormData, ip_community: e.target.value })}
                        placeholder="IP Community Name (e.g. Aeta)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    )}
                  </div>

                  {/* Disability Checkbox */}
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={beefFormData.has_disability}
                        onChange={(e) => setBeefFormData({ ...beefFormData, has_disability: e.target.checked })}
                        className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold text-white">Special Needs / Disability</span>
                    </label>
                    {beefFormData.has_disability && (
                      <input
                        type="text"
                        value={beefFormData.disability_type}
                        onChange={(e) => setBeefFormData({ ...beefFormData, disability_type: e.target.value })}
                        placeholder="Type (e.g. Visual Impairment)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Parent / Guardian & SMS Notification Contacts */}
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs uppercase tracking-wider font-bold text-amber-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Part 4: Parents/Guardian Details & Turnstile SMS Recipients
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Father's Full Name</label>
                    <input
                      type="text"
                      value={beefFormData.father_name}
                      onChange={(e) => setBeefFormData({ ...beefFormData, father_name: e.target.value })}
                      placeholder="e.g. Pedro Dela Cruz"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      value={beefFormData.father_contact}
                      onChange={(e) => setBeefFormData({ ...beefFormData, father_contact: e.target.value })}
                      placeholder="Father SMS (+639...)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 mt-1 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Mother's Maiden Name</label>
                    <input
                      type="text"
                      value={beefFormData.mother_name}
                      onChange={(e) => setBeefFormData({ ...beefFormData, mother_name: e.target.value })}
                      placeholder="e.g. Maria Santos"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      value={beefFormData.mother_contact}
                      onChange={(e) => setBeefFormData({ ...beefFormData, mother_contact: e.target.value })}
                      placeholder="Mother SMS (+639...)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 mt-1 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency / Kiosk SMS Contact *</label>
                    <input
                      type="text"
                      required
                      value={beefFormData.emergency_contact}
                      onChange={(e) => setBeefFormData({ ...beefFormData, emergency_contact: e.target.value })}
                      placeholder="+639171234567"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-amber-400 font-mono focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Recipient for Semaphore & PhilSMS turnstile tap dispatch.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-6 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingStudentId ? 'Update BEEF Record' : 'Save & Register Learner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV / Excel Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 glass-modal-backdrop bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Bulk Import DepEd Learner Roster</h3>
                  <p className="text-xs text-slate-400">Import CSV or tab-delimited Excel list with BEEF fields</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
                <strong>Format Guide:</strong> Paste your comma-separated values (CSV) below. Columns should match:
                <code className="block mt-1 font-mono text-blue-200 bg-slate-950 p-2 rounded">
                  lrn,first_name,last_name,grade_level,section,rfid_tag,emergency_contact
                </code>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">CSV Data Input</label>
                <textarea
                  rows={8}
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                  placeholder="Paste CSV rows here..."
                ></textarea>
              </div>

              {importLogs.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1 font-mono text-[11px]">
                  {importLogs.map((log, i) => (
                    <div key={i} className={log.startsWith('❌') ? 'text-rose-400' : log.startsWith('⚠️') ? 'text-amber-400' : 'text-slate-300'}>
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <button
                onClick={() => setImportCsvText(sampleCsvTemplate)}
                className="text-xs text-blue-400 hover:underline flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Load Sample DepEd Roster Template
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  disabled={isImporting}
                  onClick={handleBulkImportCsv}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  {isImporting ? 'Importing Learners...' : 'Execute DepEd Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student BEEF Details View Modal */}
      {isDetailsModalOpen && selectedStudent && (() => {
        const tap = getStudentTap(selectedStudent);
        const details = selectedStudent.deped_beef_details || {};
        const psaVal = selectedStudent.psa_birth_cert_no || details.psa_birth_cert_no || '';
        const rfidVal = (selectedStudent.rfid_tag || selectedStudent.active_rfid_uid || '').replace(/\D/g, '').slice(0, 10);

        return (
          <div className="fixed inset-0 z-50 glass-modal-backdrop bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Top Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedStudent.photo_url || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80`}
                    alt={selectedStudent.first_name}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-blue-500/50 flex-shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                      <span>{selectedStudent.last_name}, {selectedStudent.first_name} {selectedStudent.middle_name || ''} {details.extension_name || selectedStudent.extension_name || ''}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                        Grade {selectedStudent.grade_level} - {selectedStudent.section || selectedStudent.section_name || 'Bonifacio'}
                      </span>
                    </h3>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-blue-400 font-mono">LRN: {selectedStudent.lrn}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-emerald-400 font-mono">PSA: {psaVal || 'Verified on File'}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-cyan-400 font-mono">RFID: {rfidVal || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canManage && (
                    <button
                      onClick={() => handleOpenEdit(selectedStudent)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Navigation Tabs */}
              <div className="px-6 py-2.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDetailsTab('profile')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                      detailsTab === 'profile'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Learner BEEF Profile</span>
                  </button>

                  <button
                    onClick={() => setDetailsTab('history')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                      detailsTab === 'history'
                        ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Attendance & Tap History</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      detailsTab === 'history' ? 'bg-cyan-950 text-cyan-200' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {studentHistory.length}
                    </span>
                  </button>
                </div>

                {detailsTab === 'history' && (
                  <button
                    onClick={() => handleExportStudentHistoryCSV(selectedStudent, filteredAndSortedHistory)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition border border-slate-700 shadow-sm"
                    title="Export all student attendance and tap logs as CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Export History CSV</span>
                  </button>
                )}
              </div>

              {/* Tab 1: Learner BEEF Profile */}
              {detailsTab === 'profile' && (
                <div className="p-6 space-y-4 overflow-y-auto text-sm text-slate-300 flex-1">
                  {/* RFID Gate Turnstile Attendance Tap Status Card */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-cyan-400" />
                        RFID Gate Turnstile Status &amp; Clock-In Record
                      </span>
                      {tap ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          tap.status === 'CLOCK_OUT'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          <span className={`w-2 h-2 rounded-full animate-pulse ${
                            tap.status === 'CLOCK_OUT' ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}></span>
                          {tap.status === 'CLOCK_OUT' ? 'Clocked Out' : 'Clocked In'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                          No Tap Today
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                      <div>
                        <span className="text-slate-500 block">Gate Tap Timestamp (US Format)</span>
                        <span className="font-mono text-white font-medium">
                          {tap ? formatUsDateTime(tap.dateStr || tap.isoTimestamp, tap.timeStr) : 'Pending Gate Scan'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Verified RFID (10-Digit)</span>
                        <span className="font-mono text-cyan-400">{tap?.rfid || rfidVal || 'None'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Turnstile Gate Device</span>
                        <span className="text-slate-300">
                          {tap ? (tap.status === 'CLOCK_OUT' ? 'Main Exit Turnstile #2' : 'Main Entrance Turnstile #1') : 'Awaiting Entry'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Primary Student Identification */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-xs text-slate-500 block">Learner Reference No. (LRN)</span>
                      <span className="font-mono text-blue-400 font-semibold">{selectedStudent.lrn}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">PSA Birth Certificate No.</span>
                      <span className="font-mono text-emerald-400 font-semibold">{psaVal || 'Verified on File'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Grade & Section</span>
                      <span className="font-semibold text-white">Grade {selectedStudent.grade_level} - {selectedStudent.section || selectedStudent.section_name || 'Bonifacio'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Sex & Mother Tongue</span>
                      <span className="font-semibold text-white">{(selectedStudent.gender || selectedStudent.sex) === 'M' || selectedStudent.sex === 'Male' ? 'Male' : 'Female'} • {details.mother_tongue || selectedStudent.mother_tongue || 'Tagalog'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-slate-500 block">Emergency SMS Contact (PhilSMS / Semaphore)</span>
                      <span className="font-mono text-amber-400 font-semibold">{selectedStudent.emergency_contact || selectedStudent.primary_sms_phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-bold text-slate-400">Socioeconomic DepEd Indicators</h4>
                    <div className="flex gap-2">
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold ${details.is_4ps || selectedStudent.is_4ps_beneficiary ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
                        4Ps: {details.is_4ps || selectedStudent.is_4ps_beneficiary ? `Yes (ID: ${details.household_id_4ps || selectedStudent.household_4ps_id || 'Active'})` : 'No'}
                      </span>
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold ${details.is_ip ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'}`}>
                        IP: {details.is_ip ? `Yes (${details.ip_community || 'Member'})` : 'No'}
                      </span>
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold ${details.has_disability || selectedStudent.has_disability ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-500'}`}>
                        SNED: {details.has_disability || selectedStudent.has_disability ? `Yes (${details.disability_type || selectedStudent.disability_details || 'Special Needs'})` : 'No'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 block">Current Address</span>
                    <p className="text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                      {details.current_address || 'Brgy. Sawat, Urbiztondo, Pangasinan'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 block">Parents / Guardian Registered</span>
                    <p className="text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                      Father: {details.father_name || (selectedStudent.father_last_name ? `${selectedStudent.father_first_name || ''} ${selectedStudent.father_last_name}` : 'N/A')} ({details.father_contact || selectedStudent.primary_sms_phone || 'None'}) <br />
                      Mother: {details.mother_name || (selectedStudent.mother_first_name ? `${selectedStudent.mother_first_name} ${selectedStudent.mother_maiden_last_name || ''}` : 'N/A')} ({details.mother_contact || 'None'})
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Attendance & Tap History (Sortable by Type) */}
              {detailsTab === 'history' && (
                <div className="p-6 space-y-4 overflow-y-auto text-sm text-slate-300 flex-1">
                  {/* KPI Quick Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                      <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                        <span>Total Events</span>
                        <History className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="text-2xl font-bold text-white mt-1">{historyCounts.total}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Recorded ledger logs</div>
                    </div>

                    <div className="bg-slate-950 border border-emerald-500/20 p-3.5 rounded-xl bg-emerald-500/5">
                      <div className="text-[11px] font-semibold text-emerald-400 flex items-center justify-between">
                        <span>Clock-In Taps</span>
                        <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-bold text-emerald-400 mt-1">{historyCounts.clockIn}</div>
                      <div className="text-[10px] text-emerald-500 mt-0.5">Gate turnstile arrivals</div>
                    </div>

                    <div className="bg-slate-950 border border-indigo-500/20 p-3.5 rounded-xl bg-indigo-500/5">
                      <div className="text-[11px] font-semibold text-indigo-400 flex items-center justify-between">
                        <span>Clock-Out Taps</span>
                        <LogOut className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div className="text-2xl font-bold text-indigo-400 mt-1">{historyCounts.clockOut}</div>
                      <div className="text-[10px] text-indigo-500 mt-0.5">Gate turnstile dismissals</div>
                    </div>

                    <div className="bg-slate-950 border border-teal-500/20 p-3.5 rounded-xl bg-teal-500/5">
                      <div className="text-[11px] font-semibold text-teal-400 flex items-center justify-between">
                        <span>Classroom Attendance</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                      </div>
                      <div className="text-2xl font-bold text-teal-400 mt-1">{historyCounts.classroom}</div>
                      <div className="text-[10px] text-teal-500 mt-0.5">In-room teacher roll calls</div>
                    </div>
                  </div>

                  {/* Filtering and Sort Controls */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Search history input */}
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          value={historySearchQuery}
                          onChange={(e) => setHistorySearchQuery(e.target.value)}
                          placeholder="Search date, subject, gate, or remarks..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                        {historySearchQuery && (
                          <button
                            onClick={() => setHistorySearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Quick Sort by Type / Timestamp Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (historySortField === 'type') {
                              setHistorySortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                            } else {
                              setHistorySortField('type');
                              setHistorySortDirection('asc');
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
                            historySortField === 'type'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                          }`}
                          title="Sort history by Event Type (Clock In, Clock Out, Attendance)"
                        >
                          <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                          <span>Sort by Type: {historySortField === 'type' ? (historySortDirection === 'asc' ? 'A → Z' : 'Z → A') : 'Toggle'}</span>
                          {historySortField === 'type' && (
                            historySortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (historySortField === 'timestamp') {
                              setHistorySortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                            } else {
                              setHistorySortField('timestamp');
                              setHistorySortDirection('desc');
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
                            historySortField === 'timestamp'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-sm'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                          }`}
                          title="Sort history chronologically by Date & Time"
                        >
                          <Clock className="w-3 h-3 text-blue-400" />
                          <span>{historySortField === 'timestamp' && historySortDirection === 'asc' ? 'Oldest First' : 'Newest First'}</span>
                          {historySortField === 'timestamp' && (
                            historySortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-400" /> : <ArrowDown className="w-3 h-3 text-blue-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Type Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-900">
                      <span className="text-[11px] text-slate-500 font-medium mr-1 flex items-center gap-1">
                        <Filter className="w-3 h-3" /> Filter Type:
                      </span>
                      {[
                        { key: 'ALL', label: 'All Records', count: historyCounts.total },
                        { key: 'CLOCK_IN', label: 'Clock-In Taps', count: historyCounts.clockIn },
                        { key: 'CLOCK_OUT', label: 'Clock-Out Taps', count: historyCounts.clockOut },
                        { key: 'CLASSROOM', label: 'Classroom Roll Calls', count: historyCounts.classroom },
                        { key: 'DEBOUNCED', label: 'Debounced Multi-Taps', count: historyCounts.debounced },
                      ].map((chip) => (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={() => setHistoryTypeFilter(chip.key)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                            historyTypeFilter === chip.key
                              ? 'bg-cyan-500 text-white font-semibold shadow-sm shadow-cyan-500/30'
                              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          <span>{chip.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            historyTypeFilter === chip.key ? 'bg-cyan-950 text-cyan-200' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {chip.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* History Ledger Table (Sortable by Type) */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                    <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[11px] sticky top-0 z-10 border-b border-slate-800 shadow-sm">
                          <tr>
                            {/* Sortable Event Type Header */}
                            <th
                              onClick={() => {
                                if (historySortField === 'type') {
                                  setHistorySortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                                } else {
                                  setHistorySortField('type');
                                  setHistorySortDirection('asc');
                                }
                              }}
                              className="px-4 py-3 cursor-pointer hover:bg-slate-850 hover:text-white transition select-none group"
                              title="Click to sort by Event Type (Clock In, Clock Out, Attendance)"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className={historySortField === 'type' ? 'text-cyan-400 font-bold' : ''}>Event Type</span>
                                {historySortField === 'type' ? (
                                  historySortDirection === 'asc' ? (
                                    <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />
                                  ) : (
                                    <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
                                  )
                                ) : (
                                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />
                                )}
                              </div>
                            </th>

                            {/* Sortable Date & Time Header */}
                            <th
                              onClick={() => {
                                if (historySortField === 'timestamp') {
                                  setHistorySortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                                } else {
                                  setHistorySortField('timestamp');
                                  setHistorySortDirection('desc');
                                }
                              }}
                              className="px-4 py-3 cursor-pointer hover:bg-slate-850 hover:text-white transition select-none group"
                              title="Click to sort by Date & Time"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className={historySortField === 'timestamp' ? 'text-blue-400 font-bold' : ''}>Date & Time</span>
                                {historySortField === 'timestamp' ? (
                                  historySortDirection === 'desc' ? (
                                    <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
                                  ) : (
                                    <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
                                  )
                                ) : (
                                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400" />
                                )}
                              </div>
                            </th>

                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Location / Subject</th>
                            <th className="px-4 py-3">RFID Tag / Recorded By</th>
                            <th className="px-4 py-3">Remarks & Compliance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850/60 font-sans">
                          {filteredAndSortedHistory.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-12 text-slate-500">
                                <History className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                                No history records match the selected type or search filter.
                                <div className="mt-2">
                                  <button
                                    onClick={() => {
                                      setHistoryTypeFilter('ALL');
                                      setHistorySearchQuery('');
                                    }}
                                    className="text-xs text-cyan-400 hover:underline"
                                  >
                                    Reset Filters
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            filteredAndSortedHistory.map((item) => {
                              const isClockIn = item.type === 'CLOCK_IN';
                              const isClockOut = item.type === 'CLOCK_OUT';
                              const isPresent = item.type === 'ATTENDANCE_PRESENT';
                              const isLate = item.type === 'ATTENDANCE_LATE';
                              const isAbsent = item.type === 'ATTENDANCE_ABSENT';
                              const isExcused = item.type === 'ATTENDANCE_EXCUSED';
                              const isDropped = item.type === 'ATTENDANCE_DROPPED';
                              const isDebounced = item.type === 'DEBOUNCED';

                              return (
                                <tr key={item.id} className="hover:bg-slate-900/60 transition">
                                  {/* Event Type Badge */}
                                  <td className="px-4 py-3 font-medium">
                                    {isClockIn && (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Clock In</span>
                                      </span>
                                    )}
                                    {isClockOut && (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        <LogOut className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>Clock Out</span>
                                      </span>
                                    )}
                                    {isPresent && (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                                        <span>Present</span>
                                      </span>
                                    )}
                                    {isLate && (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Late / Tardy</span>
                                      </span>
                                    )}
                                    {isAbsent && (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                        <span>Absent</span>
                                      </span>
                                    )}
                                    {isExcused && (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                        <FileText className="w-3.5 h-3.5 text-sky-400" />
                                        <span>Excused</span>
                                      </span>
                                    )}
                                    {isDropped && (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                        <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
                                        <span>Dropped</span>
                                      </span>
                                    )}
                                    {isDebounced && (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                        <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Debounced Tap</span>
                                      </span>
                                    )}
                                  </td>

                                  {/* Date & Time (US Format: Month Day Year hh:mm:ss) */}
                                  <td className="px-4 py-3 text-slate-300">
                                    <div className="font-mono font-medium text-white">
                                      {formatUsDateTime(item.dateStr || item.timestamp, item.timeStr)}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-mono">
                                      {item.category === 'GATE_TURNSTILE' ? 'RFID Turnstile Log' : 'Classroom Roll-Call'}
                                    </div>
                                  </td>

                                  {/* Channel / Category */}
                                  <td className="px-4 py-3">
                                    {item.category === 'GATE_TURNSTILE' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                        <Radio className="w-2.5 h-2.5" />
                                        Gate Turnstile
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        <BookOpen className="w-2.5 h-2.5" />
                                        Classroom Session
                                      </span>
                                    )}
                                  </td>

                                  {/* Location / Subject */}
                                  <td className="px-4 py-3">
                                    <div className="font-medium text-slate-200">{item.location}</div>
                                    {item.subject && (
                                      <div className="text-[10px] text-slate-400 font-mono">Subject: {item.subject}</div>
                                    )}
                                  </td>

                                  {/* RFID Tag UID / Recorded By */}
                                  <td className="px-4 py-3">
                                    {item.rfid ? (
                                      <div className="font-mono text-cyan-400 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                                        <span>{item.rfid}</span>
                                      </div>
                                    ) : null}
                                    <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                                      {item.recordedBy || 'System Logger'}
                                    </div>
                                  </td>

                                  {/* Remarks & Compliance */}
                                  <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate" title={item.remarks}>
                                    {item.remarks || 'DepEd attendance recorded'}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Showing {detailsTab === 'history' ? filteredAndSortedHistory.length : '1'} record{filteredAndSortedHistory.length === 1 ? '' : 's'}</span>
                  {detailsTab === 'history' && (
                    <span className="text-slate-600 font-mono">• Sorted by {historySortField === 'type' ? 'Event Type' : 'Date & Time'} ({historySortDirection.toUpperCase()})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {canManage && (
                    <button
                      onClick={() => handleOpenEdit(selectedStudent)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Learner Record</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
