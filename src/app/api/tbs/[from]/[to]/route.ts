import { NextResponse } from "next/server";

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
}

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
    const res = await fetch(
      `https://erail.in/trains-between-stations/${fromCode}/${toCode}`,
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

    const html = await res.text();

    // Extract all data-train attributes
    const matches = Array.from(
      html.matchAll(/data-train='([^']+)'/g)
    );

    if (matches.length === 0) {
      return NextResponse.json(
        {
          error:
            "No trains found between these stations. Verify the station codes and try again.",
        },
        { status: 404 }
      );
    }

    const trains: TBSTrain[] = matches
      .map((m): TBSTrain | null => {
        const parts = m[1].split("_");
        // Expected format:
        // 0: trainNo, 1: trainName, 2: from, 3: to, 4: fromDate, 5: depTime,
        // 6: toDate, 7: arrTime, 8: duration, 9: distance, 10: haltFrom,
        // 11: haltTo, 12: internalId, 13: daysBitmap, 14: classesBitmap,
        // 15: trainType, ...
        if (parts.length < 14) return null;

        const trainNo = parts[0];
        const trainName = parts[1];
        const fromStn = parts[2];
        const toStn = parts[3];
        const departureDate = parts[4];
        const departureTime = parts[5];
        const arrivalDate = parts[6];
        const arrivalTime = parts[7];
        const duration = parts[8];
        const distance = parts[9];
        const haltAtSource = parts[10] || "";
        const daysBitmap = parts[13] || "0000000";
        const trainType = parts[15] || "";

        // Days bitmap format: SMTWTFS (Sun=0, Mon=1, ..., Sat=6)
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
          from: fromStn,
          to: toStn,
          departureTime,
          arrivalTime,
          departureDate,
          arrivalDate,
          duration,
          distance,
          haltAtSource,
          trainType: trainType.replace(/_/g, " "),
          daysOfRun,
          daysCount,
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
