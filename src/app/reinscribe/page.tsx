import Crafter from "@/Views/Crafter";
import React from "react";

function page() {
  // return (
  // <div className="center min-h-[80vh]">
  //   Reinscription Maker will be back soon.
  // </div>
  // );
  return (
    <>
      <div className="center py-6 bg-red-900 text-red-200">
        This tool is in BETA. By using this tool, you accept the risk associated
        with testing this tool.
      </div>
      <div className="text-center">
        <div>
          Risks: Your inscription might get stuck in an address that we might
          not have access to right now.
        </div>
        <div>There's a 0.1% chance of this happening</div>
      </div>
      <Crafter mode="reinscribe" />
    </>
  );
}

export default page;
