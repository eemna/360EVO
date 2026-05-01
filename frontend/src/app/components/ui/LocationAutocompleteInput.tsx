import { useState, useRef, useEffect } from "react";
import { Input } from "./input";
import { MapPin } from "lucide-react";

interface Suggestion {
  display_name: string;
  place_id: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function LocationAutocompleteInput({ value, onChange }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSuggestions = (q: string) => {
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&featuretype=city`,
          { headers: { "Accept-Language": "en" } },
        );
        const data = await res.json();
        setSuggestions(data);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            fetchSuggestions(e.target.value);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Start typing a city..."
          className="pl-9"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            ...
          </span>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((s) => {
            const parts = s.display_name.split(",");
            const city = parts[0]?.trim();
            const country = parts[parts.length - 1]?.trim();
            const short = `${city}, ${country}`;

            return (
              <li
                key={s.place_id}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 cursor-pointer"
                onMouseDown={() => {
                  onChange(short);
                  setOpen(false);
                  setSuggestions([]);
                }}
              >
                <MapPin className="size-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate">{s.display_name}</span>
              </li>
            );
          })}
        </ul>
      )}

      {open && suggestions.length === 0 && !loading && value.length >= 3 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400">
          No locations found
        </div>
      )}
    </div>
  );
}
