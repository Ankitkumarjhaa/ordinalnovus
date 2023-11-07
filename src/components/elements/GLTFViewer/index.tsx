//@ts-nocheck
import React from "react";
function GLTF({ url }: { url: string }) {
  return (
    <model-viewer
      camera-controls={true}
      src={url}
      auto-rotate={true}
      touchAction="pan-y"
    ></model-viewer>
  );
}

export default GLTF;
