"use client";

import { useState, useRef } from "react";

interface PassengerStatus {
  number: number;
  bookingStatus: string;
  currentStatus: string;
  coach: string;
  berth: string;
  berthType: string;
  confirmed: boolean;
}

interface PnrData {
  pnr: string;
  trainNo: string;
  trainName: string;
  doj: string;
  bookingDate: string;
  from: string;
  fromName: string;
  to: string;
  toName: string;
  boardingPoint: string;
  boardingPointName: string;
  reservationUpto: string;
  reservationUptoName: string;
  travelClass: string;
  quota: string;
  chartPrepared: boolean;
  trainCancelled: boolean;
  departureTime: string;
  arrivalTime: string;
  expectedPlatform: string;
  passengers: PassengerStatus[];
  bookingFare: string;
  duration: string;
  error?: string;
}

function getStatusColor(status: string, confirmed: boolean): string {
  if (confirmed) return "text-green-700";
  const upper = status.toUpperCase();
  if (upper.startsWith("RAC")) return "text-amber-600";
  if (upper.startsWith("WL") || upper.startsWith("RLWL") || upper.startsWith("GNWL") || upper.startsWith("PQWL"))
    return "text-red-600";
  if (upper.startsWith("CAN")) return "text-slate-500 dark:text-slate-400";
  return "text-slate-700 dark:text-slate-300";
}

function getStatusBg(status: string, confirmed: boolean): string {
  if (confirmed) return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900";
  const upper = status.toUpperCase();
  if (upper.startsWith("RAC")) return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900";
  if (upper.startsWith("WL") || upper.startsWith("RLWL") || upper.startsWith("GNWL") || upper.startsWith("PQWL"))
    return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900";
  return "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700";
}

interface PnrStatusProps {
  onViewTrain?: (trainNo: string, tab: "route" | "live") => void;
}

function getStatusLabel(confirmed: boolean, status: string): { text: string; color: string } {
  if (confirmed) return { text: "CONFIRMED", color: "bg-green-500" };
  const upper = status.toUpperCase();
  if (upper.startsWith("RAC")) return { text: "RAC", color: "bg-amber-500" };
  if (upper.startsWith("WL") || upper.includes("WL"))
    return { text: "WAITLIST", color: "bg-red-500" };
  if (upper.startsWith("CAN")) return { text: "CANCELLED", color: "bg-slate-500" };
  return { text: "PENDING", color: "bg-slate-400" };
}

export default function PnrStatus({ onViewTrain }: PnrStatusProps) {
  const [pnrNo, setPnrNo] = useState("");
  const [data, setData] = useState<PnrData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchPnr = async () => {
    const cleaned = pnrNo.replace(/\s/g, "");
    if (!cleaned) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/pnr/${cleaned}`);
      const json = await res.json();

      if (json.error) {
        setError(json.error);
      } else {
        setData(json);
      }
    } catch {
      setError("Failed to fetch PNR status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPnr();
  };

  const allConfirmed = data?.passengers.every((p) => p.confirmed) || false;
  const hasWaitlist = data?.passengers.some((p) => {
    const u = p.currentStatus.toUpperCase();
    return u.startsWith("WL") || u.includes("WL");
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* PNR Input */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          PNR Status Check
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Enter your 10-digit PNR number to check booking status</p>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={pnrNo}
            onChange={(e) => {
              // Only allow digits, max 10
              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
              setPnrNo(val);
            }}
            placeholder="Enter 10-digit PNR number"
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all font-mono text-lg tracking-wider"
            maxLength={10}
            inputMode="numeric"
          />
          <button
            type="submit"
            disabled={loading || pnrNo.length !== 10}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              "Check"
            )}
          </button>
        </form>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
          {pnrNo.length > 0 && pnrNo.length < 10
            ? `${10 - pnrNo.length} more digits needed`
            : "PNR can be found on your ticket or IRCTC booking confirmation"}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Checking PNR status...</p>
          </div>
        </div>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Overall Status Banner */}
          <div
            className={`rounded-2xl p-5 border ${
              data.trainCancelled
                ? "bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-900"
                : allConfirmed
                ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-900"
                : hasWaitlist
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900"
                : "bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  PNR #{data.pnr}
                </div>
                <div
                  className={`text-xl font-bold ${
                    data.trainCancelled
                      ? "text-red-700 dark:text-red-400"
                      : allConfirmed
                      ? "text-green-700 dark:text-green-400"
                      : hasWaitlist
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-blue-700 dark:text-blue-400"
                  }`}
                >
                  {data.trainCancelled
                    ? "Train Cancelled"
                    : allConfirmed
                    ? "All Passengers Confirmed"
                    : hasWaitlist
                    ? "Waitlisted"
                    : "Booking Status"}
                </div>
              </div>
              <div
                className={`text-3xl ${
                  data.trainCancelled
                    ? ""
                    : allConfirmed
                    ? ""
                    : hasWaitlist
                    ? ""
                    : ""
                }`}
              >
                {data.trainCancelled ? "❌" : allConfirmed ? "✅" : hasWaitlist ? "⏳" : "🎫"}
              </div>
            </div>
            {data.chartPrepared && (
              <div className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 rounded-lg px-2 py-1 w-fit">
                Chart Prepared
              </div>
            )}
          </div>

          {/* Train Details */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Journey Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Train + Actions */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Train</div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {data.trainName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">#{data.trainNo}</div>
                  </div>
                  {onViewTrain && data.trainNo && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewTrain(data.trainNo, "route")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        View Route
                      </button>
                      <button
                        onClick={() => onViewTrain(data.trainNo, "live")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/40 hover:text-green-700 dark:hover:text-green-300 hover:border-green-200 dark:hover:border-green-800 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Live Status
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Date */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 sm:col-span-2">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Date of Journey</div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{data.doj || "—"}</div>
                {data.bookingDate && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">Booked: {data.bookingDate}</div>
                )}
              </div>

              {/* Route */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 sm:col-span-2">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-2">Route</div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{data.boardingPointName || data.fromName}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{data.boardingPoint || data.from}</div>
                    {data.departureTime && (
                      <div className="text-xs text-slate-500 mt-0.5">{data.departureTime}</div>
                    )}
                  </div>
                  <div className="flex-1 flex items-center gap-1">
                    <div className="h-px flex-1 bg-slate-300 dark:bg-slate-600" />
                    <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <div className="h-px flex-1 bg-slate-300 dark:bg-slate-600" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{data.reservationUptoName || data.toName}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{data.reservationUpto || data.to}</div>
                    {data.arrivalTime && (
                      <div className="text-xs text-slate-500 mt-0.5">{data.arrivalTime}</div>
                    )}
                  </div>
                </div>
                {data.duration && (
                  <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                    Duration: {data.duration}
                  </div>
                )}
              </div>

              {/* Class & Quota */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Class</div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{data.travelClass || "—"}</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <div className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">Quota</div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{data.quota || "—"}</div>
              </div>

              {/* Fare & Platform */}
              {data.bookingFare && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider">Fare</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Rs. {data.bookingFare}</div>
                </div>
              )}

              {data.expectedPlatform && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider">Platform</div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{data.expectedPlatform}</div>
                </div>
              )}
            </div>
          </div>

          {/* Passenger Status */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Passenger Status ({data.passengers.length})
            </h3>

            <div className="space-y-3">
              {data.passengers.map((p) => {
                const label = getStatusLabel(p.confirmed, p.currentStatus);
                return (
                  <div
                    key={p.number}
                    className={`rounded-xl p-4 border ${getStatusBg(p.currentStatus, p.confirmed)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
                          {p.number}
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Passenger {p.number}</span>
                      </div>
                      <span className={`text-[11px] font-bold text-white px-2 py-0.5 rounded-full ${label.color}`}>
                        {label.text}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 text-xs">Booking Status</span>
                        <div className="font-mono font-medium text-slate-600 dark:text-slate-300">{p.bookingStatus || "—"}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-slate-500 text-xs">Current Status</span>
                        <div className={`font-mono font-bold ${getStatusColor(p.currentStatus, p.confirmed)}`}>
                          {p.currentStatus || "—"}
                        </div>
                      </div>
                      {p.confirmed && p.coach && (
                        <>
                          <div>
                            <span className="text-slate-400 dark:text-slate-500 text-xs">Coach / Berth</span>
                            <div className="font-mono font-medium text-slate-800">
                              {p.coach} / {p.berth}
                            </div>
                          </div>
                          {p.berthType && (
                            <div>
                              <span className="text-slate-400 dark:text-slate-500 text-xs">Berth Type</span>
                              <div className="font-medium text-slate-800 dark:text-slate-100">
                                {p.berthType === "SU"
                                  ? "Side Upper"
                                  : p.berthType === "SL"
                                  ? "Side Lower"
                                  : p.berthType === "UB"
                                  ? "Upper Berth"
                                  : p.berthType === "MB"
                                  ? "Middle Berth"
                                  : p.berthType === "LB"
                                  ? "Lower Berth"
                                  : p.berthType}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!data && !loading && !error && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">🎫</div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">Check Your PNR Status</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Enter your 10-digit PNR number to check if your ticket is confirmed,
            waitlisted, or RAC. You can find the PNR on your ticket or IRCTC booking email.
          </p>
        </div>
      )}
    </div>
  );
}
