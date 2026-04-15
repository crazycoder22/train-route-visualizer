import { NextResponse } from "next/server";
import { fetchTrainsBetween, TBSTrain } from "@/lib/tbs";

export type { TBSTrain, TBSClassInfo } from "@/lib/tbs";

export interface TBSResponse {
  from: string;
  to: string;
  totalTrains: number;
  trains: TBSTrain[];
  error?: string;
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

  const trains = await fetchTrainsBetween(fromCode, toCode);

  if (trains.length === 0) {
    return NextResponse.json(
      {
        error:
          "No trains found between these stations. Verify the station codes and try again.",
      },
      { status: 404 }
    );
  }

  // Sort by departure time
  trains.sort((a, b) => {
    const parseT = (s: string) => {
      const m = s.match(/(\d+):(\d+)/);
      return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 9999;
    };
    return parseT(a.departureTime) - parseT(b.departureTime);
  });

  const response: TBSResponse = {
    from: fromCode,
    to: toCode,
    totalTrains: trains.length,
    trains,
  };

  return NextResponse.json(response);
}
