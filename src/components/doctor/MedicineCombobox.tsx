import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MEDICINE_NAMES } from "@/data/medicines";
import { cn } from "@/lib/utils";

interface MedicineComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MedicineCombobox({ value, onChange, placeholder = "Type medicine name..." }: MedicineComboboxProps) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value.trim().length >= 1) {
      const q = value.toLowerCase();
      const matches = MEDICINE_NAMES.filter(m => m.toLowerCase().includes(q)).slice(0, 10);
      setFiltered(matches);
      setOpen(matches.length > 0);
    } else {
      setFiltered([]);
      setOpen(false);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (name: string) => {
    onChange(name);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (value.trim().length >= 1 && filtered.length > 0) setOpen(true);
        }}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          {filtered.map((name) => (
            <button
              key={name}
              type="button"
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer",
                name.toLowerCase() === value.toLowerCase() && "bg-accent"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(name);
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
