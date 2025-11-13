import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GroupType } from '@/types/member';

// Définir l'interface des props
interface MemberFormProps {
  onAddMember: (firstName: string, lastName: string, city: string, group: GroupType) => Promise<void>;
}

const MemberForm: React.FC<MemberFormProps> = ({ onAddMember }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [group, setGroup] = useState<GroupType>('Samedi');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onAddMember(firstName.trim(), lastName.trim(), city.trim(), group);
      // Reset form after successful submission
      setFirstName('');
      setLastName('');
      setCity('');
      setGroup('Samedi');
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ajouter un membre</CardTitle>
        <CardDescription>
          Enregistrez un nouveau membre dans le système
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prénom"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nom"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ville"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="group">Groupe</Label>
            <Select value={group} onValueChange={(value: GroupType) => setGroup(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un groupe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Samedi">Groupe Samedi</SelectItem>
                <SelectItem value="Dimanche">Groupe Dimanche</SelectItem>
                <SelectItem value="Lundi">La méthode Nouraniya</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !firstName.trim() || !lastName.trim()}
          >
            {isLoading ? "Ajout en cours..." : "Ajouter le membre"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MemberForm;