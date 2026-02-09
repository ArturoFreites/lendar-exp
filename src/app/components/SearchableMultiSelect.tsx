import React, { useState } from 'react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Label } from './ui/label';
import { ChevronsUpDown } from 'lucide-react';
import { cn } from './ui/utils';

export interface SearchableMultiSelectOption {
  value: string;
  label: string;
}

interface SearchableMultiSelectProps {
  options: SearchableMultiSelectOption[];
  selectedValues: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  emptyText?: string;
  className?: string;
  triggerClassName?: string;
  loading?: boolean;
}

export function SearchableMultiSelect({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = 'Seleccionar...',
  label,
  disabled = false,
  emptyText = 'Sin resultados',
  className,
  triggerClassName,
  loading = false,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = (value: string) => {
    const next = new Set(selectedValues);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onSelectionChange(next);
  };

  const selectedLabels = options.filter((o) => selectedValues.has(o.value)).map((o) => o.label);
  const summary = selectedLabels.length === 0
    ? placeholder
    : selectedLabels.length <= 2
      ? selectedLabels.join(', ')
      : `${selectedLabels.length} seleccionadas`;

  return (
    <div className={cn('space-y-1', className)}>
      {label && <Label className="text-xs text-[#6b6a6e]">{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className={cn(
              'h-9 w-full justify-between font-normal text-sm',
              selectedValues.size === 0 && 'text-muted-foreground',
              triggerClassName
            )}
          >
            <span className="truncate">{loading ? 'Cargando…' : summary}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={true}>
            <CommandInput placeholder="Buscar..." className="h-9" />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => toggle(opt.value)}
                    className="cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedValues.has(opt.value)}
                      className="mr-2 pointer-events-none"
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
