import React, { useState, useEffect, useCallback } from 'react';
import type { CoverageAreaRequest } from '../types/dto';
import type { StateResponse, CityResponse } from '../services/api';
import { SearchableSelect } from './SearchableSelect';
import { SearchableMultiSelect } from './SearchableMultiSelect';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Plus, Trash2, Layers } from 'lucide-react';

const CITY_NONE_VALUE = '__none__';

interface CoverageAreaEditorProps {
  value: CoverageAreaRequest[];
  onChange: (areas: CoverageAreaRequest[]) => void;
  states: StateResponse[];
  onLoadCities: (stateId: number) => Promise<CityResponse[]>;
  disabled?: boolean;
}

export function CoverageAreaEditor({
  value,
  onChange,
  states,
  onLoadCities,
  disabled = false,
}: CoverageAreaEditorProps) {
  const [citiesCache, setCitiesCache] = useState<Record<number, CityResponse[]>>({});
  const [batchStateId, setBatchStateId] = useState<string | null>(null);
  const [batchCities, setBatchCities] = useState<CityResponse[]>([]);
  const [batchCitiesLoading, setBatchCitiesLoading] = useState(false);
  const [batchSelectedCities, setBatchSelectedCities] = useState<Set<string>>(new Set());

  useEffect(() => {
    value.forEach((area) => {
      if (area.stateId && !citiesCache[area.stateId]) {
        onLoadCities(area.stateId).then((cities) =>
          setCitiesCache((prev) => ({ ...prev, [area.stateId]: cities }))
        );
      }
    });
  }, [value, onLoadCities]);

  useEffect(() => {
    if (!batchStateId) {
      setBatchCities([]);
      setBatchSelectedCities(new Set());
      return;
    }
    setBatchCitiesLoading(true);
    onLoadCities(Number(batchStateId))
      .then((cities) => {
        setBatchCities(cities);
        setBatchSelectedCities(new Set());
      })
      .finally(() => setBatchCitiesLoading(false));
  }, [batchStateId, onLoadCities]);

  const stateOptions = states.map((s) => ({ value: String(s.id), label: s.name }));

  const handleAddRow = () => {
    const firstStateId = states[0]?.id ?? 0;
    onChange([...value, { stateId: firstStateId, cityId: null }]);
  };

  const handleRemoveRow = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleStateChange = (index: number, stateId: string | null) => {
    const next = [...value];
    const id = stateId ? Number(stateId) : (states[0]?.id ?? 0);
    next[index] = { stateId: id, cityId: null };
    onChange(next);
  };

  const handleCityChange = (index: number, cityId: string | null) => {
    const next = [...value];
    const numCityId = cityId && cityId !== CITY_NONE_VALUE ? Number(cityId) : null;
    next[index] = { ...next[index], cityId: numCityId };
    onChange(next);
  };

  const getCityOptionsForRow = useCallback(
    (stateId: number): { value: string; label: string }[] => {
      const cities = citiesCache[stateId] ?? [];
      return [
        { value: CITY_NONE_VALUE, label: 'Todas' },
        ...cities.map((c) => ({ value: String(c.id), label: c.name })),
      ];
    },
    [citiesCache]
  );

  const handleAddBatch = () => {
    if (!batchStateId) return;
    const stateIdNum = Number(batchStateId);
    const toAdd: CoverageAreaRequest[] = [];
    if (batchSelectedCities.has(CITY_NONE_VALUE)) {
      toAdd.push({ stateId: stateIdNum, cityId: null });
    }
    batchSelectedCities.forEach((v) => {
      if (v !== CITY_NONE_VALUE) toAdd.push({ stateId: stateIdNum, cityId: Number(v) });
    });
    if (toAdd.length === 0) return;
    onChange([...value, ...toAdd]);
    setBatchSelectedCities(new Set());
    setBatchStateId(null);
  };

  const batchCityOptions = [
    { value: CITY_NONE_VALUE, label: 'Todas las ciudades de la provincia' },
    ...batchCities.map((c) => ({ value: String(c.id), label: c.name })),
  ];
  const batchCount = batchSelectedCities.size;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-[#6b6a6e]">Zonas de cobertura</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddRow}
          disabled={disabled}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Agregar zona
        </Button>
      </div>

      <div className="rounded-lg border border-dashed border-[#55c3c5]/50 bg-[#f0fdfc]/30 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[#3b3a3e]">
          <Layers className="h-4 w-4" />
          Agregar varias zonas a la vez
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <SearchableSelect
              options={stateOptions}
              value={batchStateId}
              onValueChange={setBatchStateId}
              placeholder="Elegir provincia"
              label="Provincia"
              disabled={disabled}
              emptyText="No hay provincias"
            />
          </div>
          <div className="min-w-[220px] flex-1">
            <SearchableMultiSelect
              options={batchCityOptions}
              selectedValues={batchSelectedCities}
              onSelectionChange={setBatchSelectedCities}
              placeholder="Elegir ciudades (opcional)"
              label="Ciudades"
              disabled={disabled || !batchStateId}
              emptyText="Sin ciudades o cargando…"
              loading={batchCitiesLoading}
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleAddBatch}
            disabled={disabled || !batchStateId || batchCount === 0}
            className="bg-[#55c3c5] hover:bg-[#4ab3b5] shrink-0"
          >
            Agregar {batchCount} zona{batchCount !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-[#6b6a6e] py-2">
          No hay zonas. Agregá una con el botón anterior o varias con la selección múltiple.
        </p>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
          {value.map((area, index) => (
            <div
              key={index}
              className="flex flex-wrap items-end gap-2 p-3 rounded-lg border border-[#4a494d]/20 bg-[#f8f9fa]/50"
            >
              <div className="flex-1 min-w-[180px]">
                <SearchableSelect
                  options={stateOptions}
                  value={area.stateId ? String(area.stateId) : null}
                  onValueChange={(v) => handleStateChange(index, v)}
                  placeholder="Seleccionar provincia"
                  label="Provincia"
                  disabled={disabled}
                  emptyText="No hay provincias"
                />
              </div>
              <div className="flex-1 min-w-[180px]">
                <SearchableSelect
                  options={area.stateId ? getCityOptionsForRow(area.stateId) : []}
                  value={area.cityId != null ? String(area.cityId) : CITY_NONE_VALUE}
                  onValueChange={(v) => handleCityChange(index, v)}
                  placeholder="Todas"
                  label="Ciudad (opcional)"
                  disabled={disabled || !area.stateId}
                  emptyText="Cargando…"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-[#6b6a6e] hover:text-red-600 shrink-0"
                onClick={() => handleRemoveRow(index)}
                disabled={disabled || value.length <= 1}
                aria-label="Quitar zona"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
