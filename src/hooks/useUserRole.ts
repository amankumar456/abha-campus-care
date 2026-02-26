import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export type AppRole = 'doctor' | 'mentor' | 'student' | 'admin';

interface UseUserRoleReturn {
  user: User | null;
  roles: AppRole[];
  isDoctor: boolean;
  isMentor: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  loading: boolean;
  mentorId: string | null;
  doctorId: string | null;
}

export const useUserRole = (): UseUserRoleReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async (userId: string) => {
      try {
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (rolesData) {
          setRoles(rolesData.map(r => r.role as AppRole));
        }

        // Check if user is linked to a mentor
        const { data: mentorData } = await supabase
          .from('mentors')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (mentorData) {
          setMentorId(mentorData.id);
        }

        // Check if user is linked to a doctor
        const { data: doctorData } = await supabase
          .from('medical_officers')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (doctorData) {
          setDoctorId(doctorData.id);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
      } finally {
        setLoading(false);
      }
    };

    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchRoles(session.user.id), 0);
      } else {
        setRoles([]);
        setMentorId(null);
        setDoctorId(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Session fetch error, clearing stale session:', error.message);
        supabase.auth.signOut();
        setLoading(false);
        return;
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoles(session.user.id);
      } else {
        setLoading(false);
      }
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  return {
    user,
    roles,
    isDoctor: roles.includes('doctor'),
    isMentor: roles.includes('mentor'),
    isStudent: roles.includes('student'),
    isAdmin: roles.includes('admin'),
    loading,
    mentorId,
    doctorId
  };
};
