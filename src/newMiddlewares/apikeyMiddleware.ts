import { NextRequest, NextResponse } from "next/server";
import { APIKey } from "../models";
import dbConnect from "@/lib/dbConnect";
import corsMiddleware from "./corsMiddleware";
import rateLimits, { UserType } from "@/lib/rateLimits";

const HOUR = 60 * 60 * 1000;

const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

const sendResponse = (message: string, status: number) => {
  console.log({ message, status });
  return NextResponse.json({ message }, { status });
};

const apiKeyMiddleware =
  (scopes: string[], requiredPermission: string, allowedOrigins?: string[]) =>
  async (req: NextRequest): Promise<NextResponse | null> => {
    try {
      const corsResult = corsMiddleware()(req);
      if (corsResult) {
        return corsResult;
      }

      const apiKey =
        req.headers.get("x-api-key") || req.nextUrl.searchParams.get("apikey");

      if (!apiKey) {
        return sendResponse("API key is required.", HTTP_STATUS.UNAUTHORIZED);
      }

      await dbConnect();
      const apiKeyDoc = await APIKey.findOne({ apiKey });
      if (!apiKeyDoc) {
        return sendResponse("Invalid API key.", HTTP_STATUS.UNAUTHORIZED);
      }

      const hasRequiredPermission = apiKeyDoc.scopes.some(
        (scopeObj: any) =>
          scopes.includes(scopeObj.scopeName) &&
          scopeObj.permissions.includes(requiredPermission)
      );

      if (!hasRequiredPermission) {
        return sendResponse(
          `Permission to ${requiredPermission} is not allowed.`,
          HTTP_STATUS.FORBIDDEN
        );
      }

      const now = Date.now();
      if (!apiKeyDoc.expirationDate || now > apiKeyDoc.expirationDate) {
        apiKeyDoc.count = 0;
        apiKeyDoc.expirationDate = new Date(now + HOUR);
        await apiKeyDoc.save();
      }

      const userType: UserType = apiKeyDoc.userType;
      const rateLimit = apiKeyDoc.rateLimit || rateLimits[userType] || 0;
      if (apiKeyDoc.count >= rateLimit) {
        return sendResponse(
          "Too many requests.",
          HTTP_STATUS.TOO_MANY_REQUESTS
        );
      }

      apiKeyDoc.count += 1;
      await apiKeyDoc.save();

      // Calculate rate limit headers
      const remaining = rateLimit - apiKeyDoc.count;
      const resetTime =
        apiKeyDoc.expirationDate?.getTime() || Date.now() + HOUR;

      // Mutate the request's headers
      req.headers.set("X-RateLimit-Limit", rateLimit.toString());
      req.headers.set("X-RateLimit-Remaining", remaining.toString());
      req.headers.set("X-RateLimit-Reset", resetTime.toString());

      return null; // Continue to the main Route Handler function
    } catch (e) {
      console.error("Error in apiKeyMiddleware:", e);
      return sendResponse(
        "An unexpected error occurred.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  };

export default apiKeyMiddleware;
