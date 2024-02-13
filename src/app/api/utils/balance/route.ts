import { getCache, setCache } from "@/lib/cache";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { countDummyUtxos } from "@/utils/serverUtils/countDummyUtxos";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    console.log("***** BALANCE API CALLED *****");
    const middlewareResponse = await apiKeyMiddleware(
      ["inscription"],
      "write",
      []
    )(req);

    if (middlewareResponse) {
      return middlewareResponse;
    }
    // const query = convertParams(CBRCToken, req.nextUrl);

    console.log(req.nextUrl.searchParams.get("address"), "SEARCH_PARAMS");
    const address = req.nextUrl.searchParams.get("address");
    if (!address) {
      return NextResponse.json(
        { message: "No Address Found" },
        { status: 404 }
      );
    }
    // Generate a unique key for this query
    const cacheKey = `bal:${JSON.stringify(
      req.nextUrl.searchParams.get("address")
    )}`;

    // console.log({ finalQueryCbrc: query });
    // Try to fetch the result from Redis first
    let cachedResult = await getCache(cacheKey);

    if (cachedResult) {
      console.debug("using cache");
      return NextResponse.json(cachedResult);
    }

    // Proceed to fetch new balance data
    const { data } = await axios.get(
      `https://mempool-api.ordinalnovus.com/address/${address}`
    );
    if (data) {
      const newBal =
        data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
      const newMempoolBal =
        data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;

      const cacheKey2 = `oldbal:${JSON.stringify(
        req.nextUrl.searchParams.get("address")
      )}`;

      // console.log({ finalQueryCbrc: query });
      // Try to fetch the result from Redis first
      let cachedResult = await getCache(cacheKey2);

      let dummyUtxos = null;

      if (cachedResult && cachedResult.balance === newBal) {
        dummyUtxos = cachedResult.dummyUtxos;
      } else {
        dummyUtxos = await countDummyUtxos(address);
      }

      const result = {
        balance: newBal,
        mempool_balance: newMempoolBal,
        dummyUtxos,
      };

      await setCache(cacheKey, result, 300); // 5 minutes
      await setCache(cacheKey2, result, 600); // 10 minutes
      return NextResponse.json(result);
    }
  } catch (err) {
    console.error(err); // or use a more advanced error logging mechanism
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
