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

function parseClasses(raw: string): TBSClassInfo[] {
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
        const distance = f[39] ? `${f[39]} km` : "";
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
          classes: parseClasses(classesRaw),
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
