// src/components/MemberFormDuplicateCheck.tsx
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface MemberFormDuplicateCheckProps {
  firstName: string;
  lastName: string;
  onDuplicateFound: (existingMember: any) => void;
}

export const MemberFormDuplicateCheck: React.FC<MemberFormDuplicateCheckProps> = ({
  firstName,
  lastName,
  onDuplicateFound
}) => {
  const [loading, setLoading] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState<any[]>([]);

  useEffect(() => {
    const checkForDuplicates = async () => {
      if (!firstName.trim() || !lastName.trim() || firstName.length < 2) {
        setPotentialDuplicates([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('members')
          .select('id, first_name, last_name, city, group_type, secondary_groups')
          .or(`first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%`)
          .limit(5);

        if (error) throw error;

        // Filtrer les doublons potentiels (insensible à la casse)
        const duplicates = (data || []).filter(member => 
          member.first_name.toLowerCase().includes(firstName.toLowerCase()) ||
          member.last_name.toLowerCase().includes(lastName.toLowerCase())
        );

        setPotentialDuplicates(duplicates);
        
        // Notifier le parent si un doublon exact est trouvé
        const exactDuplicate = duplicates.find(member => 
          member.first_name.toLowerCase() === firstName.toLowerCase() &&
          member.last_name.toLowerCase() === lastName.toLowerCase()
        );
        
        if (exactDuplicate) {
          onDuplicateFound(exactDuplicate);
        }
      } catch (error) {
        console.error('Erreur de vérification des doublons:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(checkForDuplicates, 500);
    return () => clearTimeout(timeoutId);
  }, [firstName, lastName, onDuplicateFound]);

  if (potentialDuplicates.length === 0 || !firstName || !lastName) {
    return null;
  }

  return (
    <Alert className="mt-4 bg-amber-50 border-amber-200">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-700">
        <p className="font-medium mb-2">Doublon(s) potentiel(s) détecté(s) :</p>
        <div className="space-y-2">
          {potentialDuplicates.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-2 bg-white rounded border border-amber-200">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="font-medium">
                    {member.first_name} {member.last_name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {member.city && `Ville: ${member.city} • `}
                    Groupes: {member.group_type}
                    {member.secondary_groups?.length > 0 && 
                      ` + ${member.secondary_groups.length} secondaire(s)`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.open(import.meta.env.BASE_URL + `member/${member.id}`, '_blank')}
                className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Voir
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs mt-2">
          Si c'est le même élève, le système vous proposera d'ajouter le groupe comme groupe secondaire.
        </p>
      </AlertDescription>
    </Alert>
  );
};