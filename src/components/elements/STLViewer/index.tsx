import React, { useState } from "react";
//@ts-ignore
import { StlViewer } from "react-stl-file-viewer";
function STL({ url }: { url: string }) {
  // console.log(url, "STL_URL");
  const [volume, setvolume] = useState(0);
  return (
    <StlViewer
      width={500}
      height={500}
      url={url}
      groundColor="rgb(255, 255, 255)"
      objectColor="rgb(137, 137, 137)"
      skyboxColor="rgb(255, 255, 255)"
      gridLineColor="rgb(0, 0, 0)"
      lightColor="rgb(255, 255, 255)"
      volume={setvolume}
    />
  );
}

export default STL;
