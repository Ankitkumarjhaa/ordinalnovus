"use client"; // Error components must be Client components

import mixpanel from "mixpanel-browser";
import { useEffect } from "react";
import { FaDiscord, FaGlobe } from "react-icons/fa";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting serv            ice
    console.error(error);

    // Mixpanel Error Tracking
    mixpanel.track("Error", {
      message: error.message,
      tag: "collection search error",
      // Additional properties if necessary
    });
  }, [error]);

  return (
    <div className="text-white pt-16 h-[70vh] center">
      <div>
        <div className=" center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="100"
            height="100"
            fill="currentColor"
          >
            <path d="M20 2H4a2 2 0 00-2 2v16a2 2 0 002 2h16a2 2 0 002-2V4a2 2 0 00-2-2zm0 2v4H4V4h16zm0 6v4H4v-4h16zm0 6v4H4v-4h16zM6 6a1 1 0 11-2 0 1 1 0 012 0zm0 6a1 1 0 11-2 0 1 1 0 012 0zm0 6a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </div>

        <div className=" flex items-baseline">
          <h2 className="text-center mr-4 uppercase text-4xl pt-6 extrabold">
            Collection Not Found
          </h2>

          <div className="w-6 h-6 bg-red-600 rounded-full animate-glow"></div>
        </div>
        <p className="mb-2 text-center">Contact us to add it </p>

        <div className="center flex-col">
          <div className="flex items-center space-x-2 mb-2">
            <FaDiscord size={24} />
            <a
              href="https://discord.gg/Wuy45UfxsG"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Discord
            </a>
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <FaGlobe size={24} />
            <a
              href="https://ordinalnovus.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
