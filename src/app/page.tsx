"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { TrainMapHandle } from "@/components/TrainMap";
import LiveStatus from "@/components/LiveStatus";
import PnrStatus from "@/components/PnrStatus";
import StationSearch from "@/components/StationSearch";
import ThemeToggle from "@/components/ThemeToggle";
import ExportButton from "@/components/ExportButton";

// Dynamically import map to avoid SSR issues with Leaflet
const TrainMap = dynamic(() => import("@/components/TrainMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl">
      <div className="text-slate-400 dark:text-slate-500">Loading map...</div>
    </div>
  ),
});

type TabType = "route" | "live" | "pnr" | "station";

interface Station {
  serialNo: number;
  stationName: string;
  stationCode: string;
  arrival: string;
  departure: string;
  day: number;
  distance: string;
  lat: number | null;
  lng: number | null;
  state: string | null;
}

interface TrainData {
  trainNo: string;
  trainName: string;
  stations: Station[];
  states: string[];
  error?: string;
}

const STATE_COLORS: Record<string, string> = {
  Karnataka: "#e74c3c",
  "Tamil Nadu": "#3498db",
  "Andhra Pradesh": "#2ecc71",
  Telangana: "#f39c12",
  Maharashtra: "#9b59b6",
  "Madhya Pradesh": "#1abc9c",
  "Uttar Pradesh": "#e67e22",
  Bihar: "#2980b9",
  "West Bengal": "#d35400",
  Jharkhand: "#27ae60",
  Odisha: "#8e44ad",
  Rajasthan: "#c0392b",
  Gujarat: "#16a085",
  Punjab: "#f1c40f",
  Haryana: "#7f8c8d",
  Kerala: "#2c3e50",
  Goa: "#d63384",
  Chhattisgarh: "#fd7e14",
  Delhi: "#6610f2",
  Assam: "#20c997",
  Uttarakhand: "#0dcaf0",
  "Jammu & Kashmir": "#6f42c1",
  "Himachal Pradesh": "#198754",
  Puducherry: "#dc3545",
  Tripura: "#adb5bd",
};

// Parse distance string like "484.00 km" to number
function parseDistance(str: string): number {
  const match = str.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

// Parse time string "HH:MM" to minutes since midnight
function parseTime(str: string): number | null {
  const match = str.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  return parseInt(match[1]) * 60 + parseInt(match[2]);
}

// Format minutes as "Xh Ym"
function formatDuration(minutes: number): string {
  if (minutes < 0) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

const SAMPLE_TRAINS = [
  { no: "12301", name: "Howrah Rajdhani" },
  { no: "12951", name: "Mumbai Rajdhani" },
  { no: "12259", name: "Duronto Express" },
  { no: "12627", name: "Karnataka Express" },
  { no: "12839", name: "Chennai Mail" },
  { no: "03252", name: "SMVB DNR SPL" },
];

export default function Home() {
  const [trainNo, setTrainNo] = useState("");
  const [trainData, setTrainData] = useState<TrainData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStation, setActiveStation] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("route");
  const [compareMode, setCompareMode] = useState(false);
  const [compareFrom, setCompareFrom] = useState<number | null>(null);
  const [compareTo, setCompareTo] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<TrainMapHandle>(null);
  const routeContentRef = useRef<HTMLDivElement>(null);

  const fetchTrain = useCallback(async (number: string) => {
    const cleaned = number.trim().replace(/\s+/g, "-");
    if (!cleaned) return;

    setLoading(true);
    setError(null);
    setTrainData(null);
    setActiveStation(null);
    setActiveTab("route");
    setCompareMode(false);
    setCompareFrom(null);
    setCompareTo(null);

    try {
      const res = await fetch(`/api/train/${encodeURIComponent(cleaned)}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setTrainData(data);
      }
    } catch {
      setError("Failed to fetch train data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrain(trainNo);
  };

  const handleSampleClick = (no: string) => {
    setTrainNo(no);
    fetchTrain(no);
  };

  const handleStationClick = (station: Station, idx: number) => {
    if (compareMode) {
      // In compare mode, select as from/to
      if (compareFrom === null) {
        setCompareFrom(idx);
      } else if (compareTo === null && idx !== compareFrom) {
        setCompareTo(idx);
      } else {
        // Reset and pick new from
        setCompareFrom(idx);
        setCompareTo(null);
      }
      return;
    }
    if (!station.lat || !station.lng) return;
    setActiveStation(idx);
    mapRef.current?.flyToStation(station.stationCode, idx);
  };

  const toggleCompareMode = () => {
    setCompareMode((prev) => !prev);
    setCompareFrom(null);
    setCompareTo(null);
    setActiveStation(null);
  };

  const clearCompare = () => {
    setCompareFrom(null);
    setCompareTo(null);
  };

  const mappedStations =
    trainData?.stations.filter((s) => s.lat && s.lng).length || 0;
  const totalStations = trainData?.stations.length || 0;
  const totalDistance =
    trainData?.stations[trainData.stations.length - 1]?.distance || "";

  // Compute comparison data when both from and to are selected
  const comparison = (() => {
    if (!trainData || compareFrom === null || compareTo === null) return null;
    // Ensure from is before to (earlier in journey)
    const fromIdx = Math.min(compareFrom, compareTo);
    const toIdx = Math.max(compareFrom, compareTo);
    const from = trainData.stations[fromIdx];
    const to = trainData.stations[toIdx];
    if (!from || !to) return null;

    const fromDist = parseDistance(from.distance);
    const toDist = parseDistance(to.distance);
    const distance = toDist - fromDist;

    // Travel time: from departure -> to arrival.
    // The day field from the source can be unreliable, so we don't rely on it.
    // Instead we unwrap the clock time difference and use distance as a sanity
    // check: pick the day offset that keeps the implied speed in a sane range
    // (30–120 km/h for Indian trains, with 80 km/h as the ideal).
    const fromDepMins = parseTime(from.departure);
    const toArrMins = parseTime(to.arrival);
    let travelMinutes: number | null = null;
    if (fromDepMins !== null && toArrMins !== null) {
      let base = toArrMins - fromDepMins;
      if (base < 0) base += 24 * 60; // wrap to next day
      // Try adding 0, 1, 2, ... day offsets and pick whichever gives speed closest to 80 km/h
      let bestOffset = 0;
      let bestScore = Infinity;
      const maxDays = 7;
      for (let d = 0; d <= maxDays; d++) {
        const candidate = base + d * 24 * 60;
        if (candidate === 0) continue;
        const speed = (distance / candidate) * 60; // km/h
        // Penalize speeds outside 30-120 km/h range
        const score = Math.abs(Math.log(speed / 80));
        if (score < bestScore) {
          bestScore = score;
          bestOffset = d;
        }
      }
      travelMinutes = base + bestOffset * 24 * 60;
    }

    return {
      from,
      to,
      fromIdx,
      toIdx,
      distance,
      travelMinutes,
      stopCount: toIdx - fromIdx,
    };
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🚂</div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Train Route Visualizer
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualize Indian train routes on a map
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === "station" ? "route" : "station")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "station"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline">Station</span>
            </button>
            <button
              onClick={() => setActiveTab(activeTab === "pnr" ? "route" : "pnr")}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "pnr"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <span className="hidden sm:inline">PNR</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* PNR Status Mode */}
        {activeTab === "pnr" && (
          <PnrStatus
            onViewTrain={(trainNoFromPnr, tab) => {
              setTrainNo(trainNoFromPnr);
              setActiveTab(tab);
              fetchTrain(trainNoFromPnr);
            }}
          />
        )}

        {/* Station Search Mode */}
        {activeTab === "station" && (
          <StationSearch
            onViewTrain={(trainNoFromStation, tab) => {
              setTrainNo(trainNoFromStation);
              setActiveTab(tab);
              fetchTrain(trainNoFromStation);
            }}
          />
        )}

        {/* Train Route Mode */}
        {activeTab !== "pnr" && activeTab !== "station" && (
        <>
        {/* Search Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={trainNo}
              onChange={(e) => setTrainNo(e.target.value)}
              placeholder="Enter train number (e.g., 12301) or number-name (e.g., 03252-SMVB-DNR-SPL)"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !trainNo.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Searching...
                </span>
              ) : (
                "Search"
              )}
            </button>
          </form>

          {/* Sample trains */}
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500 py-1">Try:</span>
            {SAMPLE_TRAINS.map((t) => (
              <button
                key={t.no}
                onClick={() => handleSampleClick(t.no)}
                className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                {t.no} {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4 mb-6 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        {trainData && (
          <div className="flex gap-1 mb-6 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-1 w-fit">
            <button
              onClick={() => setActiveTab("route")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "route"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Route Map
            </button>
            <button
              onClick={() => setActiveTab("live")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "live"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Live Status
              <span className={`w-2 h-2 rounded-full ${activeTab === "live" ? "bg-green-300" : "bg-green-500"} animate-pulse`} />
            </button>
          </div>
        )}

        {/* Route Map Tab */}
        {trainData && activeTab === "route" && (
          <div ref={routeContentRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map - takes 2/3 on desktop */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                {/* Train info bar */}
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {trainData.trainName}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Train #{trainData.trainNo} &middot; {totalStations} stops
                      &middot; {totalDistance}
                      {mappedStations < totalStations && (
                        <span className="text-amber-600 dark:text-amber-400 ml-1">
                          ({mappedStations}/{totalStations} mapped)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="hidden sm:flex gap-2">
                      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                        Start
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                        End
                      </span>
                    </div>
                    <ExportButton
                      targetRef={routeContentRef}
                      filename={`train-${trainData.trainNo}-route`}
                    />
                  </div>
                </div>
                <div className="h-[500px] lg:h-[600px]">
                  <TrainMap
                    ref={mapRef}
                    stations={trainData.stations}
                    trainName={trainData.trainName}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* States Summary */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  States Traversed ({trainData.states.length})
                </h3>
                <div className="space-y-2">
                  {trainData.states.map((state, idx) => {
                    const stationsInState = trainData.stations.filter(
                      (s) => s.state === state
                    );
                    return (
                      <div
                        key={state}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor:
                                STATE_COLORS[state] || "#95a5a6",
                            }}
                          />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {idx + 1}. {state}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {stationsInState.length} stop
                          {stationsInState.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Journey summary */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    This train travels through{" "}
                    <strong>{trainData.states.length} states</strong> covering{" "}
                    <strong>{totalDistance}</strong> with{" "}
                    <strong>{totalStations} stops</strong>, starting from{" "}
                    <strong>{trainData.stations[0]?.stationName}</strong> (
                    {trainData.stations[0]?.state}) to{" "}
                    <strong>
                      {trainData.stations[totalStations - 1]?.stationName}
                    </strong>{" "}
                    ({trainData.stations[totalStations - 1]?.state}).
                  </p>
                </div>
              </div>

              {/* Station List */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                    All Stops
                  </h3>
                  <button
                    onClick={toggleCompareMode}
                    className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-md font-medium transition-colors ${
                      compareMode
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Compare
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">
                  {compareMode
                    ? compareFrom === null
                      ? "Click a stop to select From"
                      : compareTo === null
                      ? "Click another stop to select To"
                      : "Click any stop to start a new comparison"
                    : "Click a stop to highlight it on the map"}
                </p>

                {/* Comparison Result Card */}
                {compareMode && comparison && (
                  <div className="mb-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-700 dark:text-blue-400">
                        Comparison
                      </span>
                      <button
                        onClick={clearCompare}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-100 truncate flex-1">
                        {comparison.from.stationName}
                      </span>
                      <svg className="w-3 h-3 text-slate-400 dark:text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 truncate flex-1 text-right">
                        {comparison.to.stationName}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-2">
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Distance</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {comparison.distance > 0 ? `${comparison.distance.toFixed(0)} km` : "—"}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-2">
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Travel Time</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {comparison.travelMinutes !== null ? formatDuration(comparison.travelMinutes) : "—"}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-lg p-2">
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Stops</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {comparison.stopCount}
                        </div>
                      </div>
                    </div>
                    {comparison.travelMinutes !== null && comparison.distance > 0 && (
                      <div className="mt-2 text-[10px] text-center text-slate-500 dark:text-slate-400">
                        Avg speed:{" "}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {((comparison.distance / comparison.travelMinutes) * 60).toFixed(0)} km/h
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="max-h-[400px] overflow-y-auto space-y-1 pr-1">
                  {trainData.stations.map((station, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === trainData.stations.length - 1;
                    const prevStation =
                      idx > 0 ? trainData.stations[idx - 1] : null;
                    const showStateDivider =
                      prevStation && prevStation.state !== station.state;
                    const isActive = activeStation === idx;
                    const hasCoords = station.lat !== null && station.lng !== null;
                    const isCompareFrom = compareFrom === idx;
                    const isCompareTo = compareTo === idx;
                    const isInRange =
                      compareFrom !== null &&
                      compareTo !== null &&
                      idx > Math.min(compareFrom, compareTo) &&
                      idx < Math.max(compareFrom, compareTo);

                    return (
                      <div key={`${station.stationCode}-${idx}`}>
                        {showStateDivider && station.state && (
                          <div className="flex items-center gap-2 py-1.5 px-2">
                            <div
                              className="h-px flex-1"
                              style={{
                                backgroundColor:
                                  STATE_COLORS[station.state] || "#e2e8f0",
                              }}
                            />
                            <span
                              className="text-[10px] font-semibold uppercase tracking-wider"
                              style={{
                                color:
                                  STATE_COLORS[station.state] || "#94a3b8",
                              }}
                            >
                              {station.state}
                            </span>
                            <div
                              className="h-px flex-1"
                              style={{
                                backgroundColor:
                                  STATE_COLORS[station.state] || "#e2e8f0",
                              }}
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStationClick(station, idx)}
                          disabled={!compareMode && !hasCoords}
                          className={`w-full text-left flex items-center gap-3 py-2 px-2 rounded-lg text-sm transition-all ${
                            isCompareFrom || isCompareTo
                              ? "bg-blue-100 dark:bg-blue-900/60 ring-2 ring-blue-500 dark:ring-blue-600 font-semibold"
                              : isInRange
                              ? "bg-blue-50/50 dark:bg-blue-950/20"
                              : isActive
                              ? "bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-200 dark:ring-blue-800"
                              : isFirst || isLast
                              ? "bg-slate-50 dark:bg-slate-800/50 font-medium"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          } ${compareMode || hasCoords ? "cursor-pointer" : "cursor-default opacity-60"}`}
                        >
                          {/* Timeline dot */}
                          <div className="relative flex flex-col items-center">
                            <div
                              className={`w-2.5 h-2.5 rounded-full transition-transform ${
                                isActive ? "scale-150 ring-2 ring-blue-300 dark:ring-blue-700" : ""
                              } ${
                                isFirst
                                  ? "bg-green-500"
                                  : isLast
                                  ? "bg-red-500"
                                  : isActive
                                  ? "bg-blue-500"
                                  : "bg-slate-300 dark:bg-slate-600"
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`truncate ${
                                  isCompareFrom || isCompareTo
                                    ? "text-blue-800 dark:text-blue-200 font-semibold"
                                    : isActive
                                    ? "text-blue-700 dark:text-blue-300 font-medium"
                                    : "text-slate-800 dark:text-slate-200"
                                }`}
                              >
                                {station.stationName}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                {station.stationCode}
                              </span>
                              {isCompareFrom && (
                                <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">
                                  FROM
                                </span>
                              )}
                              {isCompareTo && (
                                <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">
                                  TO
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500">
                              {station.arrival && `Arr: ${station.arrival}`}
                              {station.arrival && station.departure && " · "}
                              {station.departure &&
                                `Dep: ${station.departure}`}
                              {station.distance && ` · ${station.distance}`}
                            </div>
                          </div>
                          {hasCoords ? (
                            <svg
                              className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
                                isActive ? "text-blue-400" : "text-slate-300 dark:text-slate-600"
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          ) : (
                            <span
                              className="text-[10px] text-amber-500"
                              title="Coordinates not available"
                            >
                              ?
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Status Tab */}
        {trainData && activeTab === "live" && (
          <div className="max-w-3xl mx-auto">
            <LiveStatus
              trainNo={trainData.trainNo}
              trainName={trainData.trainName}
            />
          </div>
        )}

        {/* Empty state */}
        {!trainData && !loading && !error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Visualize Any Indian Train Route
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Enter a train number above to see its route plotted on a map.
              You&apos;ll see every stop, the states it passes through, and the
              complete journey at a glance.
            </p>
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
}
