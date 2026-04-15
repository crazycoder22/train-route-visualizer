"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { stationCoordinates } from "@/data/stations";

interface TBSClassInfo {
  code: string;
  label: string;
  totalSeats: number;
  generalQuota: number;
  ladiesQuota: number;
  tatkalQuota: number;
  premiumTatkalQuota: number;
  seniorQuota: number;
  disabledQuota: number;
  duressQuota: number;
  estimatedFare: number;
  tatkalFare: number;
}

interface TBSTrain {
  trainNo: string;
  trainName: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  duration: string;
  distance: string;
  haltAtSource: string;
  trainType: string;
  daysOfRun: {
    Sun: boolean;
    Mon: boolean;
    Tue: boolean;
    Wed: boolean;
    Thu: boolean;
    Fri: boolean;
    Sat: boolean;
  };
  daysCount: number;
  classes: TBSClassInfo[];
}

const CLASS_COLORS: Record<string, string> = {
  "1A": "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
  "2A": "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
  "3A": "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  "3E": "bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30",
  SL: "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30",
  "2S": "bg-lime-500/20 text-lime-700 dark:text-lime-300 border-lime-500/30",
  CC: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30",
  EC: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30",
};

function classColor(code: string): string {
  return (
    CLASS_COLORS[code] ||
    "bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30"
  );
}

interface TBSData {
  from: string;
  to: string;
  totalTrains: number;
  trains: TBSTrain[];
  error?: string;
}

interface TrainsBetweenProps {
  onViewTrain?: (trainNo: string, tab: "route" | "live") => void;
}

const DAYS_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const POPULAR_ROUTES: Array<{ from: string; to: string; label: string }> = [
  { from: "NDLS", to: "HWH", label: "New Delhi → Howrah" },
  { from: "CSMT", to: "NDLS", label: "Mumbai → New Delhi" },
  { from: "SBC", to: "MAS", label: "Bengaluru → Chennai" },
  { from: "SBC", to: "HWH", label: "Bengaluru → Howrah" },
  { from: "MAS", to: "NDLS", label: "Chennai → New Delhi" },
];

type SortField = "departure" | "duration" | "name" | "type";

function parseTimeToMinutes(s: string): number {
  const m = s.match(/(\d+):(\d+)/);
  return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 99999;
}

function parseDurationMinutes(s: string): number {
  const m = s.match(/(\d+)[.:](\d+)/);
  return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 99999;
}

function getTrainTypeColor(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("rajdhani") || t.includes("vande") || t.includes("shatabdi"))
    return "bg-purple-500/20 text-purple-700 dark:text-purple-300";
  if (t.includes("duronto")) return "bg-pink-500/20 text-pink-700 dark:text-pink-300";
  if (t.includes("super")) return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
  if (t.includes("intercity"))
    return "bg-teal-500/20 text-teal-700 dark:text-teal-300";
  if (t.includes("mail")) return "bg-amber-500/20 text-amber-700 dark:text-amber-300";
  return "bg-slate-500/20 text-slate-700 dark:text-slate-300";
}

interface StationPickerProps {
  label: string;
  value: string;
  onChange: (value: string, name: string) => void;
  placeholder: string;
}

function StationPicker({ label, value, onChange, placeholder }: StationPickerProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const allStations = useMemo(
    () =>
      Object.entries(stationCoordinates).map(([code, info]) => ({
        code,
        name: info.name,
        state: info.state,
      })),
    []
  );

  const suggestions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return allStations.slice(0, 8);
    return allStations
      .filter(
        (s) =>
          s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, allStations]);

  const pick = (code: string, name: string) => {
    onChange(code, name);
    setQuery(`${name} (${code})`);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <label className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold mb-1 block">
        {label}
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          // Clear value if user is still typing
          if (e.target.value !== value) onChange("", "");
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 max-h-80 overflow-y-auto z-30">
          {suggestions.map((s) => (
            <button
              key={s.code}
              type="button"
              onClick={() => pick(s.code, s.name)}
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
  );
}

export default function TrainsBetween({ onViewTrain }: TrainsBetweenProps) {
  const [fromCode, setFromCode] = useState("");
  const [fromName, setFromName] = useState("");
  const [toCode, setToCode] = useState("");
  const [toName, setToName] = useState("");
  const [data, setData] = useState<TBSData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortField>("departure");
  const [filterDay, setFilterDay] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");
  const [expandedTrainNo, setExpandedTrainNo] = useState<string | null>(null);

  const fetchTrains = async (src: string, dst: string) => {
    if (!src || !dst) return;
    setLoading(true);
    setError(null);
    setData(null);
    setFilterDay(null);
    setFilterText("");

    try {
      const res = await fetch(
        `/api/tbs/${encodeURIComponent(src)}/${encodeURIComponent(dst)}`
      );
      const json = await res.json();
      if (json.error && !json.trains) {
        setError(json.error);
      } else {
        setData(json);
      }
    } catch {
      setError("Failed to fetch trains. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromCode || !toCode) {
      setError("Please select both source and destination stations.");
      return;
    }
    fetchTrains(fromCode, toCode);
  };

  const handleSwap = () => {
    const oldFrom = fromCode;
    const oldFromName = fromName;
    setFromCode(toCode);
    setFromName(toName);
    setToCode(oldFrom);
    setToName(oldFromName);
    if (toCode && oldFrom) {
      fetchTrains(toCode, oldFrom);
    }
  };

  const pickRoute = (from: string, to: string) => {
    setFromCode(from);
    setFromName(stationCoordinates[from]?.name || from);
    setToCode(to);
    setToName(stationCoordinates[to]?.name || to);
    fetchTrains(from, to);
  };

  const filteredAndSorted = useMemo(() => {
    if (!data) return [];
    let trains = [...data.trains];

    if (filterDay) {
      trains = trains.filter(
        (t) => t.daysOfRun[filterDay as keyof TBSTrain["daysOfRun"]]
      );
    }
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      trains = trains.filter(
        (t) =>
          t.trainNo.toLowerCase().includes(q) ||
          t.trainName.toLowerCase().includes(q) ||
          t.trainType.toLowerCase().includes(q)
      );
    }

    trains.sort((a, b) => {
      switch (sortBy) {
        case "departure":
          return parseTimeToMinutes(a.departureTime) - parseTimeToMinutes(b.departureTime);
        case "duration":
          return parseDurationMinutes(a.duration) - parseDurationMinutes(b.duration);
        case "name":
          return a.trainName.localeCompare(b.trainName);
        case "type":
          return a.trainType.localeCompare(b.trainType);
      }
    });

    return trains;
  }, [data, filterDay, filterText, sortBy]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Search Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Trains Between Stations
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Find all trains running between two stations
        </p>

        <form onSubmit={handleSubmit}>
          <div className="flex items-end gap-2">
            <StationPicker
              label="From"
              value={fromCode && fromName ? `${fromName} (${fromCode})` : ""}
              onChange={(code, name) => {
                setFromCode(code);
                setFromName(name);
              }}
              placeholder="e.g., Bengaluru"
            />

            <button
              type="button"
              onClick={handleSwap}
              title="Swap source and destination"
              className="mb-0.5 w-11 h-12 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>

            <StationPicker
              label="To"
              value={toCode && toName ? `${toName} (${toCode})` : ""}
              onChange={(code, name) => {
                setToCode(code);
                setToName(name);
              }}
              placeholder="e.g., Chennai"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !fromCode || !toCode}
            className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Searching trains...
              </>
            ) : (
              "Find Trains"
            )}
          </button>
        </form>

        {/* Popular routes */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500 py-1">Popular:</span>
          {POPULAR_ROUTES.map((r) => (
            <button
              key={`${r.from}-${r.to}`}
              onClick={() => pickRoute(r.from, r.to)}
              className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {r.label}
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
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg flex items-center gap-2">
                {stationCoordinates[data.from]?.name || data.from}
                <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                {stationCoordinates[data.to]?.name || data.to}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {data.totalTrains} trains
                {filteredAndSorted.length !== data.totalTrains &&
                  ` · ${filteredAndSorted.length} shown`}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Filter..."
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 w-32"
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
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none focus:border-blue-500 text-slate-800 dark:text-slate-100"
              >
                <option value="departure">Sort: Departure</option>
                <option value="duration">Sort: Duration</option>
                <option value="name">Sort: Name</option>
                <option value="type">Sort: Type</option>
              </select>
            </div>
          </div>

          {/* Train list */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredAndSorted.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                No trains match your filters.
              </p>
            ) : (
              filteredAndSorted.map((t) => (
                <div
                  key={t.trainNo}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Departure time */}
                    <div className="text-center w-14 flex-shrink-0">
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
                        {t.departureTime}
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {t.from}
                      </div>
                    </div>

                    {/* Duration line */}
                    <div className="flex-1 flex flex-col items-center">
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {t.duration.replace(/\.(\d+)/, "h $1m").replace(/hr/, "").trim()}
                      </div>
                      <div className="relative w-full h-px bg-slate-300 dark:bg-slate-700 my-1">
                        <div className="absolute -top-1 left-0 w-2 h-2 rounded-full bg-green-500" />
                        <div className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-red-500" />
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        {t.distance}
                      </div>
                    </div>

                    {/* Arrival time */}
                    <div className="text-center w-14 flex-shrink-0">
                      <div className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
                        {t.arrivalTime}
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {t.to}
                      </div>
                    </div>

                    {/* Actions */}
                    {onViewTrain && (
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <button
                          onClick={() => onViewTrain(t.trainNo, "route")}
                          className="px-2 py-1 text-[10px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          Route
                        </button>
                        <button
                          onClick={() => onViewTrain(t.trainNo, "live")}
                          className="px-2 py-1 text-[10px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-green-50 dark:hover:bg-green-950/40 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                        >
                          Live
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Second row: name, type, days */}
                  <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {t.trainName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        #{t.trainNo}
                      </span>
                      {t.trainType && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getTrainTypeColor(t.trainType)}`}
                        >
                          {t.trainType}
                        </span>
                      )}
                    </div>
                    {/* Days */}
                    <div className="flex gap-0.5">
                      {DAYS_ORDER.map((d) => (
                        <span
                          key={d}
                          className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                            t.daysOfRun[d as keyof TBSTrain["daysOfRun"]]
                              ? "bg-green-500/20 text-green-700 dark:text-green-400"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500"
                          }`}
                          title={d}
                        >
                          {d[0]}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Classes row + expand toggle */}
                  {t.classes && t.classes.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() =>
                          setExpandedTrainNo(
                            expandedTrainNo === t.trainNo ? null : t.trainNo
                          )
                        }
                        className="w-full flex items-center justify-between gap-2 text-left"
                      >
                        <div className="flex flex-wrap gap-1">
                          {t.classes.map((c) => (
                            <span
                              key={c.code}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${classColor(c.code)}`}
                              title={`${c.label}${c.estimatedFare > 0 ? ` · Approx ₹${c.estimatedFare}` : ""}${c.totalSeats > 0 ? ` · ${c.totalSeats} seats` : ""}`}
                            >
                              {c.code}
                              {c.estimatedFare > 0 && (
                                <span className="ml-1 opacity-80 font-normal">
                                  ₹{c.estimatedFare}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                        <svg
                          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0 transition-transform ${
                            expandedTrainNo === t.trainNo ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Expanded class details */}
                      {expandedTrainNo === t.trainNo && (
                        <div className="mt-2 p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                          <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold mb-2">
                            Seat Composition by Class
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider">
                                  <th className="text-left py-1 pr-2 font-normal">
                                    Class
                                  </th>
                                  <th className="text-right py-1 px-2 font-normal">
                                    Fare
                                  </th>
                                  <th className="text-right py-1 px-2 font-normal">
                                    Tatkal
                                  </th>
                                  <th className="text-right py-1 px-2 font-normal">
                                    Total
                                  </th>
                                  <th className="text-right py-1 px-2 font-normal">
                                    General
                                  </th>
                                  <th className="text-right py-1 pl-2 font-normal">
                                    Ladies
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {t.classes.map((c) => (
                                  <tr
                                    key={c.code}
                                    className="border-t border-slate-100 dark:border-slate-800"
                                  >
                                    <td className="py-1.5 pr-2">
                                      <span
                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${classColor(c.code)}`}
                                      >
                                        {c.code}
                                      </span>{" "}
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        {c.label}
                                      </span>
                                    </td>
                                    <td className="text-right py-1.5 px-2 font-bold text-slate-800 dark:text-slate-100">
                                      {c.estimatedFare > 0 ? `₹${c.estimatedFare}` : "—"}
                                    </td>
                                    <td className="text-right py-1.5 px-2 text-amber-600 dark:text-amber-400">
                                      {c.tatkalFare > 0 ? `₹${c.tatkalFare}` : "—"}
                                    </td>
                                    <td className="text-right py-1.5 px-2 text-slate-600 dark:text-slate-300">
                                      {c.totalSeats || "—"}
                                    </td>
                                    <td className="text-right py-1.5 px-2 text-slate-600 dark:text-slate-300">
                                      {c.generalQuota || "—"}
                                    </td>
                                    <td className="text-right py-1.5 pl-2 text-slate-600 dark:text-slate-300">
                                      {c.ladiesQuota || "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                            Fares are approximate IR tariffs — dynamic pricing
                            on Rajdhani/Shatabdi/Vande Bharat may differ. For
                            live seat availability and actual fare, check IRCTC.
                          </p>
                        </div>
                      )}
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
          <div className="text-5xl mb-3">🛤️</div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Find Trains Between Stations
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Select source and destination stations to see all trains running
            on that route, with departure times, duration, and days of operation.
          </p>
        </div>
      )}
    </div>
  );
}
