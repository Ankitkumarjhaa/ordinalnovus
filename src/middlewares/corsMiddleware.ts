// lib/corsMiddleware.ts
import { NextApiRequest, NextApiResponse } from "next";

const corsMiddleware =
  (allowedOrigins: string[] = ["*"]) =>
  (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const origin: string = req.headers.origin||"";

    if (
      allowedOrigins.includes("*") ||
      allowedOrigins.includes(origin as string)
    ) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
    }

    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    next();
  };

export default corsMiddleware;
