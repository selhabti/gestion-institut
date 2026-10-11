// src/components/attendance/SurahCombobox.tsx
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SURAHS, SURAH_VERSES } from "@/lib/quranReference";

interface SurahComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SurahCombobox({
  value,
  onChange,
  placeholder = "Choisir une sourate",
}: SurahComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-64 justify-between font-normal"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command
          filter={(itemValue, search) =>
            itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder="Rechercher une sourate…" />
          <CommandList className="max-h-72">
            <CommandEmpty>Aucune sourate trouvée.</CommandEmpty>
            {SURAHS.map((s, i) => (
              <CommandItem
                key={s}
                value={s}
                onSelect={() => {
                  onChange(s);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === s ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="flex-1">{s}</span>
                <span className="text-xs text-slate-400">
                  {SURAH_VERSES[i]} v.
                </span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default SurahCombobox;
