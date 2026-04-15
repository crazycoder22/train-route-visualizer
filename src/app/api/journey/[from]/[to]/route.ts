import { NextResponse } from "next/server";
import {
  fetchTrainsBetween,
  parseTimeToMinutes,
  parseDurationToMinutes,
  TBSTrain,
  TBSClassInfo,
} from "@/lib/tbs";
import { stationCoordinates } from "@/data/stations";

// Major junction stations used as connecting hubs
const HUB_STATIONS = [
  "NDLS", // New Delhi
  "HWH", // Howrah
  "CSMT", // Mumbai CSMT
  "MAS", // Chennai Central
  "SBC", // Bengaluru
  "SC", // Secunderabad
  "NGP", // Nagpur
  "BPL", // Bhopal
  "BZA", // Vijayawada
  "CNB", // Kanpur
  "ADI", // Ahmedabad
  "JHS", // Jhansi
  "ET", // Itarsi
  "PNBE", // Patna
];

// Minimum layover between trains (minutes)
const MIN_LAYOVER = 30;
// Maximum layover (minutes) — 12 hours
const MAX_LAYOVER = 12 * 60;

export interface JourneyLeg {
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
  daysOfRun: TBSTrain["daysOfRun"];
  classes: TBSClassInfo[];
}

export interface ConnectingFareSummary {
  classCode: string;
  label: string;
  total: number;
}

export interface ConnectingJourney {
  via: string;
  viaName: string;
  legs: [JourneyLeg, JourneyLeg];
  layoverMinutes: number;
  totalMinutes: number;
  totalHours: string; // e.g. "9h 30m"
  // Combined fare per class that exists on BOTH legs (sum)
  combinedFares: ConnectingFareSummary[];
}

export interface JourneyResponse {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  directTrains: JourneyLeg[];
  connectingJourneys: ConnectingJourney[];
  checkedHubs: string[];
  error?: string;
}

function toJourneyLeg(t: TBSTrain): JourneyLeg {
  // Use the duration string from erail (reliable for multi-day journeys)
  // rather than computing from dep/arr clock times.
  const durMin = parseDurationToMinutes(t.duration);
  return {
    trainNo: t.trainNo,
    trainName: t.trainName,
    from: t.from,
    to: t.to,
    departureTime: t.departureTime,
    arrivalTime: t.arrivalTime,
    duration: t.duration,
    durationMinutes: durMin,
    distance: t.distance,
    trainType: t.trainType,
    daysOfRun: t.daysOfRun,
    classes: t.classes,
  };
}

function computeCombinedFares(
  leg1: JourneyLeg,
  leg2: JourneyLeg
): ConnectingFareSummary[] {
  const leg1ByCode = new Map(leg1.classes.map((c) => [c.code, c]));
  const summary: ConnectingFareSummary[] = [];
  for (const c2 of leg2.classes) {
    const c1 = leg1ByCode.get(c2.code);
    if (!c1) continue;
    if (c1.estimatedFare > 0 && c2.estimatedFare > 0) {
      summary.push({
        classCode: c2.code,
        label: c2.label,
        total: c1.estimatedFare + c2.estimatedFare,
      });
    }
  }
  // Sort by a standard class order
  const order = ["1A", "2A", "3A", "3E", "CC", "EC", "SL", "2S", "FC"];
  summary.sort(
    (a, b) => order.indexOf(a.classCode) - order.indexOf(b.classCode)
  );
  return summary;
}

function formatHours(minutes: number): string {
  if (minutes < 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ from: string; to: string }> }
) {
  const { from, to } = await params;
  const fromCode = from.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const toCode = to.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (!fromCode || !toCode) {
    return NextResponse.json(
      { error: "Invalid source or destination code" },
      { status: 400 }
    );
  }
  if (fromCode === toCode) {
    return NextResponse.json(
      { error: "Source and destination cannot be the same" },
      { status: 400 }
    );
  }

  const fromName = stationCoordinates[fromCode]?.name || fromCode;
  const toName = stationCoordinates[toCode]?.name || toCode;

  // Step 1: fetch direct trains
  const directTrainsRaw = await fetchTrainsBetween(fromCode, toCode);
  const directTrains = directTrainsRaw
    .map(toJourneyLeg)
    // Clean up weird train names with HTML entities or embedded validity text
    .map((t) => ({
      ...t,
      trainName: t.trainName
        .replace(/&NBSP;/gi, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s*VALID FROM.*$/i, "")
        .replace(/\s*EX\s+\d.*$/i, "")
        .trim(),
    }));
  directTrains.sort((a, b) => a.durationMinutes - b.durationMinutes);

  // Fastest direct duration, used to filter out useless connecting options
  const fastestDirect = directTrains.length
    ? directTrains[0].durationMinutes
    : Infinity;

  // Step 2: try hub-based connections in parallel
  // Skip hubs that ARE the source or destination
  const hubs = HUB_STATIONS.filter((h) => h !== fromCode && h !== toCode);

  const hubResults = await Promise.all(
    hubs.map(async (hub) => {
      const [leg1, leg2] = await Promise.all([
        fetchTrainsBetween(fromCode, hub),
        fetchTrainsBetween(hub, toCode),
      ]);
      return { hub, leg1, leg2 };
    })
  );

  const connectingJourneys: ConnectingJourney[] = [];

  for (const { hub, leg1, leg2 } of hubResults) {
    if (leg1.length === 0 || leg2.length === 0) continue;

    // For each pair, compute layover and total time.
    // Use the duration strings (which handle multi-day trains correctly)
    // and pair the arrival clock-time with the next available departure
    // clock-time on the same or next day.
    for (const t1 of leg1) {
      const t1DurMin = parseDurationToMinutes(t1.duration);
      const t1ArrMin = parseTimeToMinutes(t1.arrivalTime);
      if (t1DurMin === 0 || t1ArrMin === null) continue;

      for (const t2 of leg2) {
        // Skip: same train as leg 1 (that's not a real connection)
        if (t2.trainNo === t1.trainNo) continue;
        const t2DurMin = parseDurationToMinutes(t2.duration);
        const t2DepMin = parseTimeToMinutes(t2.departureTime);
        if (t2DurMin === 0 || t2DepMin === null) continue;

        // Compute layover as the smallest positive gap from t1 arrival
        // to t2 departure, bounded to [MIN_LAYOVER, MAX_LAYOVER].
        let layover = t2DepMin - t1ArrMin;
        while (layover < MIN_LAYOVER) layover += 24 * 60;
        if (layover > MAX_LAYOVER) continue;

        const totalMinutes = t1DurMin + layover + t2DurMin;
        // Reject journeys longer than 4 days — likely a bad match
        if (totalMinutes > 4 * 24 * 60) continue;

        const l1 = toJourneyLeg(t1);
        const l2 = toJourneyLeg(t2);
        connectingJourneys.push({
          via: hub,
          viaName: stationCoordinates[hub]?.name || hub,
          legs: [l1, l2],
          layoverMinutes: layover,
          totalMinutes,
          totalHours: formatHours(totalMinutes),
          combinedFares: computeCombinedFares(l1, l2),
        });
      }
    }
  }

  // Clean up train names in connecting journey legs
  for (const j of connectingJourneys) {
    for (const leg of j.legs) {
      leg.trainName = leg.trainName
        .replace(/&NBSP;/gi, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s*VALID FROM.*$/i, "")
        .replace(/\s*EX\s+\d.*$/i, "")
        .trim();
    }
  }

  // Dedupe same (t1, t2) pairs that might appear via different hubs
  const seen = new Set<string>();
  const unique = connectingJourneys.filter((j) => {
    const key = `${j.legs[0].trainNo}-${j.legs[1].trainNo}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by total minutes (fastest first)
  unique.sort((a, b) => a.totalMinutes - b.totalMinutes);

  // If there are direct trains, only show connecting options that are
  // reasonably competitive (not more than 20% slower than fastest direct)
  // Otherwise show all. Cap at 15 either way.
  const threshold = fastestDirect * 1.2;
  const filtered =
    directTrains.length >= 3
      ? unique.filter((j) => j.totalMinutes <= threshold)
      : unique;
  const top = filtered.slice(0, 15);

  const response: JourneyResponse = {
    from: fromCode,
    to: toCode,
    fromName,
    toName,
    directTrains,
    connectingJourneys: top,
    checkedHubs: hubs,
  };

  return NextResponse.json(response);
}
