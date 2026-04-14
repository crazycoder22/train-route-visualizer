"use client";

import { useState, useCallback } from "react";

interface LiveStationStatus {
  serialNo: number;
  stationName: string;
  stationCode: string;
  scheduledArrival: string;
  scheduledDeparture: string;
  actualArrival: string;
  actualDeparture: string;
  delayMinutes: number | null;
  platform: string;
  day: number;
  distance: string;
  haltMinutes: string;
  status: "departed" | "arrived" | "current" | "upcoming" | "not-available";
  statusText: string;
}

interface LiveStatusData {
  trainNo: string;
  trainName: string;
  currentStation: string;
  currentStatus: string;
  lastUpdated: string;
  overallDelay: string;
  stations: LiveStationStatus[];
  error?: string;
}

interface LiveStatusProps {
  trainNo: string;
  trainName: string;
}

function getDelayColor(minutes: number | null): string {
  if (minutes === null) return "text-slate-400";
  if (minutes === 0) return "text-green-600";
  if (minutes <= 5) return "text-green-500";
  if (minutes <= 15) return "text-amber-500";
  if (minutes <= 30) return "text-orange-500";
  return "text-red-600";
}

function getDelayBg(minutes: number | null): string {
  if (minutes === null) return "bg-slate-50";
  if (minutes === 0) return "bg-green-50";
  if (minutes <= 5) return "bg-green-50";
  if (minutes <= 15) return "bg-amber-50";
  if (minutes <= 30) return "bg-orange-50";
  return "bg-red-50";
}

function getStatusIcon(status: LiveStationStatus["status"]): string {
  switch (status) {
    case "departed":
      return "departed";
    case "arrived":
    case "current":
      return "current";
    case "upcoming":
      return "upcoming";
    default:
      return "upcoming";
  }
}

function formatDelay(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes === 0) return "On Time";
  if (minutes > 0) return `${minutes} min late`;
  return `${Math.abs(minutes)} min early`;
}

export default function LiveStatus({ trainNo, trainName }: LiveStatusProps) {
  const [data, setData] = useState<LiveStatusData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchLiveStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/train/${encodeURIComponent(trainNo)}/live-status`);
      const json = await res.json();

      if (json.error) {
        setError(json.error);
        setData(null);
      } else {
        setData(json);
      }
    } catch {
      setError("Failed to fetch live status. Please try again.");
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [trainNo]);

  // Auto-fetch on first render
  if (!hasLoaded && !loading) {
    fetchLiveStatus();
  }

  const departedCount = data?.stations.filter((s) => s.status === "departed").length || 0;
  const totalCount = data?.stations.length || 0;

  return (
    <div className="space-y-4">
      {/* Status Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-bold text-slate-900 text-lg">{trainName}</h2>
            <p className="text-xs text-slate-500">Train #{trainNo} &middot; Live Running Status</p>
          </div>
          <button
            onClick={fetchLiveStatus}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Current Status */}
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">
                Current Status
              </div>
              <div className="text-sm font-medium text-slate-800">
                {data.currentStatus || "Information not available"}
              </div>
            </div>

            {/* Delay */}
            <div
              className={`rounded-xl p-3 ${
                data.overallDelay === "On Time"
                  ? "bg-green-50"
                  : data.overallDelay.includes("late")
                  ? "bg-red-50"
                  : data.overallDelay.includes("early")
                  ? "bg-blue-50"
                  : "bg-slate-50"
              }`}
            >
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">
                Delay
              </div>
              <div
                className={`text-sm font-bold ${
                  data.overallDelay === "On Time"
                    ? "text-green-700"
                    : data.overallDelay.includes("late")
                    ? "text-red-700"
                    : data.overallDelay.includes("early")
                    ? "text-blue-700"
                    : "text-slate-700"
                }`}
              >
                {data.overallDelay || "—"}
              </div>
            </div>

            {/* Progress */}
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">
                Journey Progress
              </div>
              <div className="text-sm font-medium text-slate-800">
                {departedCount}/{totalCount} stations
              </div>
              <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalCount > 0 ? (departedCount / totalCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {data?.lastUpdated && (
          <p className="text-[11px] text-slate-400 mt-3">{data.lastUpdated}</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-slate-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Station Timeline */}
      {data && data.stations.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Station-wise Status
          </h3>

          <div className="space-y-0">
            {data.stations.map((station, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === data.stations.length - 1;
              const isCurrent = station.status === "current";
              const isDeparted = station.status === "departed";
              const iconType = getStatusIcon(station.status);

              return (
                <div key={`${station.stationCode}-${idx}`} className="flex gap-3">
                  {/* Timeline */}
                  <div className="flex flex-col items-center w-8 flex-shrink-0">
                    {/* Connector line top */}
                    {!isFirst && (
                      <div
                        className={`w-0.5 flex-1 ${
                          isDeparted || isCurrent ? "bg-green-400" : "bg-slate-200"
                        }`}
                      />
                    )}
                    {isFirst && <div className="flex-1" />}

                    {/* Station dot */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCurrent
                          ? "bg-blue-500 ring-4 ring-blue-100"
                          : isDeparted
                          ? "bg-green-500"
                          : isFirst
                          ? "bg-slate-300"
                          : "bg-slate-200"
                      }`}
                    >
                      {iconType === "departed" && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {iconType === "current" && (
                        <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                      )}
                      {iconType === "upcoming" && (
                        <div className="w-2 h-2 bg-slate-400 rounded-full" />
                      )}
                    </div>

                    {/* Connector line bottom */}
                    {!isLast && (
                      <div
                        className={`w-0.5 flex-1 ${
                          isDeparted ? "bg-green-400" : "bg-slate-200"
                        }`}
                      />
                    )}
                    {isLast && <div className="flex-1" />}
                  </div>

                  {/* Station Info */}
                  <div
                    className={`flex-1 pb-4 pt-1 ${
                      isCurrent ? "" : ""
                    }`}
                  >
                    <div
                      className={`rounded-xl p-3 ${
                        isCurrent
                          ? "bg-blue-50 border border-blue-200"
                          : isDeparted
                          ? getDelayBg(station.delayMinutes)
                          : "bg-slate-50"
                      }`}
                    >
                      {/* Station name row */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold text-sm ${
                              isCurrent ? "text-blue-800" : "text-slate-800"
                            }`}
                          >
                            {station.stationName}
                          </span>
                          {station.stationCode && (
                            <span className="text-[10px] font-mono text-slate-400">
                              {station.stationCode}
                            </span>
                          )}
                          {isCurrent && (
                            <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                              CURRENT
                            </span>
                          )}
                        </div>
                        {station.platform && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                            PF {station.platform}
                          </span>
                        )}
                      </div>

                      {/* Times grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                        <div>
                          <span className="text-slate-400">Sch Arr: </span>
                          <span className="text-slate-700 font-medium">
                            {station.scheduledArrival || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Sch Dep: </span>
                          <span className="text-slate-700 font-medium">
                            {station.scheduledDeparture || "—"}
                          </span>
                        </div>
                        {(station.actualArrival || isDeparted || isCurrent) && (
                          <div>
                            <span className="text-slate-400">Act Arr: </span>
                            <span
                              className={`font-medium ${
                                station.actualArrival ? getDelayColor(station.delayMinutes) : "text-slate-400"
                              }`}
                            >
                              {station.actualArrival || "—"}
                            </span>
                          </div>
                        )}
                        {(station.actualDeparture || isDeparted) && (
                          <div>
                            <span className="text-slate-400">Act Dep: </span>
                            <span
                              className={`font-medium ${
                                station.actualDeparture ? getDelayColor(station.delayMinutes) : "text-slate-400"
                              }`}
                            >
                              {station.actualDeparture || "—"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Delay badge */}
                      {station.delayMinutes !== null && (isDeparted || isCurrent) && (
                        <div className="mt-1.5">
                          <span
                            className={`text-[11px] font-semibold ${getDelayColor(station.delayMinutes)}`}
                          >
                            {formatDelay(station.delayMinutes)}
                          </span>
                          {station.distance && (
                            <span className="text-[11px] text-slate-400 ml-2">
                              {station.distance}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Upcoming station - just show distance */}
                      {station.status === "upcoming" && station.distance && (
                        <div className="mt-1">
                          <span className="text-[11px] text-slate-400">{station.distance}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
