import SearchDetailPage from "@/Views/Inscription";
import searchInscription from "@/apiHelper/searchInscription";
import React from "react";

async function Page({ params: { id } }: { params: { id: string } }) {
  const searchResult = await searchInscription({ id });
  console.log(searchResult, "SEARCHRESULT");
  return <SearchDetailPage data={searchResult.data.inscriptions[0]} />;
}

export default Page;
