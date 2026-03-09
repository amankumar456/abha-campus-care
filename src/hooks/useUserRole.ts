import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export type AppRole = 'doctor' | 'mentor' | 'student' | 'admin' | 'lab_officer' | 'pharmacy' | 'medical_staff';

interface RoleCacheEntry {
  roles: AppRole[];
  mentorId: string | null;
  doctorId: string | null;
  timestamp: number;
}

// Global cache shared across all hook instances
const roleCache = new Map<string, RoleCacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface UseUserRoleReturn {
  user: User | null;
  roles: AppRole[];
  isDoctor: boolean;
  isMentor: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  isPharmacy: boolean;
  isLabOfficer: boolean;
  isMedicalStaff: boolean;
  loading: boolean;
  mentorId: string | null;
  doctorId: string | null;
  refreshRoles: () => void;
}

export const useUserRole = (): UseUserRoleReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const applyCache = useCallback((userId: string): boolean => {
    const cached = roleCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setRoles(cached.roles);
      setMentorId(cached.mentorId);
      setDoctorId(cached.doctorId);
      setLoading(false);
      return true;
    }
    return false;
  }, []);

  const fetchRoles = useCallback(async (userId: string, force = false) => {
    if (fetchingRef.current) return;
    
    // Use cache if available and not forced
    if (!force && applyCache(userId)) return;

    fetchingRef.current = true;
    try {
      // Parallel fetch all role-related data in ONE batch
      const [rolesRes, mentorRes, doctorRes] = await Promise.all([
        supabase.from('user_roles').select('role').eq('user_id', userId),
        supabase.from('mentors').select('id').eq('user_id', userId).maybeSingle(),
        supabase.from('medical_officers').select('id').eq('user_id', userId).maybeSingle(),
      ]);

      if (!mountedRef.current) return;

      const fetchedRoles = (rolesRes.data || []).map(r => r.role as AppRole);
      const fetchedMentorId = mentorRes.data?.id || null;
      const fetchedDoctorId = doctorRes.data?.id || null;

      // Update cache
      roleCache.set(userId, {
        roles: fetchedRoles,
        mentorId: fetchedMentorId,
        doctorId: fetchedDoctorId,
        timestamp: Date.now(),
      });

      setRoles(fetchedRoles);
      setMentorId(fetchedMentorId);
      setDoctorId(fetchedDoctorId);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      fetchingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [applyCache]);

  const refreshRoles = useCallback(() => {
    if (user) {
      roleCache.delete(user.id);
      fetchRoles(user.id, true);
    }
  }, [user, fetchRoles]);

  useEffect(() => {
    mountedRef.current = true;

    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setRoles([]);
        setMentorId(null);
        setDoctorId(null);
        setLoading(false);
        return;
      }
      const newUser = session.user;
      setUser(newUser);
      if (event === 'SIGNED_IN') {
        fetchRoles(newUser.id);
      } else if (event === 'TOKEN_REFRESHED') {
        applyCache(newUser.id) || fetchRoles(newUser.id);
      }
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Session error:', error.message);
        // Clear stale/invalid session locally
        supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        setUser(null);
        setRoles([]);
        setMentorId(null);
        setDoctorId(null);
        setLoading(false);
        return;
      }
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        fetchRoles(sessionUser.id);
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchRoles, applyCache]);

  return {
    user,
    roles,
    isDoctor: roles.includes('doctor'),
    isMentor: roles.includes('mentor'),
    isStudent: roles.includes('student'),
    isAdmin: roles.includes('admin'),
    isPharmacy: roles.includes('pharmacy'),
    isLabOfficer: roles.includes('lab_officer'),
    isMedicalStaff: roles.includes('medical_staff'),
    loading,
    mentorId,
    doctorId,
    refreshRoles,
  };
};

// Export cache utilities for auth page to use
export const clearRoleCache = () => roleCache.clear();
export const getCachedRoles = (userId: string): AppRole[] | null => {
  const cached = roleCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.roles;
  }
  return null;
};
