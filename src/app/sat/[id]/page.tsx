import SearchDetailPage from "@/Views/Sat";
import searchSat from "@/apiHelper/searchSat";
import React from "react";

async function Page({ params: { id } }: { params: { id: string } }) {
  const searchResult = await searchSat({ id });
  return <SearchDetailPage data={searchResult.data.sat} />;
}

export default Page;
