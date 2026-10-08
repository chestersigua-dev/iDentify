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

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [school, setSchool] = useState<School>(DEFAULT_SCHOOL);
  const [authenticatedUser, setAuthenticatedUser] = useState<UserAccount>(INITIAL_USERS[0]);
  const [spoofedUser, setSpoofedUser] = useState<UserAccount | null>(null);
  const [availableSchools, setAvailableSchools] = useState<School[]>([DEFAULT_SCHOOL]);

  useEffect(() => {
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

    // 3. Fetch schools
    apiClient.getAllSchools().then((schools) => {
      setAvailableSchools(schools);
      if (schools.length > 0) {
        setSchool(schools[0]);
      }
    });
  }, []);

  const refreshSchools = async () => {
    const list = await apiClient.getAllSchools();
    setAvailableSchools(list);
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
