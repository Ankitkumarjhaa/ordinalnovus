import { NextApiRequest, NextApiResponse } from "next";
import { APIKey } from "../models";

import corsMiddleware from "./corsMiddleware";
import dbConnect from "@/lib/dbConnect";

const HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  TOO_MANY_REQUESTS: 429,
};

const apiKeyMiddleware =
  (scopes: string[], requiredPermission: string, allowedOrigins?: string[]) =>
  async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    await corsMiddleware(allowedOrigins)(req, res, async () => {
      try {
        await dbConnect();
        // await corsMiddleware(allowedOrigins)(req, res, () => {});

        const apiKey = req.headers["x-api-key"] || req.query.apiKey;

        if (!apiKey) {
          res
            .status(HTTP_STATUS.UNAUTHORIZED)
            .json({ message: "API key is required." });
          return;
        }

        const apiKeyDoc = await APIKey.findOne({ apiKey });

        if (!apiKeyDoc) {
          console.log(apiKeyDoc, "api");
          res
            .status(HTTP_STATUS.FORBIDDEN)
            .json({ message: "Invalid API key." });
          return;
        }

        // Check if the client IP is in the allowedIPs list
        const clientIP =
          req.connection.remoteAddress || req.headers["x-forwarded-for"];
        console.log(clientIP, "IP");
        if (
          apiKeyDoc.allowedIPs &&
          apiKeyDoc.allowedIPs.length > 0 &&
          !apiKeyDoc.allowedIPs.includes(clientIP)
        ) {
          res
            .status(HTTP_STATUS.FORBIDDEN)
            .json({ message: "Access from this IP is not allowed." });
          return;
        }

        const hasRequiredPermission = apiKeyDoc.scopes.some(
          (scopeObj: any) =>
            scopes.includes(scopeObj.scopeName) &&
            scopeObj.permissions.includes(requiredPermission)
        );

        if (!hasRequiredPermission) {
          res.status(HTTP_STATUS.FORBIDDEN).json({
            message: `Permission to ${requiredPermission} is not allowed.`,
          });
          return;
        }

        const now = Date.now();

        if (apiKeyDoc.expirationDate && now > apiKeyDoc.expirationDate) {
          apiKeyDoc.count = 0;
          apiKeyDoc.expirationDate = new Date(now + HOUR);
          await apiKeyDoc.save();
        } else if (!apiKeyDoc.expirationDate) {
          apiKeyDoc.expirationDate = new Date(now + HOUR);
          await apiKeyDoc.save();
        }

        let rateLimit = 0;
        if (apiKeyDoc.userType === "free") {
          rateLimit = 100;
        } else if (apiKeyDoc.userType === "silver") {
          rateLimit = 500;
        } else if (apiKeyDoc.userType === "gold") {
          rateLimit = 1000;
        } else if (apiKeyDoc.userType === "admin") {
          rateLimit = 100000;
        }

        const requestsInLastHour = apiKeyDoc.count;

        if (requestsInLastHour >= rateLimit) {
          res
            .status(HTTP_STATUS.TOO_MANY_REQUESTS)
            .json({ message: "Too many requests." });
          return;
        }

        apiKeyDoc.count += 1;
        await apiKeyDoc.save();

        next();
      } catch (e) {
        console.error("Error in apiKeyMiddleware:", e);
        res.status(500).json({ message: "An unexpected error occurred." });
      }
    });
  };

export default apiKeyMiddleware;
