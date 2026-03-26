"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CompanyOption = {
  Rut: string;
  Empresa: string;
};

type Props = {
  companies: CompanyOption[];
};

export default function ResultadosCompanySelector({ companies }: Props) {
  const [query, setQuery] = useState("");
  const [selectedRut, setSelectedRut] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => {
      const name = (c.Empresa || "").toLowerCase();
      const rut = (c.Rut || "").toLowerCase();
      return name.includes(q) || rut.includes(q);
    });
  }, [companies, query]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedRut("");
    setOpen(true);
  };

  const handleSelect = (company: CompanyOption) => {
    setQuery(company.Empresa || company.Rut);
    setSelectedRut(company.Rut);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2 relative">
      <Label htmlFor="rutEmpresaCombobox">Seleccionar Empresa</Label>
      <Input
        id="rutEmpresaCombobox"
        placeholder="Escriba para buscar empresa..."
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 120);
        }}
        autoComplete="off"
      />
      <input type="hidden" name="rutEmpresa" value={selectedRut} />

      {open ? (
        <div className="absolute left-0 right-0 top-[74px] z-20 max-h-56 overflow-auto rounded-md border bg-background shadow-md">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No se encontraron empresas.
            </div>
          ) : (
            filtered.slice(0, 50).map((e) => (
              <button
                type="button"
                key={e.Rut}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => handleSelect(e)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
              >
                <span className="font-medium">{e.Empresa || e.Rut}</span>
                <span className="ml-2 text-muted-foreground">{e.Rut}</span>
              </button>
            ))
          )}
        </div>
      ) : null}

      {!selectedRut && query.trim() ? (
        <p className="text-xs text-muted-foreground">
          Seleccione una empresa de la lista para continuar.
        </p>
      ) : null}
    </div>
  );
}
