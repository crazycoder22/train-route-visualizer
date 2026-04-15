// Shared helpers for trains-between-stations data, sourced from erail.in's
// getTrains.aspx endpoint which returns tilde-delimited records.

export interface TBSClassInfo {
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
  estimatedFare: number; // in INR, approximate
  tatkalFare: number; // in INR, approximate
}

export interface TBSTrain {
  trainNo: string;
  trainName: string;
  from: string;
  to: string;
  departureTime: string; // HH:MM
  arrivalTime: string; // HH:MM
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

const CLASS_LABELS: Record<string, string> = {
  "1A": "AC First Class",
  "2A": "AC 2 Tier",
  "3A": "AC 3 Tier",
  "3E": "AC 3 Tier Economy",
  SL: "Sleeper",
  "2S": "Second Sitting",
  CC: "Chair Car",
  EC: "Executive Chair Car",
  EA: "Executive AC",
  FC: "First Class",
};

// Approximate Indian Railways fare calculator based on published 2024-25
// tariff slabs. Accurate within ~10% for most routes; does not account for
// dynamic fares, flexi-fares (Rajdhani/Shatabdi), or route-specific surcharges.
//
// Returns fare in whole INR rupees. Rounded to nearest 5.
const BASE_FARE_PER_KM: Record<string, number> = {
  "1A": 1.97,
  "2A": 1.17,
  "3A": 0.83,
  "3E": 0.77,
  CC: 0.4,
  EC: 1.24,
  EA: 1.52,
  SL: 0.27,
  "2S": 0.12,
  FC: 1.1,
};

const MIN_FARE: Record<string, number> = {
  "1A": 325,
  "2A": 180,
  "3A": 125,
  "3E": 115,
  CC: 40,
  EC: 210,
  EA: 270,
  SL: 30,
  "2S": 15,
  FC: 150,
};

// Superfast surcharge (also applied to Rajdhani, Shatabdi, etc.)
const SF_SURCHARGE: Record<string, number> = {
  "1A": 75,
  "2A": 45,
  "3A": 45,
  "3E": 45,
  CC: 45,
  EC: 45,
  EA: 45,
  SL: 45,
  "2S": 15,
  FC: 45,
};

const RESERVATION_CHARGE: Record<string, number> = {
  "1A": 60,
  "2A": 50,
  "3A": 40,
  "3E": 40,
  CC: 40,
  EC: 60,
  EA: 60,
  SL: 20,
  "2S": 15,
  FC: 40,
};

// Classes that attract 5% GST (all AC classes)
const GST_CLASSES = new Set(["1A", "2A", "3A", "3E", "CC", "EC", "EA"]);

// Premium train multipliers (Rajdhani/Shatabdi/Vande Bharat have ~2x fares)
function getTrainTypeMultiplier(trainType: string): number {
  const t = trainType.toLowerCase();
  if (t.includes("rajdhani") || t.includes("vande") || t.includes("tejas")) {
    return 2.2;
  }
  if (t.includes("shatabdi") || t.includes("duronto") || t.includes("humsafar")) {
    return 1.8;
  }
  if (t.includes("garib rath")) return 0.85;
  return 1.0;
}

function isSuperfast(trainType: string): boolean {
  const t = trainType.toLowerCase();
  return (
    t.includes("super") ||
    t.includes("rajdhani") ||
    t.includes("shatabdi") ||
    t.includes("duronto") ||
    t.includes("vande") ||
    t.includes("humsafar") ||
    t.includes("tejas") ||
    t.includes("intercity")
  );
}

function round5(n: number): number {
  return Math.round(n / 5) * 5;
}

export function calculateFare(
  distanceKm: number,
  classCode: string,
  trainType: string
): number {
  if (!distanceKm || distanceKm <= 0) return 0;
  const perKm = BASE_FARE_PER_KM[classCode];
  if (perKm === undefined) return 0;

  const multiplier = getTrainTypeMultiplier(trainType);
  let base = perKm * distanceKm * multiplier;
  const min = MIN_FARE[classCode] || 0;
  if (base < min) base = min;

  // Superfast surcharge
  const sf = isSuperfast(trainType) ? SF_SURCHARGE[classCode] || 0 : 0;
  // Reservation
  const res = RESERVATION_CHARGE[classCode] || 0;
  // GST on (base + sf) for AC classes
  let total = base + sf + res;
  if (GST_CLASSES.has(classCode)) {
    total += (base + sf) * 0.05;
  }
  return round5(total);
}

export function calculateTatkalFare(
  distanceKm: number,
  classCode: string,
  trainType: string
): number {
  const baseFare = calculateFare(distanceKm, classCode, trainType);
  if (baseFare === 0) return 0;
  // Tatkal surcharge: ~30% over base, capped per class
  const surchargeCap: Record<string, number> = {
    "1A": 0, // no tatkal for 1A
    "2A": 500,
    "3A": 400,
    "3E": 350,
    CC: 125,
    EC: 400,
    EA: 400,
    SL: 200,
    "2S": 25,
    FC: 300,
  };
  if (classCode === "1A") return 0; // no tatkal
  const surcharge = Math.min(baseFare * 0.3, surchargeCap[classCode] || 200);
  return round5(baseFare + surcharge);
}

function parseClasses(
  raw: string,
  distanceKm: number,
  trainType: string
): TBSClassInfo[] {
  if (!raw) return [];
  return raw
    .split("|")
    .filter((s) => s.trim())
    .map((entry) => {
      const fields = entry.split(":");
      if (fields.length < 2) return null;
      const code = fields[0];
      const toNum = (s: string) => (s ? parseInt(s, 10) || 0 : 0);
      return {
        code,
        label: CLASS_LABELS[code] || code,
        totalSeats: toNum(fields[1]),
        generalQuota: toNum(fields[2]),
        ladiesQuota: toNum(fields[4]),
        tatkalQuota: toNum(fields[7]),
        premiumTatkalQuota: toNum(fields[8]),
        seniorQuota: toNum(fields[5]),
        disabledQuota: toNum(fields[6]),
        duressQuota: toNum(fields[11]),
        estimatedFare: calculateFare(distanceKm, code, trainType),
        tatkalFare: calculateTatkalFare(distanceKm, code, trainType),
      } as TBSClassInfo;
    })
    .filter((c): c is TBSClassInfo => c !== null && c.code.length > 0);
}

/**
 * Fetch and parse trains running directly between two stations.
 * Cached for 1 hour via Next.js ISR.
 */
export async function fetchTrainsBetween(
  fromCode: string,
  toCode: string
): Promise<TBSTrain[]> {
  const from = fromCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const to = toCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!from || !to || from === to) return [];

  try {
    const res = await fetch(
      `https://erail.in/rail/getTrains.aspx?Station_From=${from}&Station_To=${to}&DataSource=0&Language=0&Cache=true`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        redirect: "follow",
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return [];

    const body = await res.text();
    const entries = body.split("^");
    if (entries.length <= 1) return [];

    const trains: TBSTrain[] = entries
      .slice(1)
      .map((entry): TBSTrain | null => {
        const f = entry.split("~");
        if (f.length < 20) return null;

        const trainNo = f[0] || "";
        const trainName = f[1] || "";
        if (!trainNo) return null;

        const departureTime = (f[10] || "").replace(".", ":");
        const arrivalTime = (f[11] || "").replace(".", ":");
        const duration = f[12] || "";
        const daysBitmap = f[13] || "0000000";
        const trainType = (f[50] || f[32] || "").replace(/_/g, " ");
        const distanceKm = f[39] ? parseInt(f[39], 10) || 0 : 0;
        const distance = distanceKm ? `${distanceKm} km` : "";
        const classesRaw = f[62] || "";

        const daysOfRun = {
          Sun: daysBitmap[0] === "1",
          Mon: daysBitmap[1] === "1",
          Tue: daysBitmap[2] === "1",
          Wed: daysBitmap[3] === "1",
          Thu: daysBitmap[4] === "1",
          Fri: daysBitmap[5] === "1",
          Sat: daysBitmap[6] === "1",
        };
        const daysCount = Object.values(daysOfRun).filter(Boolean).length;

        return {
          trainNo,
          trainName,
          from: f[3] || from,
          to: f[5] || to,
          departureTime,
          arrivalTime,
          departureDate: f[37] || "",
          arrivalDate: f[37] || "",
          duration: duration ? duration.replace(".", " h ") + "m" : "",
          distance,
          haltAtSource: "",
          trainType,
          daysOfRun,
          daysCount,
          classes: parseClasses(classesRaw, distanceKm, trainType),
        };
      })
      .filter((t): t is TBSTrain => t !== null);

    // Deduplicate by train number
    const seen = new Set<string>();
    return trains.filter((t) => {
      if (seen.has(t.trainNo)) return false;
      seen.add(t.trainNo);
      return true;
    });
  } catch {
    return [];
  }
}

/** Parse HH:MM or HH.MM to minutes since midnight */
export function parseTimeToMinutes(s: string): number | null {
  if (!s) return null;
  const m = s.match(/(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
}

/** Parse duration string like "06 h 05m" or "6.05" to minutes */
export function parseDurationToMinutes(s: string): number {
  if (!s) return 0;
  const m = s.match(/(\d+)\s*h\s*(\d+)/);
  if (m) return parseInt(m[1]) * 60 + parseInt(m[2]);
  const m2 = s.match(/(\d+)[.:](\d+)/);
  if (m2) return parseInt(m2[1]) * 60 + parseInt(m2[2]);
  return 0;
}
