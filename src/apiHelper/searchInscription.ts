"use server";
export default async function searchInscription({ id }: { id: string }) {
  const link = `${process.env.NEXT_PUBLIC_URL}/api/v2/search/inscription?apikey=${process.env.API_KEY}&&id=${id}`;

  const res = await fetch(link, {
    cache: "no-store",
  });

  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.

  // Recommendation: handle errors
  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error("Failed to fetch data");
  }

  return res.json();
}
