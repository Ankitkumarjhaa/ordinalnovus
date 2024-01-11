//@ts-nocheck

"use client";
import "@google/model-viewer";
import React from "react";
function GLTF({ url }: { url: string }) {
  // console.log({ url });
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
