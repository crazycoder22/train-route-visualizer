import { NextResponse } from "next/server";
import { stationCoordinates } from "@/data/stations";

export interface StationTrain {
  trainNo: string;
  trainName: string;
  arrivalTime: string;
  departureTime: string;
  classes: string[];
  daysOfRun: {
    Sun: boolean;
    Mon: boolean;
    Tue: boolean;
    Wed: boolean;
    Thu: boolean;
    Fri: boolean;
    Sat: boolean;
  };
  isOrigin: boolean;
  isDestination: boolean;
  daysCount: number;
}

export interface StationTrainsResponse {
  stationCode: string;
  stationName: string;
  state: string | null;
  totalTrains: number;
  trains: StationTrain[];
  error?: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ stationCode: string }> }
) {
  const { stationCode } = await params;
  const code = stationCode.toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (!code) {
    return NextResponse.json({ error: "Invalid station code" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://www.confirmtkt.com/station/${code}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 3600 }, // cache 1 hour
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch station data: ${res.status}` },
        { status: 502 }
      );
    }

    const html = await res.text();

    // Extract the data = [...] JSON array embedded in the page
    const dataMatch = html.match(/data\s*=\s*(\[[\s\S]*?\]);/);
    if (!dataMatch) {
      return NextResponse.json(
        { error: "Could not parse station data. Station code may be invalid." },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let rawTrains: any[] = [];
    try {
      rawTrains = JSON.parse(dataMatch[1]);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse station data." },
        { status: 500 }
      );
    }

    const trains: StationTrain[] = rawTrains.map((t) => {
      const arrivalTime = String(t.ArrivalTime || "").trim();
      const departureTime = String(t.DepartureTime || "").trim();
      const isOrigin = arrivalTime.toLowerCase() === "source";
      const isDestination = departureTime.toLowerCase() === "destination";

      const days = t.DaysOfRun || {};
      const daysCount = Object.values(days).filter(Boolean).length;

      return {
        trainNo: String(t.TrainNo || ""),
        trainName: String(t.TrainName || "").trim(),
        arrivalTime: isOrigin ? "—" : arrivalTime,
        departureTime: isDestination ? "—" : departureTime,
        classes: Array.isArray(t.Classes) ? t.Classes.map(String) : [],
        daysOfRun: {
          Sun: !!days.Sun,
          Mon: !!days.Mon,
          Tue: !!days.Tue,
          Wed: !!days.Wed,
          Thu: !!days.Thu,
          Fri: !!days.Fri,
          Sat: !!days.Sat,
        },
        isOrigin,
        isDestination,
        daysCount,
      };
    });

    // Sort by departure time (for trains with valid times), origin trains last
    trains.sort((a, b) => {
      const parseT = (t: string): number => {
        const m = t.match(/(\d{1,2}):(\d{2})/);
        return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : Infinity;
      };
      const aT = parseT(a.departureTime !== "—" ? a.departureTime : a.arrivalTime);
      const bT = parseT(b.departureTime !== "—" ? b.departureTime : b.arrivalTime);
      return aT - bT;
    });

    // Lookup station info from our coordinates dataset
    const info = stationCoordinates[code];
    let stationName = info?.name || code;
    let state = info?.state || null;

    // Try extracting station name from title meta if not in our data
    if (!info) {
      const titleMatch = html.match(/<title>\s*All trains passing through (\S+)/i);
      if (titleMatch) stationName = titleMatch[1];
    }

    const response: StationTrainsResponse = {
      stationCode: code,
      stationName,
      state,
      totalTrains: trains.length,
      trains,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching station trains:", error);
    return NextResponse.json(
      { error: "Failed to fetch station trains. Please try again." },
      { status: 500 }
    );
  }
}
