'use client';

import React, { useState, useEffect } from 'react';
import BrandedShell from '@/components/BrandedShell';
import { useTenant } from '@/lib/tenant-context';
import { 
  User, 
  Student, 
  AcademicSection, 
  GradeSubject, 
  usersApi, 
  studentsApi, 
  DEFAULT_SECTIONS, 
  DEFAULT_GRADE_SUBJECTS, 
  SECTIONS_SEED, 
  SUBJECTS_SEED 
} from '@/lib/api';

import OverviewMetricsView from '@/components/dashboard/OverviewMetricsView';
import UserManagementView from '@/components/dashboard/UserManagementView';
import { StudentBeefDatabaseView } from '@/components/dashboard/StudentBeefDatabaseView';
import { AcademicAssignmentsView } from '@/components/dashboard/AcademicAssignmentsView';
import { ClassroomAttendanceView } from '@/components/dashboard/ClassroomAttendanceView';
import { SchoolSettingsView } from '@/components/dashboard/SchoolSettingsView';
import { AuditLedgerView } from '@/components/dashboard/AuditLedgerView';

export default function DashboardPage() {
  const { currentRole, currentUser } = useTenant();
  const [activeNav, setActiveNav] = useState<string>('overview');

  // Shared Data States
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<AcademicSection[]>(SECTIONS_SEED);
  const [subjects, setSubjects] = useState<GradeSubject[]>(SUBJECTS_SEED);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedUsers, fetchedStudents] = await Promise.all([
        usersApi.getAll(),
        studentsApi.getAll(),
      ]);
      setUsers(fetchedUsers);
      setStudents(fetchedStudents);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Set default view based on role (or the tab requested via ?nav= from other pages)
  useEffect(() => {
    const requested =
      typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('nav') : null;
    const validNavs = ['overview', 'users', 'staff', 'students', 'import_csv', 'academic', 'attendance', 'settings', 'school_profile', 'audit'];
    if (requested && validNavs.includes(requested)) {
      setActiveNav(requested);
    } else if (currentRole === 'TEACHER' || currentRole === 'MASTER_TEACHER') {
      setActiveNav('attendance');
    } else if (currentRole === 'ADMIN_ASSISTANT') {
      setActiveNav('users');
    } else {
      setActiveNav('overview');
    }
  }, [currentRole]);

  // Restrict AO from accessing unauthorized views
  useEffect(() => {
    if (currentRole === 'ADMIN_ASSISTANT') {
      const allowedAoNavs = ['users', 'staff', 'students', 'import_csv', 'academic'];
      if (!allowedAoNavs.includes(activeNav)) {
        setActiveNav('users');
      }
    }
  }, [currentRole, activeNav]);

  // RBAC Permission checks per prompt mandate:
  // - Superadmin: All access
  // - Principal & Admin Assistant (AO): Can CRUD teachers/staff, assign sections/subjects, CRUD students BEEF + import CSV
  // - Master Teacher & Teacher: Same RBAC access (Classroom attendance, assigned workloads, student metrics)
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';
  const isPrincipal = currentRole === 'PRINCIPAL';
  const isAdminAssistant = currentRole === 'ADMIN_ASSISTANT';
  const isTeacher = currentRole === 'TEACHER' || currentRole === 'MASTER_TEACHER';

  const canManageUsers = isSuperAdmin || isPrincipal || isAdminAssistant;
  const canManageAcademic = isSuperAdmin || isPrincipal || isAdminAssistant;
  const canManageStudents = isSuperAdmin || isPrincipal || isAdminAssistant;
  const canManageSettings = isSuperAdmin || isPrincipal;
  const canViewAudit = isSuperAdmin || isPrincipal;

  return (
    <BrandedShell activeNav={activeNav} onNavChange={setActiveNav}>
      <div className="space-y-6">
        {/* Render Tab View */}
        {activeNav === 'overview' && !isAdminAssistant && (
          <OverviewMetricsView
            students={students}
            users={users}
            sections={sections}
            onNavigateTab={setActiveNav}
          />
        )}

        {activeNav === 'users' && (canManageUsers || isTeacher) && (
          <UserManagementView
            users={users}
            sections={sections}
            subjects={subjects}
            onRefresh={fetchData}
            currentUser={currentUser}
            canManageUsers={canManageUsers}
          />
        )}

        {activeNav === 'students' && canManageStudents && (
          <StudentBeefDatabaseView
            students={students}
            onRefresh={fetchData}
            canManage={canManageStudents}
          />
        )}

        {activeNav === 'import_csv' && canManageStudents && (
          <StudentBeefDatabaseView
            students={students}
            onRefresh={fetchData}
            canManage={canManageStudents}
            initialOpenImport={true}
          />
        )}

        {activeNav === 'academic' && (
          <AcademicAssignmentsView
            users={users}
            sections={sections}
            subjects={subjects}
            onRefresh={fetchData}
            canManage={canManageAcademic}
          />
        )}

        {activeNav === 'attendance' && !isAdminAssistant && (
          <ClassroomAttendanceView
            students={students}
            currentUser={currentUser}
          />
        )}

        {(activeNav === 'settings' || activeNav === 'school_profile') && canManageSettings && (
          <SchoolSettingsView onPurgeComplete={fetchData} />
        )}

        {activeNav === 'audit' && canViewAudit && (
          <AuditLedgerView />
        )}
      </div>
    </BrandedShell>
  );
}
