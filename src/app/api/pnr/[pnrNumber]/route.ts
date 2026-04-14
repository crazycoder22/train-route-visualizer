import { NextResponse } from "next/server";

export interface PassengerStatus {
  number: number;
  bookingStatus: string;
  currentStatus: string;
  coach: string;
  berth: string;
  berthType: string;
  confirmed: boolean;
}

export interface PnrStatusResponse {
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pnrNumber: string }> }
) {
  const { pnrNumber } = await params;

  // Validate PNR format (10 digits)
  const cleaned = pnrNumber.replace(/\s/g, "");
  if (!/^\d{10}$/.test(cleaned)) {
    return NextResponse.json(
      { error: "PNR number must be exactly 10 digits." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `https://www.confirmtkt.com/api/pnr/status/${cleaned}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        next: { revalidate: 60 }, // cache 1 minute
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PNR status: ${res.status}` },
        { status: 502 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();

    // Check for errors
    if (data.ErrorCode && data.ErrorCode !== 200) {
      return NextResponse.json(
        {
          error:
            data.Error ||
            data.InformationMessage ||
            "PNR not found. Please check the number and try again.",
        },
        { status: 404 }
      );
    }

    if (!data.TrainNo) {
      return NextResponse.json(
        { error: "PNR not found or data unavailable. Please try again later." },
        { status: 404 }
      );
    }

    // Parse passenger statuses
    const passengers: PassengerStatus[] = [];
    if (Array.isArray(data.PassengerStatus)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.PassengerStatus.forEach((p: any, idx: number) => {
        const currentStatus = p.CurrentStatus || p.PredictionStatus || "";
        const bookingStatus = p.BookingStatus || "";

        // Determine if confirmed
        const isConfirmed =
          currentStatus.toUpperCase().startsWith("CNF") ||
          currentStatus.toUpperCase().startsWith("CONFIRMED") ||
          (currentStatus.includes("/") &&
            !currentStatus.toUpperCase().startsWith("WL") &&
            !currentStatus.toUpperCase().startsWith("RAC") &&
            !currentStatus.toUpperCase().startsWith("RLWL") &&
            !currentStatus.toUpperCase().startsWith("GNWL") &&
            !currentStatus.toUpperCase().startsWith("PQWL"));

        // Parse coach/berth from current status (e.g., "S5/32/SU")
        let coach = "";
        let berth = "";
        let berthType = "";
        const statusParts = currentStatus.split("/");
        if (statusParts.length >= 2 && isConfirmed) {
          coach = statusParts[0] || "";
          berth = statusParts[1] || "";
          berthType = statusParts[2] || "";
        }

        passengers.push({
          number: idx + 1,
          bookingStatus,
          currentStatus,
          coach,
          berth,
          berthType,
          confirmed: isConfirmed,
        });
      });
    }

    const response: PnrStatusResponse = {
      pnr: data.Pnr || cleaned,
      trainNo: data.TrainNo || "",
      trainName: data.TrainName || "",
      doj: data.Doj || "",
      bookingDate: data.BookingDate || "",
      from: data.From || "",
      fromName: data.SourceName || data.From || "",
      to: data.To || "",
      toName: data.DestinationName || data.To || "",
      boardingPoint: data.BoardingPoint || "",
      boardingPointName: data.BoardingStationName || data.BoardingPoint || "",
      reservationUpto: data.ReservationUpto || "",
      reservationUptoName: data.ReservationUptoName || data.ReservationUpto || "",
      travelClass: data.Class || "",
      quota: data.Quota || "",
      chartPrepared: data.ChartPrepared || false,
      trainCancelled: data.TrainCancelledFlag || false,
      departureTime: data.DepartureTime || "",
      arrivalTime: data.ArrivalTime || "",
      expectedPlatform: data.ExpectedPlatformNo || "",
      passengers,
      bookingFare: data.BookingFare || "",
      duration: data.Duration || "",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching PNR status:", error);
    return NextResponse.json(
      { error: "Failed to fetch PNR status. Please try again." },
      { status: 500 }
    );
  }
}
