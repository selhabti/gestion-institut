// src/services/attendanceService.ts
import { supabase } from '@/lib/supabase';
import type { SessionType } from '@/types/session';

export type AttendanceStatus = 'present' | 'absent_justified' | 'absent_unjustified';

export interface AttendanceRecord {
  member_id: string;
  date: string;
  status: AttendanceStatus;
  notes?: string;
  group?: SessionType;
}

export class AttendanceService {
  /**
   * Récupérer la présence d'un membre pour une date et un groupe spécifique
   */
  static async getAttendance(memberId: string, date: string, group?: SessionType) {
    try {
      console.log('🔍 Récupération présence pour:', { memberId, date, group });
      
      let query = supabase
        .from('attendances')
        .select('*')
        .eq('member_id', memberId)
        .eq('date', date);
      
      // Si un groupe est spécifié, filtrer par groupe
      if (group) {
        query = query.eq('group', group);
      }
      
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.warn('⚠️ Erreur maybeSingle:', error);
        
        // Fallback: essayer avec limit(1)
        const { data: fallbackData, error: fallbackError } = await query.limit(1);
          
        if (fallbackError) {
          console.error('❌ Erreur fallback:', fallbackError);
          throw fallbackError;
        }
        
        return fallbackData?.[0] || null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur getAttendance:', error);
      return null;
    }
  }

  /**
   * Récupérer TOUTES les présences d'un membre pour une date
   * (Utile pour voir dans combien de groupes il a été marqué le même jour)
   */
  static async getMemberAttendancesForDate(memberId: string, date: string) {
    try {
      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('member_id', memberId)
        .eq('date', date)
        .order('group', { ascending: true });
        
      if (error) {
        console.error('❌ Erreur getMemberAttendancesForDate:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Exception getMemberAttendancesForDate:', error);
      return [];
    }
  }

/**
 * Marquer une présence avec gestion des groupes multiples
 * IMPORTANT : Permet à un élève d'avoir plusieurs présences le même jour dans différents groupes
 */
static async markAttendance(record: AttendanceRecord) {
  try {
    console.log('📝 Marquage présence avec groupe:', record);
    
    // Obtenir l'utilisateur courant
    const { data: { user } } = await supabase.auth.getUser();
    
    // Vérifier s'il existe déjà une présence pour cette date ET CE GROUPE
    const existingAttendance = await this.getAttendance(
      record.member_id, 
      record.date, 
      record.group || undefined
    );
    
    if (existingAttendance) {
      // Mettre à jour la présence existante POUR CE GROUPE
      console.log('🔄 Mise à jour présence existante pour groupe:', record.group || 'non spécifié');
      const { data, error } = await supabase
        .from('attendances')
        .update({
          status: record.status,
          group: record.group || null,
          notes: record.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAttendance.id)
        .select()
        .single();
        
      if (error) {
        console.error('❌ Erreur mise à jour:', error);
        throw error;
      }
      
      console.log('✅ Présence mise à jour avec succès:', data);
      return data;
    } else {
      // Vérifier d'abord s'il n'y a pas déjà une présence avec cette combinaison unique
      const { data: conflictCheck, error: conflictError } = await supabase
        .from('attendances')
        .select('id')
        .eq('member_id', record.member_id)
        .eq('date', record.date)
        .eq('group', record.group || null)
        .maybeSingle();
      
      if (conflictError) {
        console.error('❌ Erreur vérification conflit:', conflictError);
      }
      
      if (conflictCheck) {
        console.log('⚠️ Conflit détecté, mise à jour au lieu de création');
        // Mettre à jour l'existant
        const { data, error } = await supabase
          .from('attendances')
          .update({
            status: record.status,
            notes: record.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', conflictCheck.id)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      }
      
      // Créer une nouvelle présence POUR CE GROUPE
      console.log('➕ Création nouvelle présence pour groupe:', record.group || 'non spécifié');
      const { data, error } = await supabase
        .from('attendances')
        .insert({
          member_id: record.member_id,
          date: record.date,
          status: record.status,
          group: record.group || null,
          notes: record.notes,
          created_by: user?.id || '00000000-0000-0000-0000-000000000000',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (error) {
        // Si erreur de duplication, essayer de récupérer et mettre à jour
        if (error.code === '23505') { // Code PostgreSQL pour unique violation
          console.log('⚠️ Conflit unique violation, tentative de récupération');
          
          const { data: existing } = await supabase
            .from('attendances')
            .select('*')
            .eq('member_id', record.member_id)
            .eq('date', record.date)
            .eq('group', record.group || null)
            .single();
          
          if (existing) {
            const { data: updatedData, error: updateError } = await supabase
              .from('attendances')
              .update({
                status: record.status,
                notes: record.notes,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id)
              .select()
              .single();
              
            if (updateError) throw updateError;
            return updatedData;
          }
        }
        throw error;
      }
      
      console.log('✅ Présence créée avec succès:', data);
      return data;
    }
  } catch (error) {
    console.error('❌ Exception markAttendance:', error);
    throw error;
  }
}

  /**
   * Récupérer toutes les présences d'un membre (historique complet)
   */
  static async getMemberAttendances(memberId: string) {
    try {
      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('member_id', memberId)
        .order('date', { ascending: false });
        
      if (error) {
        console.error('❌ Erreur getMemberAttendances:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Exception getMemberAttendances:', error);
      return [];
    }
  }

  /**
   * Vérifier si un membre a déjà une présence pour une date donnée DANS UN GROUPE SPÉCIFIQUE
   */
  static async hasAttendanceInGroup(memberId: string, date: string, group?: SessionType): Promise<boolean> {
    try {
      const attendance = await this.getAttendance(memberId, date, group);
      return !!attendance;
    } catch (error) {
      console.error('❌ Erreur hasAttendanceInGroup:', error);
      return false;
    }
  }

  /**
   * Vérifier si un membre a une présence pour une date (dans n'importe quel groupe)
   */
  static async hasAttendanceOnDate(memberId: string, date: string): Promise<boolean> {
    try {
      const attendances = await this.getMemberAttendancesForDate(memberId, date);
      return attendances.length > 0;
    } catch (error) {
      console.error('❌ Erreur hasAttendanceOnDate:', error);
      return false;
    }
  }

  /**
   * Récupérer le groupe dans lequel un membre a été marqué pour une date
   * (Retourne le premier groupe trouvé)
   */
  static async getAttendanceGroup(memberId: string, date: string): Promise<SessionType | null> {
    try {
      const attendances = await this.getMemberAttendancesForDate(memberId, date);
      return attendances[0]?.group || null;
    } catch (error) {
      console.error('❌ Erreur getAttendanceGroup:', error);
      return null;
    }
  }

  /**
   * Récupérer TOUS les groupes dans lesquels un membre a été marqué pour une date
   */
  static async getAttendanceGroups(memberId: string, date: string): Promise<SessionType[]> {
    try {
      const attendances = await this.getMemberAttendancesForDate(memberId, date);
      return attendances
        .map(a => a.group)
        .filter((group): group is SessionType => group !== null && group !== undefined);
    } catch (error) {
      console.error('❌ Erreur getAttendanceGroups:', error);
      return [];
    }
  }

  /**
   * Marquer plusieurs présences en batch
   */
  static async markMultipleAttendances(records: AttendanceRecord[]) {
    const results = [];
    
    for (const record of records) {
      try {
        const result = await this.markAttendance(record);
        results.push({ success: true, data: result });
      } catch (error) {
        console.error(`❌ Erreur pour ${record.member_id}:`, error);
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Erreur inconnue' 
        });
      }
    }
    
    return results;
  }

  /**
   * Supprimer une présence d'un groupe spécifique
   */
  static async deleteAttendance(memberId: string, date: string, group?: SessionType) {
    try {
      console.log('🗑️ Suppression présence:', { memberId, date, group });
      
      let query = supabase
        .from('attendances')
        .delete()
        .eq('member_id', memberId)
        .eq('date', date);
      
      // Si un groupe est spécifié, supprimer seulement pour ce groupe
      if (group !== undefined) {
        query = query.eq('group', group);
      }
      
      const { error } = await query;
        
      if (error) {
        console.error('❌ Erreur suppression:', error);
        throw error;
      }
      
      console.log('✅ Présence supprimée avec succès');
      return true;
    } catch (error) {
      console.error('❌ Exception deleteAttendance:', error);
      throw error;
    }
  }

  /**
   * Supprimer TOUTES les présences d'un membre pour une date
   */
  static async deleteAllAttendancesForDate(memberId: string, date: string) {
    try {
      console.log('🗑️ Suppression TOUTES les présences pour:', { memberId, date });
      
      const { error } = await supabase
        .from('attendances')
        .delete()
        .eq('member_id', memberId)
        .eq('date', date);
        
      if (error) {
        console.error('❌ Erreur suppression:', error);
        throw error;
      }
      
      console.log('✅ Toutes les présences supprimées avec succès');
      return true;
    } catch (error) {
      console.error('❌ Exception deleteAllAttendancesForDate:', error);
      return [];
    }
  }

  /**
   * Vérifier les conflits de présence (si déjà marqué dans un groupe spécifique)
   */
  static async checkAttendanceConflict(
    memberId: string, 
    date: string, 
    targetGroup?: SessionType
  ): Promise<{
    hasConflict: boolean;
    existingGroups?: SessionType[];
    existingAttendances?: any[];
  }> {
    try {
      const attendances = await this.getMemberAttendancesForDate(memberId, date);
      
      if (attendances.length === 0) {
        return { hasConflict: false };
      }
      
      // Si un groupe cible est spécifié, vérifier s'il y a déjà une présence dans ce groupe
      if (targetGroup !== undefined) {
        const hasInTargetGroup = attendances.some(a => a.group === targetGroup);
        if (hasInTargetGroup) {
          return {
            hasConflict: true,
            existingGroups: attendances.map(a => a.group).filter(Boolean) as SessionType[],
            existingAttendances: attendances,
          };
        }
      }
      
      return { 
        hasConflict: false,
        existingGroups: attendances.map(a => a.group).filter(Boolean) as SessionType[],
        existingAttendances: attendances,
      };
    } catch (error) {
      console.error('❌ Erreur checkAttendanceConflict:', error);
      return { hasConflict: false };
    }
  }

  /**
   * Marquer un élève présent dans plusieurs groupes le même jour
   * (ex: présent le Samedi et aussi le Lundi)
   */
  static async markAttendanceInMultipleGroups(
    memberId: string,
    date: string,
    groups: SessionType[],
    status: AttendanceStatus = 'present'
  ) {
    try {
      const results = [];
      
      for (const group of groups) {
        const result = await this.markAttendance({
          member_id: memberId,
          date,
          status,
          group,
        });
        
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('❌ Erreur marquage multi-groupes:', error);
      throw error;
    }
  }

  /**
   * Changer un élève d'un groupe à un autre pour une date
   * (Supprime l'ancienne présence et crée une nouvelle dans le nouveau groupe)
   */
  static async transferAttendanceGroup(
    memberId: string,
    date: string,
    fromGroup: SessionType,
    toGroup: SessionType,
    status: AttendanceStatus = 'present'
  ) {
    try {
      console.log('🔄 Transfert de groupe:', { memberId, date, fromGroup, toGroup });
      
      // 1. Supprimer la présence dans l'ancien groupe
      await this.deleteAttendance(memberId, date, fromGroup);
      
      // 2. Créer une présence dans le nouveau groupe
      const newAttendance = await this.markAttendance({
        member_id: memberId,
        date,
        status,
        group: toGroup,
      });
      
      console.log('✅ Transfert effectué avec succès');
      return newAttendance;
    } catch (error) {
      console.error('❌ Erreur transfert de groupe:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques de présence pour un groupe et une date
   */
  static async getAttendanceStats(group: SessionType, date: string) {
    try {
      // Récupérer toutes les présences pour ce groupe et cette date
      const { data, error } = await supabase
        .from('attendances')
        .select('*')
        .eq('group', group)
        .eq('date', date)
        .eq('status', 'present');
        
      if (error) {
        console.error('❌ Erreur getAttendanceStats:', error);
        throw error;
      }
      
      return {
        totalPresent: data?.length || 0,
        attendances: data || [],
      };
    } catch (error) {
      console.error('❌ Exception getAttendanceStats:', error);
      throw error;
    }
  }

  /**
   * Récupérer les élèves présents dans un groupe à une date
   */
  static async getPresentMembersInGroup(group: SessionType, date: string) {
    try {
      const { data, error } = await supabase
        .from('attendances')
        .select(`
          *,
          members (
            id,
            first_name,
            last_name,
            city,
            group
          )
        `)
        .eq('group', group)
        .eq('date', date)
        .eq('status', 'present');
        
      if (error) {
        console.error('❌ Erreur getPresentMembersInGroup:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Exception getPresentMembersInGroup:', error);
      return [];
    }
  }

/**
 * Récupère l'historique complet d'un étudiant en excluant les périodes de vacances
 * @param studentId - L'ID de l'étudiant
 * @returns StudentHistory - L'historique formaté pour l'affichage
 */
/**
 * Récupère l'historique complet d'un étudiant en excluant les périodes de vacances
 * @param studentId - L'ID de l'étudiant
 * @returns StudentHistory - L'historique formaté pour l'affichage
 */
static async getStudentHistoryWithExclusion(studentId: string) {
  try {
    console.log('📊 Récupération historique avec exclusion pour:', studentId);

    // 1. Récupérer les infos de l'étudiant
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, first_name, last_name, group_type') // CORRECTION ICI : group_name -> group_type
      .eq('id', studentId)
      .single();

    if (memberError) {
      console.error('❌ Erreur member:', memberError);
      throw memberError;
    }
    if (!member) throw new Error('Étudiant non trouvé');

    // 2. Récupérer toutes les présences de l'étudiant
    const { data: attendances, error: attendanceError } = await supabase
      .from('attendances')
      .select('*')
      .eq('member_id', studentId)
      .order('date', { ascending: false });

    if (attendanceError) {
      console.error('❌ Erreur attendances:', attendanceError);
      throw attendanceError;
    }

    // 3. Récupérer les périodes exclues (vacances, jours fériés)
    const { data: excludedPeriods, error: periodsError } = await supabase
      .from('events')
      .select('*')
      .eq('exclude_from_stats', true);

    if (periodsError) {
      console.error('❌ Erreur periods:', periodsError);
      throw periodsError;
    }

    console.log('📅 Périodes exclues trouvées:', excludedPeriods?.length || 0);

    // 4. Filtrer les présences pour exclure les périodes de vacances
    const filteredAttendances = (attendances || []).filter(attendance => {
      // Vérifier si cette date est pendant une période exclue
      const isExcluded = (excludedPeriods || []).some(period => {
        return attendance.date >= period.start_date && attendance.date <= period.end_date;
      });
      
      if (isExcluded) {
        console.log(`🚫 Session exclue: ${attendance.date} (pendant vacances)`);
      }
      
      return !isExcluded; // Garder seulement les présences hors vacances
    });

    console.log(`✅ ${filteredAttendances.length} sessions gardées sur ${attendances?.length || 0} total`);

    // 5. Grouper par mois
    const sessionsByMonth = new Map<string, any[]>();
    
    filteredAttendances.forEach(attendance => {
      const month = attendance.date.substring(0, 7); // YYYY-MM
      
      if (!sessionsByMonth.has(month)) {
        sessionsByMonth.set(month, []);
      }
      
      sessionsByMonth.get(month)!.push({
        date: attendance.date,
        day: new Date(attendance.date).toLocaleDateString('fr-FR', { weekday: 'long' }),
        status: attendance.status === 'present' ? 'present' as const : 'absent' as const,
        sessionType: attendance.group || 'default'
      });
    });

    // 6. Calculer les statistiques par mois
    const monthlyStats = [];
    
    for (const [month, sessions] of sessionsByMonth) {
      const presentSessions = sessions.filter((s: any) => s.status === 'present').length;
      const totalSessions = sessions.length;
      const absentSessions = totalSessions - presentSessions;
      
      monthlyStats.push({
        month,
        totalSessions,
        presentSessions,
        absentSessions,
        attendanceRate: totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0,
        paymentStatus: {
          currentMonth: month,
          status: 'unpaid' as const
        },
        sessions: sessions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      });
    }

    // Trier par mois décroissant (plus récent en premier)
    monthlyStats.sort((a: { month: string }, b: { month: string }) => b.month.localeCompare(a.month));

    // 7. Calculer les statistiques globales
    const totalSessions = filteredAttendances.length;
    const presentCount = filteredAttendances.filter((a: any) => a.status === 'present').length;
    const absentCount = totalSessions - presentCount;

    const result = {
      studentId: member.id,
      firstName: member.first_name,
      lastName: member.last_name,
      group: member.group_type, // CORRECTION ICI AUSSI : group_name -> group_type
      monthlyStats,
      overallAttendance: {
        overallRate: totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0,
        monthlyRate: totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0,
        groupSpecificRate: totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0,
        totalSessions,
        presentCount,
        absentCount
      }
    };

    console.log('✅ Historique calculé avec succès');
    return result;

  } catch (error) {
    console.error('❌ Erreur dans getStudentHistoryWithExclusion:', error);
    throw error;
  }
}
}