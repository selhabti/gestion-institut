// Path: src/components/members/MembersSearchFilters.tsx
import { SearchWithTags } from "./SearchWithTags";

interface MembersSearchFiltersProps {
  onSearchChange: (searchTerms: string[]) => void; // ← Changé pour accepter un tableau
  filterGroup: string;
  onFilterGroupChange: (value: string) => void;
  filterCity: string;
  onFilterCityChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  members: any[];
}

export const MembersSearchFilters = ({
  onSearchChange,
  filterGroup,
  onFilterGroupChange,
  filterCity,
  onFilterCityChange,
  sortBy,
  onSortChange,
  members
}: MembersSearchFiltersProps) => {
  
  // Extraire les villes uniques pour le filtre
  const uniqueCities = [...new Set(members.map(m => m.city).filter(Boolean))];

  return (
    <div className="space-y-4">
      {/* REMPLACER l'ancienne recherche par SearchWithTags */}
      <SearchWithTags 
        onSearchChange={onSearchChange}
        placeholder="Rechercher un élève par nom, prénom ou ville..."
      />

      {/* Garder les autres filtres existants */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Filtrer par groupe</label>
          <select
            value={filterGroup}
            onChange={(e) => onFilterGroupChange(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous les groupes</option>
            <option value="Samedi">Samedi</option>
            <option value="Dimanche">Dimanche</option>
            <option value="Lundi">Lundi</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Filtrer par ville</label>
          <select
            value={filterCity}
            onChange={(e) => onFilterCityChange(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Toutes les villes</option>
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Trier par</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name_asc">Nom (A-Z)</option>
            <option value="name_desc">Nom (Z-A)</option>
            <option value="recent">Plus récent</option>
            <option value="oldest">Plus ancien</option>
          </select>
        </div>
      </div>
    </div>
  );
};