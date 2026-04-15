"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { stationCoordinates } from "@/data/stations";

interface StationTrain {
  trainNo: string;
  trainName: string;
  arrivalTime: string;
  departureTime: string;
  classes: string[];
  daysOfRun: {
    Sun: boolean;
    Mon: boolean;
    Tue: boolean;
    Wed: boolean;
    Thu: boolean;
    Fri: boolean;
    Sat: boolean;
  };
  isOrigin: boolean;
  isDestination: boolean;
  daysCount: number;
}

interface StationTrainsData {
  stationCode: string;
  stationName: string;
  state: string | null;
  totalTrains: number;
  trains: StationTrain[];
  error?: string;
}

interface StationSearchProps {
  onViewTrain?: (trainNo: string, tab: "route" | "live") => void;
}

const DAYS_ORDER: Array<keyof StationTrain["daysOfRun"]> = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

const POPULAR_STATIONS = [
  { code: "NDLS", name: "New Delhi" },
  { code: "HWH", name: "Howrah Jn" },
  { code: "CSMT", name: "Mumbai CSMT" },
  { code: "MAS", name: "Chennai Central" },
  { code: "SBC", name: "KSR Bengaluru" },
  { code: "SC", name: "Secunderabad Jn" },
];

export default function StationSearch({ onViewTrain }: StationSearchProps) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [data, setData] = useState<StationTrainsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterDay, setFilterDay] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build searchable station list from our dataset
  const allStations = useMemo(() => {
    return Object.entries(stationCoordinates).map(([code, info]) => ({
      code,
      name: info.name,
      state: info.state,
    }));
  }, []);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return allStations
      .filter(
        (s) =>
          s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, allStations]);

  const fetchStation = async (code: string) => {
    setLoading(true);
    setError(null);
    setData(null);
    setFilterDay(null);
    setFilterText("");
    setShowSuggestions(false);

    try {
      const res = await fetch(`/api/station/${encodeURIComponent(code)}`);
      const json = await res.json();
      if (json.error && !json.trains) {
        setError(json.error);
      } else {
        setData(json);
      }
    } catch {
      setError("Failed to fetch station data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Try to extract code: either user typed a code directly, or picked a suggestion
    const trimmed = query.trim().toUpperCase();
    // Extract code pattern like "NAME (CODE)" or just the code
    const codeMatch = trimmed.match(/\(([A-Z0-9]+)\)/);
    const code = codeMatch ? codeMatch[1] : trimmed.split(" ")[0];
    if (code && /^[A-Z0-9]{2,8}$/.test(code)) {
      fetchStation(code);
    } else {
      setError("Please enter a valid station code (e.g., SBC, NDLS, HWH)");
    }
  };

  const pickSuggestion = (code: string, name: string) => {
    setQuery(`${name} (${code})`);
    setShowSuggestions(false);
    fetchStation(code);
  };

  // Filter trains based on day and text
  const filteredTrains = useMemo(() => {
    if (!data) return [];
    let trains = data.trains;
    if (filterDay) {
      trains = trains.filter(
        (t) => t.daysOfRun[filterDay as keyof StationTrain["daysOfRun"]]
      );
    }
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      trains = trains.filter(
        (t) =>
          t.trainNo.toLowerCase().includes(q) ||
          t.trainName.toLowerCase().includes(q)
      );
    }
    return trains;
  }, [data, filterDay, filterText]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Search Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Station Search
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Find all trains passing through a station
        </p>

        <div ref={wrapperRef} className="relative">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Enter station name or code (e.g., Bengaluru, SBC)"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                autoComplete="off"
              />

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 max-h-80 overflow-y-auto z-20">
                  {suggestions.map((s) => (
                    <button
                      key={s.code}
                      type="button"
                      onClick={() => pickSuggestion(s.code, s.name)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                            {s.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {s.state}
                          </div>
                        </div>
                        <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                          {s.code}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                "Search"
              )}
            </button>
          </form>
        </div>

        {/* Popular stations */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500 py-1">Popular:</span>
          {POPULAR_STATIONS.map((s) => (
            <button
              key={s.code}
              onClick={() => {
                setQuery(`${s.name} (${s.code})`);
                fetchStation(s.code);
              }}
              className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {data && data.trains.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                {data.stationName}{" "}
                <span className="text-slate-400 dark:text-slate-500 font-mono text-sm">
                  {data.stationCode}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {data.state && `${data.state} · `}
                {data.totalTrains} trains
                {filteredTrains.length !== data.totalTrains && ` · ${filteredTrains.length} shown`}
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter by train..."
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 w-44"
              />
              <select
                value={filterDay || ""}
                onChange={(e) => setFilterDay(e.target.value || null)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 text-slate-800 dark:text-slate-100"
              >
                <option value="">All days</option>
                {DAYS_ORDER.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Train list */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredTrains.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                No trains match your filters.
              </p>
            ) : (
              filteredTrains.map((t) => (
                <div
                  key={t.trainNo}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {/* Times block */}
                  <div className="flex flex-col items-center text-center w-20 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <div className="text-center">
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Arr
                        </div>
                        <div className={`text-xs font-semibold ${t.isOrigin ? "text-green-600 dark:text-green-400" : "text-slate-800 dark:text-slate-100"}`}>
                          {t.isOrigin ? "SRC" : t.arrivalTime}
                        </div>
                      </div>
                      <div className="text-slate-300 dark:text-slate-600 text-xs">·</div>
                      <div className="text-center">
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Dep
                        </div>
                        <div className={`text-xs font-semibold ${t.isDestination ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-100"}`}>
                          {t.isDestination ? "DST" : t.departureTime}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Train info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {t.trainName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        #{t.trainNo}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {/* Days of run */}
                      <div className="flex gap-0.5">
                        {DAYS_ORDER.map((d) => (
                          <span
                            key={d}
                            className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                              t.daysOfRun[d as keyof StationTrain["daysOfRun"]]
                                ? "bg-green-500/20 text-green-700 dark:text-green-400"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                            }`}
                            title={d}
                          >
                            {d[0]}
                          </span>
                        ))}
                      </div>
                      {t.classes.length > 0 && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-2">
                          {t.classes.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {onViewTrain && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => onViewTrain(t.trainNo, "route")}
                        className="px-2 py-1 text-[10px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        title="View route"
                      >
                        Route
                      </button>
                      <button
                        onClick={() => onViewTrain(t.trainNo, "live")}
                        className="px-2 py-1 text-[10px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-green-50 dark:hover:bg-green-950/40 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                        title="Live status"
                      >
                        Live
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!data && !loading && !error && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🚉</div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Find Trains at Any Station
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Type a station name or code to see all trains passing through,
            their timings, and days of operation. Click a train to view its
            route or live status.
          </p>
        </div>
      )}
    </div>
  );
}
