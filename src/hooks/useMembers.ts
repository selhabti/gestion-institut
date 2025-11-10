import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  city: string;
  group_type: "Lundi" | "Samedi" | "Dimanche";
  created_at: string;
}

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('first_name');

      if (error) throw error;
      setMembers(data || []);
      setError(null);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

 // Dans src/hooks/useMembers.ts
const addMember = async (memberData: Omit<Member, 'id' | 'created_at'>) => {
  try {
    const { data, error } = await supabase
      .from('members')
      .insert([memberData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Erreur de violation de contrainte d'unicité
        throw new Error(`"${memberData.first_name} ${memberData.last_name}" existe déjà dans le groupe ${memberData.group_type}`);
      }
      throw error;
    }
    
    setMembers(prev => [...prev, data]);
    return data;
  } catch (error: any) {
    throw error;
  }
};

  return { members, loading, error, refreshMembers: fetchMembers, addMember };
}