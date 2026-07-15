"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Input } from "./input";

export type SearchableComboboxOption = {
  value: string;
  label: string;
  /** Extra text used only for filtering (e.g. phone). */
  keywords?: string;
};

export type SearchableComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableComboboxOption[];
  placeholder?: string;
  emptyMessage?: string;
  /** Include a blank choice (value "") at the top when query is empty. */
  allowEmpty?: boolean;
  emptyOptionLabel?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-label"?: string;
  className?: string;
  maxItems?: number;
};

export function SearchableCombobox({
  value,
  onChange,
  options,
  placeholder = "Digite para filtrar…",
  emptyMessage = "Nenhum resultado.",
  allowEmpty = false,
  emptyOptionLabel = "Nenhum",
  disabled = false,
  required = false,
  "aria-label": ariaLabel,
  className,
  maxItems = 8,
}: SearchableComboboxProps) {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const current = options.find((option) => option.value === value);
    setQuery(current?.label ?? "");
  }, [value, options]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
        const current = options.find((option) => option.value === value);
        setQuery(current?.label ?? "");
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [options, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = !q
      ? options
      : options.filter((option) => {
          const hay =
            `${option.label} ${option.keywords ?? ""}`.toLowerCase();
          return hay.includes(q);
        });
    return base.slice(0, maxItems);
  }, [options, query, maxItems]);

  return (
    <div ref={wrapRef} className={className ?? "relative"}>
      <Input
        value={query}
        disabled={disabled}
        required={required && !value}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        autoComplete="off"
      />
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          {allowEmpty && !query.trim() ? (
            <li>
              <button
                type="button"
                role="option"
                className="flex w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/40"
                onClick={() => {
                  onChange("");
                  setQuery("");
                  setOpen(false);
                }}
              >
                {emptyOptionLabel}
              </button>
            </li>
          ) : null}
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              {emptyMessage}
            </li>
          ) : (
            filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted/40"
                  onClick={() => {
                    onChange(option.value);
                    setQuery(option.label);
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">{option.label}</span>
                  {option.keywords ? (
                    <span className="text-xs text-muted-foreground">
                      {option.keywords}
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
