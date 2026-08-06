import { ACCENT } from "../theme";

interface FilterPillsProps<T extends string> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  /** Optional label override per option value (default: the value itself). */
  labels?: Partial<Record<T, string>>;
}

// Segmented pill-group filter matching the design mockup's recurring filter-chip pattern (role
// filters, status filters, classroom/course pickers, audit category filters): active chip gets
// an accent border + tinted background, inactive chips are plain outlined buttons.
export function FilterPills<T extends string>({ options, value, onChange, labels }: FilterPillsProps<T>) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${active ? ACCENT : "#E7E9EE"}`,
              background: active ? `${ACCENT}14` : "#fff",
              color: active ? ACCENT : "#374151",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {labels?.[opt] ?? opt}
          </button>
        );
      })}
    </div>
  );
}
