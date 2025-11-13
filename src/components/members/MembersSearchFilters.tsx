import { Search } from "lucide-react";

interface MembersSearchFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterGroup: string;
  onFilterGroupChange: (value: string) => void;
  filterCity: string;
  onFilterCityChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  members: any[];
}

export const MembersSearchFilters = ({
  searchTerm,
  onSearchChange,
  filterGroup,
  onFilterGroupChange,
  filterCity,
  onFilterCityChange,
  sortBy,
  onSortChange,
  members
}: MembersSearchFiltersProps) => {
  const cities = Array.from(new Set(members.map(m => m.city))).filter(city => city);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="md:col-span-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Rechercher un élève par nom, prénom ou ville..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      
      <div>
        <select 
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          value={filterGroup}
          onChange={(e) => onFilterGroupChange(e.target.value)}
        >
          <option value="">Tous les groupes</option>
          <option value="Samedi">Samedi</option>
          <option value="Dimanche">Dimanche</option>
          <option value="Lundi">Nouraniya</option>
        </select>
      </div>
      
      <div>
        <select 
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          value={filterCity}
          onChange={(e) => onFilterCityChange(e.target.value)}
        >
          <option value="">Toutes les villes</option>
          {cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>
      
      <div>
        <select 
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="name_asc">Nom A-Z</option>
          <option value="name_desc">Nom Z-A</option>
          <option value="recent">Plus récents</option>
          <option value="oldest">Plus anciens</option>
        </select>
      </div>
    </div>
  );
};
