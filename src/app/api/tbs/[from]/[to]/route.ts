import { NextResponse } from "next/server";

export interface TBSClassInfo {
  code: string; // e.g., "1A", "2A", "3A", "SL"
  label: string; // e.g., "First AC", "AC 2 Tier"
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

export interface TBSResponse {
  from: string;
  to: string;
  totalTrains: number;
  trains: TBSTrain[];
  error?: string;
}

// Parse "HH.MM hr" or "HH:MM hr" to total minutes
function parseDurationToMinutes(str: string): number {
  const m = str.match(/(\d+)[.:](\d+)/);
  if (!m) return 0;
  return parseInt(m[1]) * 60 + parseInt(m[2]);
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

  try {
    // Use erail.in's getTrains.aspx endpoint which returns tilde-delimited
    // train data including class composition (seats per class and quota).
    const res = await fetch(
      `https://erail.in/rail/getTrains.aspx?Station_From=${fromCode}&Station_To=${toCode}&DataSource=0&Language=0&Cache=true`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        redirect: "follow",
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch trains: ${res.status}` },
        { status: 502 }
      );
    }

    const body = await res.text();

    // The response is tilde-delimited with trains separated by `^`.
    // The first `^`-separated entry is a header; the rest are trains.
    const entries = body.split("^");
    if (entries.length <= 1) {
      return NextResponse.json(
        {
          error:
            "No trains found between these stations. Verify the station codes and try again.",
        },
        { status: 404 }
      );
    }

    // Parse availability field (index 62) like:
    // "1A:16::::::::::|2A:41:16::8:::16::::|3A:300:88::32:::88::::2|SL:134:84::28::6:84::::4|"
    // Each class entry: Code:Total:GN::LD:::TQ:PT:SS:HP:Duress
    // Exact quota mapping isn't critical; we expose all quota fields and
    // let the client choose what to display.
    const parseClasses = (raw: string): TBSClassInfo[] => {
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
    };

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
        // Days bitmap is field 13 or 29 in different records; use 13 first
        const daysBitmap = f[13] || "0000000";
        const trainType = (f[50] || f[32] || "").replace(/_/g, " ");
        // Distance is at field 39
        const distance = f[39] ? `${f[39]} km` : "";
        // Class availability is at field 62
        const classesRaw = f[62] || "";

        // Days bitmap in getTrains.aspx is SMTWTFS (Sun first)
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
          from: f[3] || fromCode,
          to: f[5] || toCode,
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

    // Deduplicate by train number (erail sometimes repeats)
    const seen = new Set<string>();
    const unique = trains.filter((t) => {
      if (seen.has(t.trainNo)) return false;
      seen.add(t.trainNo);
      return true;
    });

    // Sort by departure time
    unique.sort((a, b) => {
      const parseT = (s: string) => {
        const m = s.match(/(\d+):(\d+)/);
        return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 9999;
      };
      return parseT(a.departureTime) - parseT(b.departureTime);
    });

    const response: TBSResponse = {
      from: fromCode,
      to: toCode,
      totalTrains: unique.length,
      trains: unique,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching trains between stations:", error);
    return NextResponse.json(
      { error: "Failed to fetch trains between stations. Please try again." },
      { status: 500 }
    );
  }
}

// Expose helper for use elsewhere if needed
export { parseDurationToMinutes };
