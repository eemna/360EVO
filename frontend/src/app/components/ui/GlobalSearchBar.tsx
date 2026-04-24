import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  X,
  Briefcase,
  User,
  Star,
  Calendar,
  BookOpen,
} from "lucide-react";
import api from "../../../services/axios";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface Suggestion {
  id: string;
  title: string;
  label: string;
  type: "project" | "user" | "expert" | "event" | "program";
  category: string;
  meta: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  project: <Briefcase className="w-3.5 h-3.5" />,
  user: <User className="w-3.5 h-3.5" />,
  expert: <Star className="w-3.5 h-3.5" />,
  event: <Calendar className="w-3.5 h-3.5" />,
  program: <BookOpen className="w-3.5 h-3.5" />,
};

const TYPE_URL: Record<string, (id: string) => string> = {
  project: (id) => `/app/startup/projects/${id}`,
  user: (id) => `/app/profile/${id}`,
  expert: (id) => `/app/profile/${id}`,
  event: (id) => `/app/events/${id}`,
  program: (id) => `/app/programs/${id}`,
};

const MIN_CHARS = 2;

export default function GlobalSearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQ = useDebounce(query, 300);

  useEffect(() => {
    const trimmed = debouncedQ.trim();

    if (trimmed.length < MIN_CHARS) {
      Promise.resolve().then(() => {
        setSuggestions([]);
        setOpen(false);
        setLoading(false);
      });
      return;
    }

    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });

    api
      .get("/search/autocomplete", { params: { q: trimmed } })
      .then(({ data }) => {
        if (cancelled) return;
        setSuggestions(data.suggestions ?? []);
        setOpen(true);
        setActiveIdx(-1);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQ]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const submitSearch = useCallback(() => {
    if (!query.trim()) return;
    setOpen(false);
    navigate(`/app/search?q=${encodeURIComponent(query.trim())}`);
  }, [query, navigate]);

  const pickSuggestion = useCallback(
    (s: Suggestion) => {
      setOpen(false);
      setQuery("");
      setSuggestions([]);
      navigate(TYPE_URL[s.type](s.id));
    },
    [navigate],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter" && query.trim()) submitSearch();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0) pickSuggestion(suggestions[activeIdx]);
      else submitSearch();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const grouped = suggestions.reduce<Record<string, Suggestion[]>>((acc, s) => {
    (acc[s.category] = acc[s.category] ?? []).push(s);
    return acc;
  }, {});

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search…"
          aria-label="Global search"
          className="w-full pl-9 pr-8 py-2 text-sm bg-gray-100 hover:bg-gray-200 focus:bg-white border border-transparent focus:border-gray-300 rounded-xl outline-none transition-all"
          onChange={(e) => {
            const value = e.target.value;
            setQuery(value);
            if (value.trim().length >= MIN_CHARS) setOpen(true);
            else {
              setSuggestions([]);
              setOpen(false);
            }
          }}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && query.trim().length >= MIN_CHARS && (
        <div className="absolute top-full mt-2 w-full min-w-[300px] bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-400">Searching…</div>
          )}
          {!loading && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-400">
              No results for "{query}"
            </div>
          )}

          {!loading &&
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {category}
                </div>
                {items.map((s) => {
                  const flatIdx = suggestions.indexOf(s);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-label={`Go to ${s.label}`}
                      onMouseDown={() => pickSuggestion(s)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        flatIdx === activeIdx
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-gray-400 flex-shrink-0">
                        {TYPE_ICON[s.type]}
                      </span>
                      <span className="flex-1 truncate font-medium">
                        {s.label}
                      </span>
                      {s.meta && (
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {s.meta}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}

          {!loading && suggestions.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5">
              <button
                type="button"
                aria-label={`See all results for ${query}`}
                onMouseDown={submitSearch}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                See all results for "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
