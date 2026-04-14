import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { stationCoordinates } from "@/data/stations";

export interface StationSchedule {
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

export interface TrainScheduleResponse {
  trainNo: string;
  trainName: string;
  stations: StationSchedule[];
  states: string[];
  error?: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ trainNo: string }> }
) {
  const { trainNo } = await params;

  try {
    // Fetch the train schedule page from confirmtkt
    const url = `https://www.confirmtkt.com/train-schedule/${trainNo}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch train schedule: ${res.status}` },
        { status: 500 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract train name from the page title / h1
    let trainName = "";
    const titleEl = $("h1").first().text().trim();
    if (titleEl) {
      trainName = titleEl.replace(/route/i, "").replace(/schedule/i, "").replace(/train/i, "").trim();
    }
    if (!trainName) {
      trainName = `Train ${trainNo}`;
    }

    // Parse schedule table
    const stations: StationSchedule[] = [];
    const statesSet = new Set<string>();

    // Try parsing from the table
    $("table tbody tr").each((index, el) => {
      const tds = $(el).find("td");
      if (tds.length >= 6) {
        const stationText = $(tds[1]).text().trim();
        // Station name and code are typically in the format "STATION NAME (CODE)"
        // or the code might be in a separate element
        let stationName = stationText;
        let stationCode = "";

        // Try to extract code from the text
        const codeMatch = stationText.match(/\(([A-Z0-9]+)\)/);
        if (codeMatch) {
          stationCode = codeMatch[1];
          stationName = stationText.replace(/\([A-Z0-9]+\)/, "").trim();
        }

        // Also try data attributes or links
        const link = $(tds[1]).find("a");
        if (link.length) {
          const href = link.attr("href") || "";
          const linkCodeMatch = href.match(/\/([A-Z0-9]+)$/);
          if (linkCodeMatch) {
            stationCode = linkCodeMatch[1];
          }
          stationName = link.text().trim();
          // Re-extract code from link text
          const linkTextCode = stationName.match(/\(([A-Z0-9]+)\)/);
          if (linkTextCode) {
            stationCode = linkTextCode[1];
            stationName = stationName.replace(/\([A-Z0-9]+\)/, "").trim();
          }
        }

        // If we still don't have a code, try extracting it differently
        if (!stationCode) {
          const allText = $(tds[1]).text().trim();
          const parts = allText.split(/\s+/);
          // Try to find a short uppercase word that looks like a station code
          for (const part of parts) {
            if (/^[A-Z]{2,5}$/.test(part)) {
              stationCode = part;
              break;
            }
          }
        }

        const arrival = $(tds[2]).text().trim();
        const departure = $(tds[3]).text().trim();
        const day = parseInt($(tds[4]).text().trim()) || 1;
        const distance = $(tds[5]).text().trim();

        // Look up coordinates
        const stationInfo = stationCode ? stationCoordinates[stationCode] : null;

        if (stationInfo) {
          statesSet.add(stationInfo.state);
        }

        stations.push({
          serialNo: index + 1,
          stationName: stationInfo?.name || stationName || stationCode,
          stationCode,
          arrival,
          departure,
          day,
          distance,
          lat: stationInfo?.lat || null,
          lng: stationInfo?.lng || null,
          state: stationInfo?.state || null,
        });
      }
    });

    // If table parsing didn't work, try JSON-LD or script data
    if (stations.length === 0) {
      // Try to find schedule data in script tags
      $("script").each((_, el) => {
        const scriptContent = $(el).html() || "";
        if (scriptContent.includes("stationSchedule") || scriptContent.includes("trainSchedule")) {
          try {
            // Try to extract JSON data
            const jsonMatch = scriptContent.match(/(?:stationSchedule|trainSchedule)\s*=\s*(\[[\s\S]*?\]);/);
            if (jsonMatch) {
              const data = JSON.parse(jsonMatch[1]);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.forEach((item: any, idx: number) => {
                const code = item.stationCode || item.code || "";
                const stationInfo = code ? stationCoordinates[code] : null;
                if (stationInfo) statesSet.add(stationInfo.state);

                stations.push({
                  serialNo: idx + 1,
                  stationName: stationInfo?.name || item.stationName || item.name || code,
                  stationCode: code,
                  arrival: item.arrivalTime || item.arrival || "",
                  departure: item.departureTime || item.departure || "",
                  day: parseInt(item.day) || 1,
                  distance: item.distance || "",
                  lat: stationInfo?.lat || null,
                  lng: stationInfo?.lng || null,
                  state: stationInfo?.state || null,
                });
              });
            }
          } catch {
            // ignore parse errors
          }
        }
      });
    }

    // Also try to find structured data (JSON-LD)
    if (stations.length === 0) {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() || "");
          if (data.hasPart || data.subTrip) {
            const trips = data.hasPart || data.subTrip || [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            trips.forEach((trip: any, idx: number) => {
              const depStation = trip.departureStation || trip.fromLocation;
              const code = depStation?.identifier || "";
              const name = depStation?.name || "";
              const stationInfo = code ? stationCoordinates[code] : null;
              if (stationInfo) statesSet.add(stationInfo.state);

              stations.push({
                serialNo: idx + 1,
                stationName: stationInfo?.name || name || code,
                stationCode: code,
                arrival: trip.arrivalTime || "",
                departure: trip.departureTime || "",
                day: 1,
                distance: "",
                lat: stationInfo?.lat || null,
                lng: stationInfo?.lng || null,
                state: stationInfo?.state || null,
              });
            });
          }
        } catch {
          // ignore
        }
      });
    }

    if (stations.length === 0) {
      return NextResponse.json(
        { error: "Could not parse train schedule. The train number may be invalid." },
        { status: 404 }
      );
    }

    // Build ordered states list
    const orderedStates: string[] = [];
    for (const station of stations) {
      if (station.state && !orderedStates.includes(station.state)) {
        orderedStates.push(station.state);
      }
    }

    const response: TrainScheduleResponse = {
      trainNo,
      trainName,
      stations,
      states: orderedStates,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching train schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch train schedule. Please try again." },
      { status: 500 }
    );
  }
}
