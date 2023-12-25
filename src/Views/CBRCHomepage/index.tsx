import React from "react";
import CBRCTokensList from "./CBRCTokensList";
import { IToken } from "@/types/CBRC";
function CBRCHomepage({ tokens }: { tokens: IToken[] }) {
  return (
    <div>
      <CBRCTokensList defaultData={tokens} />
    </div>
  );
}

export default CBRCHomepage;
