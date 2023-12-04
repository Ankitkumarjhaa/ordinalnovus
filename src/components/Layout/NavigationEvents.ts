// app/components/NavigationEvents.js

"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import mixpanel from "mixpanel-browser";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import initMixpanel from "@/lib/mixpanelConfig";

export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const walletDetails = useWalletAddress();

  useEffect(() => {
    console.log("initializing_mixpanel_nav_events");
    initMixpanel();
  }, []);

  useEffect(() => {
    let url = `${pathname}`;
    let pageName;

    if (pathname && mixpanel && mixpanel.track) {
      switch (true) {
        case pathname === "/":
          pageName = "Homepage";
          break;
        case pathname === "/search":
          pageName = "Search";
          url = `${pathname}?${searchParams}`;
          break;
        case pathname === "/account":
          pageName = "Account";
          break;
        case pathname === "/collections":
          pageName = "Collections";
          break;
        case pathname.startsWith("/collection/"):
          pageName = "Collection Details";
          break;
        case pathname === "/dashboard":
          pageName = "Dashboard";
          break;
        case pathname === "/developer":
          pageName = "Developer";
          break;
        case pathname === "/inscribe":
          pageName = "Inscribe";
          break;
        case pathname.startsWith("/inscription/"):
          pageName = "Inscription Search";
          break;
        case pathname.startsWith("/sat/"):
          pageName = "Sat Search";
          break;
        default:
          pageName = "Unknown Page";
      }
      mixpanel.track("Page Viewed", {
        page: pageName,
        url: url,
        wallet: walletDetails?.ordinal_address,
        // Additional properties can be added here
      });
    }
  }, [pathname, searchParams]);

  return null;
}
