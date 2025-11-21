// Path: src/components/members/SearchWithTags.tsx
import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Plus } from "lucide-react";

interface SearchWithTagsProps {
  onSearchChange: (searchTerms: string[]) => void;
  placeholder?: string;
}

export const SearchWithTags = ({ onSearchChange, placeholder = "Rechercher..." }: SearchWithTagsProps) => {
  const [inputValue, setInputValue] = useState("");
  const [searchTags, setSearchTags] = useState<string[]>([]);

  const handleAddTag = () => {
    const term = inputValue.trim();
    if (term && !searchTags.includes(term)) {
      const newTags = [...searchTags, term];
      setSearchTags(newTags);
      onSearchChange(newTags);
      setInputValue("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = searchTags.filter(tag => tag !== tagToRemove);
    setSearchTags(newTags);
    onSearchChange(newTags);
  };

  const clearAllTags = () => {
    setSearchTags([]);
    onSearchChange([]);
  };

  return (
    <div className="space-y-3">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-20"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAddTag}
          disabled={!inputValue.trim()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 px-2"
        >
          <Plus className="h-3 w-3 mr-1" />
          Ajouter
        </Button>
      </div>

      {/* Tags de recherche */}
      {searchTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-slate-500">Filtres actifs :</span>
          {searchTags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 py-1 px-2 text-sm"
            >
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveTag(tag)}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAllTags}
            className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Tout effacer
          </Button>
        </div>
      )}
    </div>
  );
};