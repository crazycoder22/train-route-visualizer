import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export interface LiveStationStatus {
  serialNo: number;
  stationName: string;
  stationCode: string;
  scheduledArrival: string;
  scheduledDeparture: string;
  actualArrival: string;
  actualDeparture: string;
  delayMinutes: number | null;
  day: string;
  date: string;
  isCurrent: boolean;
  status: "departed" | "arrived" | "current" | "upcoming" | "not-available";
  statusText: string;
}

export interface LiveStatusResponse {
  trainNo: string;
  trainName: string;
  currentStation: string;
  currentStatus: string;
  lastUpdated: string;
  overallDelay: string;
  stations: LiveStationStatus[];
  error?: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ trainNo: string }> }
) {
  const { trainNo } = await params;

  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date") || "";

  try {
    const fetchUrl = dateParam
      ? `https://www.confirmtkt.com/train-running-status/${trainNo}?date=${dateParam}`
      : `https://www.confirmtkt.com/train-running-status/${trainNo}`;

    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      next: { revalidate: 120 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch live status: ${res.status}` },
        { status: 500 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract train name from meta or breadcrumb
    let trainName = "";
    const metaDesc = $('meta[name="description"]').attr("content") || "";
    const nameMatch = metaDesc.match(/Live Train Status of (.+?) and/i);
    if (nameMatch) {
      trainName = nameMatch[1].trim();
    }
    if (!trainName) {
      const breadcrumb = $('span[itemprop="name"]').last().text().trim();
      if (breadcrumb) trainName = breadcrumb;
    }
    if (!trainName) trainName = `Train ${trainNo}`;

    // Extract current status from .train-update__status
    let currentStatus = $(".train-update__status").text().trim().replace(/\s+/g, " ");
    const lastUpdated = $(".train-update__time")
      .text()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\(Disclaimer.*\)/i, "")
      .trim();

    // Parse stations from .rs__station-row divs
    const stations: LiveStationStatus[] = [];
    let currentStation = "";
    let lastDepartedIdx = -1;

    $(".rs__station-row").each((index, el) => {
      const row = $(el);
      const cols = row.find("> div");

      // Station name (col 1)
      const stationName = row.find(".rs__station-name").text().trim();

      // Check if this is the current station (circle blink class)
      const circleEl = row.find(".circle, .circle-thin, .circle-green, .circle-filled");
      const isCurrent = row.find(".circle.blink, .blink").length > 0;

      // Day and date (col 2)
      const dateCol = cols.eq(1);
      const spans = dateCol.find("span");
      const day = spans.eq(0).text().trim();
      const date = spans.eq(1).text().trim();

      // Arrival (col 3)
      const arrCol = cols.eq(2);
      const scheduledArrival = arrCol.find("span").first().text().trim();

      // Departure (col 4)
      const depCol = cols.eq(3);
      const scheduledDeparture = depCol.find("span").first().text().trim();

      // Delay/status (col 5)
      const delayEl = row.find(".rs__station-delay");
      const statusText = delayEl.text().trim().replace(/\s+/g, " ");

      // Parse delay minutes from status text
      let delayMinutes: number | null = null;
      const statusLower = statusText.toLowerCase();

      if (statusLower.includes("right time") || statusLower.includes("no delay")) {
        delayMinutes = 0;
      } else {
        // Try parsing "X min late" or "X Hr Y min late"
        const hrMinMatch = statusText.match(/(\d+)\s*Hr\s*(\d+)\s*min/i);
        const minMatch = statusText.match(/(\d+)\s*min/i);

        if (hrMinMatch) {
          delayMinutes = parseInt(hrMinMatch[1]) * 60 + parseInt(hrMinMatch[2]);
        } else if (minMatch) {
          delayMinutes = parseInt(minMatch[1]);
        }

        if (statusLower.includes("early") || statusLower.includes("before")) {
          if (delayMinutes !== null) delayMinutes = -delayMinutes;
        }
      }

      // Determine station code from the station link if available
      let stationCode = "";
      const link = row.find("a[href*='station']");
      if (link.length) {
        const href = link.attr("href") || "";
        const codeMatch = href.match(/\/([A-Z0-9]+)$/);
        if (codeMatch) stationCode = codeMatch[1];
      }

      // Determine status based on circle class and delay class
      let status: LiveStationStatus["status"] = "upcoming";
      const hasGreenCircle =
        row.find(".circle-green").length > 0 ||
        circleEl.attr("style")?.includes("green") ||
        false;
      const delayClass = delayEl.attr("class") || "";

      // Departed stations typically have green circles or filled circles
      // The "blink" class indicates current station
      if (isCurrent) {
        status = "current";
        currentStation = stationName;
      } else if (
        hasGreenCircle ||
        delayClass.includes("delay--no") ||
        delayClass.includes("delay--yes")
      ) {
        // Has delay info = train has passed through or is at this station
        // We need to determine if departed or upcoming based on position
        // For now mark as having status info, we'll refine below
        status = "departed";
        lastDepartedIdx = index;
      }

      stations.push({
        serialNo: index + 1,
        stationName,
        stationCode,
        scheduledArrival,
        scheduledDeparture,
        actualArrival: "",
        actualDeparture: "",
        delayMinutes,
        day,
        date,
        isCurrent,
        status,
        statusText,
      });
    });

    // Refine statuses: everything after the current/last-departed station is upcoming
    // Find the current station index
    let currentIdx = stations.findIndex((s) => s.isCurrent);
    if (currentIdx === -1 && lastDepartedIdx >= 0) {
      // If no blink found, check if all stations show "Right Time" (train hasn't started)
      const allRightTime = stations.every(
        (s) => s.statusText.toLowerCase().includes("right time")
      );
      if (allRightTime && currentStatus.toLowerCase().includes("yet to start")) {
        // Train hasn't started yet
        stations.forEach((s) => {
          s.status = "upcoming";
        });
        stations[0].status = "current";
        stations[0].isCurrent = true;
        currentStation = stations[0].stationName;
        currentIdx = 0;
      } else {
        // Mark the station after last departed as current
        if (lastDepartedIdx < stations.length - 1) {
          stations[lastDepartedIdx + 1].status = "current";
          stations[lastDepartedIdx + 1].isCurrent = true;
          currentStation = stations[lastDepartedIdx + 1].stationName;
          currentIdx = lastDepartedIdx + 1;
        }
      }
    }

    // Everything after current is upcoming
    if (currentIdx >= 0) {
      for (let i = currentIdx + 1; i < stations.length; i++) {
        if (stations[i].status !== "current") {
          stations[i].status = "upcoming";
        }
      }
      // Everything before current is departed (unless it's current itself)
      for (let i = 0; i < currentIdx; i++) {
        stations[i].status = "departed";
      }
    }

    // Calculate overall delay
    let overallDelay = "";
    const lastKnown = [...stations]
      .reverse()
      .find((s) => s.delayMinutes !== null && (s.status === "departed" || s.status === "current"));
    if (lastKnown && lastKnown.delayMinutes !== null) {
      if (lastKnown.delayMinutes === 0) overallDelay = "On Time";
      else if (lastKnown.delayMinutes > 0) overallDelay = `${lastKnown.delayMinutes} min late`;
      else overallDelay = `${Math.abs(lastKnown.delayMinutes)} min early`;
    } else if (
      stations.length > 0 &&
      stations.every((s) => s.statusText.toLowerCase().includes("right time"))
    ) {
      overallDelay = "On Time";
    }

    if (stations.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not parse live running status. The train may not be running today or the number may be invalid.",
        },
        { status: 404 }
      );
    }

    const response: LiveStatusResponse = {
      trainNo,
      trainName,
      currentStation,
      currentStatus,
      lastUpdated,
      overallDelay,
      stations,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching live status:", error);
    return NextResponse.json(
      { error: "Failed to fetch live running status. Please try again." },
      { status: 500 }
    );
  }
}
