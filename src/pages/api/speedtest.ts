import { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

const API_URL = "https://api.ordinalnovus.com/api";
const API_KEY = "09b92b2d-1311-47d8-9131-fade4e2e15ca";
const ROUTES = [
  "/inscription",
  "/search",
  "/ordapi/feed",
  "/collection",
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const results = [];

  for (const route of ROUTES) {
    try {
      const start = process.hrtime.bigint();
      await axios.get(`${API_URL}${route}?apiKey=${API_KEY}&id=13000007`);
      const end = process.hrtime.bigint();

      const timeInMs = Number(end - start) / 1e6; // Convert nanoseconds to milliseconds

      results.push({
        route,
        responseTime: timeInMs,
      });
    } catch (error) {
      results.push({
        route,
        error: error.message,
      });
    }
  }

  res.status(200).json(results);
}
