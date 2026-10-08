'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { School, DEFAULT_SCHOOL, UserAccount, INITIAL_USERS, apiClient } from './api';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'PRINCIPAL'
  | 'HEAD_TEACHER'
  | 'MASTER_TEACHER'
  | 'TEACHER'
  | 'ADMIN_ASSISTANT'
  | 'STAFF';

interface TenantContextType {
  school: School;
  setSchool: (school: School) => void;
  // Current active/effective role (spoofed persona or authenticated role)
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  // Current active/effective user (spoofed persona or authenticated user)
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  availableSchools: School[];
  refreshSchools: () => Promise<void>;

  // --- Real Session & Superadmin Spoofing Features ---
  authenticatedUser: UserAccount;
  isSuperAdminSession: boolean;
  isSpoofing: boolean;
  spoofRole: (role: UserRole) => void;
  spoofUser: (user: UserAccount) => void;
  exitSpoof: () => void;
  loginAs: (user: UserAccount) => void;
  logout: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function loadEffectiveSchool(base?: School): School {
  let res: School = { ...(base || DEFAULT_SCHOOL) };
  if (typeof window !== 'undefined') {
    try {
      const savedSelected = localStorage.getItem('identify_selected_school');
      if (savedSelected) {
        const parsed = JSON.parse(savedSelected);
        if (parsed && (parsed.name || parsed.id)) {
          res = { ...res, ...parsed };
        }
      }
      const savedSettings = localStorage.getItem('identify_school_settings');
      if (savedSettings) {
        const s = JSON.parse(savedSettings);
        if (s) {
          res = {
            ...res,
            name: s.school_name || res.name,
            short_name: s.short_name || s.school_name || res.short_name,
            deped_school_id: s.school_id || res.deped_school_id,
            logo_url: s.logo_url || res.logo_url,
            division: s.division || res.division,
            region: s.region || res.region,
            district: s.district || res.district,
            barangay: s.barangay || res.barangay,
            municipality_city: s.municipality_city || res.municipality_city,
            province: s.province || res.province,
            school_head_name: s.school_head_name || res.school_head_name,
            school_head_title: s.school_head_title || res.school_head_title,
            contact_phone: s.contact_number || res.contact_phone,
            contact_email: s.email || res.contact_email,
            school_type: s.school_type || res.school_type || 'ELEMENTARY',
            enabled_grade_levels: Array.isArray(s.enabled_grade_levels) && s.enabled_grade_levels.length > 0
              ? s.enabled_grade_levels
              : (res.enabled_grade_levels || ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6']),
          };
        }
      }
    } catch {}
  }
  return res;
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [school, setSchoolState] = useState<School>(DEFAULT_SCHOOL);
  const [authenticatedUser, setAuthenticatedUser] = useState<UserAccount>(INITIAL_USERS[0]);
  const [spoofedUser, setSpoofedUser] = useState<UserAccount | null>(null);
  const [availableSchools, setAvailableSchools] = useState<School[]>([DEFAULT_SCHOOL]);

  const setSchool = (newSchool: School) => {
    const effective = loadEffectiveSchool(newSchool);
    setSchoolState(effective);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('identify_selected_school', JSON.stringify(effective));
        const currentSettings = apiClient.getSchoolSettings();
        const updatedSettings = {
          ...currentSettings,
          school_name: effective.name,
          school_id: effective.deped_school_id,
          logo_url: effective.logo_url,
          division: effective.division,
          region: effective.region,
          school_head_name: effective.school_head_name,
          school_head_title: effective.school_head_title,
          contact_number: effective.contact_phone,
          email: effective.contact_email,
          school_type: effective.school_type || 'ELEMENTARY',
          enabled_grade_levels: effective.enabled_grade_levels || ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
        };
        localStorage.setItem('identify_school_settings', JSON.stringify(updatedSettings));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('identify:school-updated', { detail: effective }));
      } catch {}
    }
  };

  useEffect(() => {
    // 0. Initialize effective school from persistence immediately
    const initialSchool = loadEffectiveSchool();
    setSchoolState(initialSchool);

    // 1. Restore authenticated session user
    let realAuthUser = INITIAL_USERS[0];
    try {
      const savedAuthStr = localStorage.getItem('identify_authenticated_user');
      if (savedAuthStr) {
        const parsed = JSON.parse(savedAuthStr);
        if (parsed && parsed.id && parsed.role) {
          realAuthUser = parsed;
          setAuthenticatedUser(parsed);
        }
      } else {
        const savedProfileStr = localStorage.getItem('identify_user_profile');
        if (savedProfileStr) {
          const parsed = JSON.parse(savedProfileStr);
          if (parsed && parsed.id && parsed.role) {
            realAuthUser = parsed;
            setAuthenticatedUser(parsed);
            localStorage.setItem('identify_authenticated_user', JSON.stringify(parsed));
          }
        }
      }
    } catch (e) {
      console.error('Error restoring authenticated user:', e);
    }

    // 2. Restore spoofed user if and only if authenticated user is SUPER_ADMIN
    if (realAuthUser.role === 'SUPER_ADMIN') {
      try {
        const savedSpoofStr = localStorage.getItem('identify_spoofed_user');
        if (savedSpoofStr) {
          const parsedSpoof = JSON.parse(savedSpoofStr);
          if (parsedSpoof && parsedSpoof.id && parsedSpoof.role) {
            setSpoofedUser(parsedSpoof);
          }
        }
      } catch (e) {
        console.error('Error restoring spoofed user:', e);
      }
    } else {
      // Non-superadmin is strictly disallowed from having an active spoof
      localStorage.removeItem('identify_spoofed_user');
      setSpoofedUser(null);
    }

    // 3. Fetch schools from backend and overlay persistent institutional settings
    apiClient.getAllSchools().then((schools) => {
      if (schools && schools.length > 0) {
        const enrichedList = schools.map((s, idx) => (idx === 0 ? loadEffectiveSchool(s) : s));
        setAvailableSchools(enrichedList);
        setSchoolState(enrichedList[0]);
      } else {
        const effective = loadEffectiveSchool();
        setAvailableSchools([effective]);
        setSchoolState(effective);
      }
    });

    // 4. Synchronize when institutional settings change across components or tabs
    const handleSync = () => {
      setSchoolState((prev) => loadEffectiveSchool(prev));
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('identify:school-updated', handleSync);

    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('identify:school-updated', handleSync);
    };
  }, []);

  // Dynamically update document.title and tab favicon to reflect the institutional identity
  useEffect(() => {
    if (typeof document !== 'undefined' && school?.name) {
      document.title = `${school.name} (DepEd ID: ${school.deped_school_id}) | iDentify DepEd SaaS`;
      if (school.logo_url) {
        let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = school.logo_url;
      }
    }
  }, [school]);

  const refreshSchools = async () => {
    const list = await apiClient.getAllSchools();
    const enrichedList = list.map((s, idx) => (idx === 0 ? loadEffectiveSchool(s) : s));
    setAvailableSchools(enrichedList);
  };

  const isSuperAdminSession = authenticatedUser.role === 'SUPER_ADMIN';
  const isSpoofing = isSuperAdminSession && !!spoofedUser;
  const currentUser = isSpoofing && spoofedUser ? spoofedUser : authenticatedUser;
  const currentRole = currentUser.role;

  // Helper to construct persona user when spoofing by role
  const getPersonaForRole = (role: UserRole): UserAccount => {
    const matched = INITIAL_USERS.find((u) => u.role === role);
    if (matched) return matched;
    return {
      id: 'usr-sim-' + role.toLowerCase(),
      school_id: school.id,
      username: `${role.toLowerCase()}.persona`,
      email: `${role.toLowerCase()}@sawat.deped.gov.ph`,
      full_name: `${role.replace('_', ' ')} Persona`,
      role,
      position:
        role === 'PRINCIPAL'
          ? 'Principal I'
          : role === 'MASTER_TEACHER'
          ? 'Master Teacher I'
          : role === 'ADMIN_ASSISTANT'
          ? 'Administrative Assistant II'
          : role === 'HEAD_TEACHER'
          ? 'Head Teacher III'
          : 'Faculty Member',
      photo_url: '/avatars/default-user.svg',
      is_active: true,
      two_factor_enabled: false,
      email_confirmed: true,
      phone_confirmed: true,
    };
  };

  const spoofRole = (role: UserRole) => {
    if (!isSuperAdminSession) {
      console.warn('Unauthorized persona spoofing attempt: only available for SUPER_ADMIN.');
      return;
    }
    if (role === 'SUPER_ADMIN') {
      exitSpoof();
      return;
    }
    const persona = getPersonaForRole(role);
    setSpoofedUser(persona);
    try {
      localStorage.setItem('identify_spoofed_user', JSON.stringify(persona));
      localStorage.setItem('identify_user_profile', JSON.stringify(persona));
    } catch (e) {
      console.error('Error persisting spoofed role:', e);
    }
  };

  const spoofUser = (user: UserAccount) => {
    if (!isSuperAdminSession) {
      console.warn('Unauthorized persona spoofing attempt: only available for SUPER_ADMIN.');
      return;
    }
    if (user.role === 'SUPER_ADMIN' && user.id === authenticatedUser.id) {
      exitSpoof();
      return;
    }
    setSpoofedUser(user);
    try {
      localStorage.setItem('identify_spoofed_user', JSON.stringify(user));
      localStorage.setItem('identify_user_profile', JSON.stringify(user));
    } catch (e) {
      console.error('Error persisting spoofed user:', e);
    }
  };

  const exitSpoof = () => {
    setSpoofedUser(null);
    try {
      localStorage.removeItem('identify_spoofed_user');
      localStorage.setItem('identify_user_profile', JSON.stringify(authenticatedUser));
    } catch (e) {
      console.error('Error clearing spoofed user:', e);
    }
  };

  // Backwards-compatible setCurrentRole:
  // When in a Super Admin session, selecting another role activates spoofing
  // while preserving the true authenticated Super Admin identity!
  const setCurrentRole = (role: UserRole) => {
    if (isSuperAdminSession) {
      spoofRole(role);
    } else {
      console.warn('Role modifications are locked for non-superadmin accounts.');
    }
  };

  const setCurrentUser = (user: UserAccount) => {
    if (isSuperAdminSession && isSpoofing) {
      setSpoofedUser(user);
      try {
        localStorage.setItem('identify_spoofed_user', JSON.stringify(user));
        localStorage.setItem('identify_user_profile', JSON.stringify(user));
      } catch (e) {
        console.error('Error updating spoofed user:', e);
      }
    } else {
      setAuthenticatedUser(user);
      try {
        localStorage.setItem('identify_authenticated_user', JSON.stringify(user));
        localStorage.setItem('identify_user_profile', JSON.stringify(user));
      } catch (e) {
        console.error('Error updating authenticated user:', e);
      }
    }
  };

  const loginAs = (user: UserAccount) => {
    setAuthenticatedUser(user);
    setSpoofedUser(null);
    try {
      localStorage.setItem('identify_authenticated_user', JSON.stringify(user));
      localStorage.setItem('identify_user_profile', JSON.stringify(user));
      localStorage.removeItem('identify_spoofed_user');
    } catch (e) {
      console.error('Error persisting login user:', e);
    }
  };

  const logout = () => {
    setAuthenticatedUser(INITIAL_USERS[0]);
    setSpoofedUser(null);
    try {
      localStorage.removeItem('identify_authenticated_user');
      localStorage.removeItem('identify_spoofed_user');
      localStorage.removeItem('identify_user_profile');
    } catch (e) {
      console.error('Error logging out:', e);
    }
  };

  return (
    <TenantContext.Provider
      value={{
        school,
        setSchool,
        currentRole,
        setCurrentRole,
        currentUser,
        setCurrentUser,
        availableSchools,
        refreshSchools,
        authenticatedUser,
        isSuperAdminSession,
        isSpoofing,
        spoofRole,
        spoofUser,
        exitSpoof,
        loginAs,
        logout,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
}
