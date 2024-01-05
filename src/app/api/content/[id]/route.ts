import { NextRequest, NextResponse } from "next/server";
import { getCache, setCache } from "@/lib/cache";
import fetchContentFromProviders from "@/utils/api/fetchContentFromProviders";

function bufferToStream(base64String: string) {
  const buffer = Buffer.from(base64String, "base64");
  const uint8array = new Uint8Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength
  );

  return new ReadableStream({
    start(controller) {
      controller.enqueue(uint8array);
      controller.close();
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const contentId = params.id;

  try {
    const cacheKey = `content:${contentId}`;
    let content = await getCache(cacheKey);

    if (!content) {
      const response = await fetchContentFromProviders(contentId);
      content = {
        data: response.data.toString("base64"),
        contentType: response.headers["content-type"],
      };

      // Cache the content data in Redis for 5 hour
      await setCache(cacheKey, content, 5 * 60);
    }

    const stream = bufferToStream(content.data);

    return new Response(stream, {
      headers: { "Content-Type": content.contentType },
    });
  } catch (error: any) {
    if (error.response) {
      return NextResponse.json({
        status: error.response.status,
        body: { error: "Error fetching content" },
      });
    } else {
      return NextResponse.json({
        status: 500,
        body: { error: "Unexpected error occurred" },
      });
    }
  }
}
