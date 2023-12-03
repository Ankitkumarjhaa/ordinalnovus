// middlewares/corsMiddleware.ts
import { NextRequest, NextResponse } from "next/server";

const corsMiddleware =
  (allowedOrigins: string[] = ["*"]) =>
  (req: NextRequest): NextResponse | null => {
    const origin: string = req.headers.get("origin") || "";

    if (
      allowedOrigins.includes("*") ||
      allowedOrigins.includes(origin as string)
    ) {
      req.headers.set("Access-Control-Allow-Origin", origin);
      req.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      req.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, x-api-key"
      );
    } else {
      // Origin not allowed
      return NextResponse.json(
        { message: "CORS policy: Not allowed." },
        { status: 403 }
      );
    }

    if (req.method === "OPTIONS") {
      // Preflight request. Reply successfully:
      return NextResponse.json(null, { status: 204 });
    }

    // If no issues related to CORS, return null so that the request can proceed
    return null;
  };

export default corsMiddleware;
