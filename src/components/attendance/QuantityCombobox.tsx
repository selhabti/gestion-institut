// src/components/attendance/QuantityCombobox.tsx
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
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  HIZB_FRACTIONS,
  PAGE_OPTIONS,
  HIZB_OPTIONS,
} from "@/lib/quranReference";

interface QuantityComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function QuantityCombobox({
  value,
  onChange,
  placeholder = "Quantité (ex : 1/2 hizb, 3 pages)",
}: QuantityComboboxProps) {
  const [open, setOpen] = useState(false);

  const renderItems = (items: string[]) =>
    items.map((item) => (
      <CommandItem
        key={item}
        value={item}
        onSelect={() => {
          onChange(item);
          setOpen(false);
        }}
      >
        <Check
          className={cn(
            "mr-2 h-4 w-4",
            value === item ? "opacity-100" : "opacity-0"
          )}
        />
        {item}
      </CommandItem>
    ));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex-1 min-w-[200px] justify-between font-normal"
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Tapez 1, 1/2, 3…" />
          <CommandList>
            <CommandEmpty>Aucune option.</CommandEmpty>
            <CommandGroup heading="Fractions de hizb">
              {renderItems(HIZB_FRACTIONS)}
            </CommandGroup>
            <CommandGroup heading="Pages">{renderItems(PAGE_OPTIONS)}</CommandGroup>
            <CommandGroup heading="Hizb">{renderItems(HIZB_OPTIONS)}</CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default QuantityCombobox;
