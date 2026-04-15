"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { stationCoordinates } from "@/data/stations";

interface ClassInfo {
  code: string;
  label: string;
  estimatedFare: number;
  tatkalFare: number;
  totalSeats: number;
}

interface ConnectingFareSummary {
  classCode: string;
  label: string;
  total: number;
}

interface JourneyLeg {
  trainNo: string;
  trainName: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  durationMinutes: number;
  distance: string;
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
  classes: ClassInfo[];
}

interface ConnectingJourney {
  via: string;
  viaName: string;
  legs: [JourneyLeg, JourneyLeg];
  layoverMinutes: number;
  totalMinutes: number;
  totalHours: string;
  combinedFares: ConnectingFareSummary[];
}

interface JourneyData {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  directTrains: JourneyLeg[];
  connectingJourneys: ConnectingJourney[];
  checkedHubs: string[];
  error?: string;
}

interface JourneyPlannerProps {
  onViewTrain?: (trainNo: string, tab: "route" | "live") => void;
}

const POPULAR_ROUTES: Array<{ from: string; to: string; label: string }> = [
  { from: "SBC", to: "NDLS", label: "Bengaluru → Delhi" },
  { from: "MAS", to: "NDLS", label: "Chennai → Delhi" },
  { from: "CSMT", to: "HWH", label: "Mumbai → Kolkata" },
  { from: "SBC", to: "GHY", label: "Bengaluru → Guwahati" },
  { from: "TVC", to: "NDLS", label: "Trivandrum → Delhi" },
];

function formatDuration(minutes: number): string {
  if (minutes < 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

interface StationPickerProps {
  label: string;
  value: string;
  onChange: (code: string, name: string) => void;
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

export default function JourneyPlanner({ onViewTrain }: JourneyPlannerProps) {
  const [fromCode, setFromCode] = useState("");
  const [fromName, setFromName] = useState("");
  const [toCode, setToCode] = useState("");
  const [toName, setToName] = useState("");
  const [data, setData] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJourney = async (src: string, dst: string) => {
    if (!src || !dst) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(
        `/api/journey/${encodeURIComponent(src)}/${encodeURIComponent(dst)}`
      );
      const json = await res.json();
      if (json.error && !json.directTrains) {
        setError(json.error);
      } else {
        setData(json);
      }
    } catch {
      setError("Failed to fetch journey options. Please try again.");
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
    fetchJourney(fromCode, toCode);
  };

  const handleSwap = () => {
    const oldFrom = fromCode;
    const oldFromName = fromName;
    setFromCode(toCode);
    setFromName(toName);
    setToCode(oldFrom);
    setToName(oldFromName);
    if (toCode && oldFrom) {
      fetchJourney(toCode, oldFrom);
    }
  };

  const pickRoute = (from: string, to: string) => {
    setFromCode(from);
    setFromName(stationCoordinates[from]?.name || from);
    setToCode(to);
    setToName(stationCoordinates[to]?.name || to);
    fetchJourney(from, to);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Search Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Journey Planner
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Find direct and multi-leg journey options between any two stations
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
              placeholder="e.g., New Delhi"
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
                Planning journey (checking 10+ hubs)...
              </>
            ) : (
              "Plan Journey"
            )}
          </button>
        </form>

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

      {/* Loading info */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 text-center">
          <div className="inline-flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Finding the best routes...
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Checking direct trains and connecting hubs across India
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {data && !loading && (
        <>
          {/* Direct trains section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Direct Trains
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {data.directTrains.length} train
                  {data.directTrains.length !== 1 ? "s" : ""} between{" "}
                  {data.fromName} and {data.toName}
                </p>
              </div>
            </div>

            {data.directTrains.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                No direct trains found. Check connecting options below.
              </p>
            ) : (
              <div className="space-y-2">
                {data.directTrains.slice(0, 5).map((t) => (
                  <div
                    key={t.trainNo}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center w-14 flex-shrink-0">
                        <div className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                          {t.departureTime}
                        </div>
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">
                          {t.from}
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {formatDuration(t.durationMinutes)}
                        </div>
                        <div className="relative w-full h-px bg-slate-300 dark:bg-slate-700 my-1">
                          <div className="absolute -top-1 left-0 w-2 h-2 rounded-full bg-green-500" />
                          <div className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-red-500" />
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                          {t.distance}
                        </div>
                      </div>
                      <div className="text-center w-14 flex-shrink-0">
                        <div className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                          {t.arrivalTime}
                        </div>
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">
                          {t.to}
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2 min-w-0">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
                          {t.trainName}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          #{t.trainNo}
                        </div>
                      </div>
                      {onViewTrain && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => onViewTrain(t.trainNo, "route")}
                            className="px-2 py-1 text-[10px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                          >
                            Route
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Fare row */}
                    {t.classes && t.classes.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/50 flex flex-wrap gap-2">
                        {t.classes
                          .filter((c) => c.estimatedFare > 0)
                          .map((c) => (
                            <span
                              key={c.code}
                              className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                              title={c.label}
                            >
                              <span className="font-bold text-slate-600 dark:text-slate-300">
                                {c.code}
                              </span>{" "}
                              <span className="text-slate-800 dark:text-slate-100 font-semibold">
                                ₹{c.estimatedFare}
                              </span>
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Connecting journeys section */}
          {data.connectingJourneys.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
              <div className="mb-4">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Connecting Journeys
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {data.connectingJourneys.length} multi-leg option
                  {data.connectingJourneys.length !== 1 ? "s" : ""} with 1 train
                  change
                </p>
              </div>

              <div className="space-y-3">
                {data.connectingJourneys.map((j, idx) => (
                  <div
                    key={`${j.legs[0].trainNo}-${j.legs[1].trainNo}-${idx}`}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        via{" "}
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {j.viaName}
                        </span>{" "}
                        <span className="text-slate-400 dark:text-slate-500 font-mono">
                          {j.via}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 dark:text-slate-500">Total: </span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {j.totalHours}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 dark:text-slate-500">Layover: </span>
                          <span className="font-medium text-amber-600 dark:text-amber-400">
                            {formatDuration(j.layoverMinutes)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Legs */}
                    <div className="space-y-2">
                      {j.legs.map((leg, i) => (
                        <div key={i}>
                          <div className="flex items-center gap-3">
                            <div className="text-center w-14 flex-shrink-0">
                              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                {leg.departureTime}
                              </div>
                              <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">
                                {leg.from}
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col items-center">
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                {formatDuration(leg.durationMinutes)}
                              </div>
                              <div className="relative w-full h-px bg-slate-300 dark:bg-slate-700 my-1">
                                <div className="absolute -top-1 left-0 w-1.5 h-1.5 rounded-full bg-green-500" />
                                <div className="absolute -top-1 right-0 w-1.5 h-1.5 rounded-full bg-red-500" />
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                {leg.distance}
                              </div>
                            </div>
                            <div className="text-center w-14 flex-shrink-0">
                              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                {leg.arrivalTime}
                              </div>
                              <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase">
                                {leg.to}
                              </div>
                            </div>
                            <div className="flex-shrink-0 min-w-0 max-w-[180px]">
                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {leg.trainName}
                              </div>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                #{leg.trainNo}
                              </div>
                            </div>
                            {onViewTrain && (
                              <div className="flex gap-1 flex-shrink-0">
                                <button
                                  onClick={() => onViewTrain(leg.trainNo, "route")}
                                  className="px-2 py-0.5 text-[10px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                >
                                  Route
                                </button>
                              </div>
                            )}
                          </div>
                          {/* Layover indicator between legs */}
                          {i === 0 && (
                            <div className="flex items-center gap-2 mt-2 mb-2 pl-6">
                              <div className="flex-shrink-0 w-8 flex justify-center">
                                <svg
                                  className="w-4 h-4 text-amber-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                Wait {formatDuration(j.layoverMinutes)} at{" "}
                                {j.viaName}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Combined fares */}
                    {j.combinedFares && j.combinedFares.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold mb-1.5">
                          Approx. total fare (both legs)
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {j.combinedFares.map((f) => (
                            <span
                              key={f.classCode}
                              className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                              title={f.label}
                            >
                              <span className="font-bold text-slate-600 dark:text-slate-300">
                                {f.classCode}
                              </span>{" "}
                              <span className="text-slate-800 dark:text-slate-100 font-semibold">
                                ₹{f.total}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!data && !loading && !error && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🗺️</div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Plan Your Journey
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Select source and destination to see direct trains and
            connecting journey options via major junction hubs across India.
          </p>
        </div>
      )}
    </div>
  );
}
