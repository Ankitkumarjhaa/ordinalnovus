// app/components/NavigationEvents.js

"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import mixpanel from "mixpanel-browser";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import initMixpanel from "@/lib/mixpanelConfig";
import { useParams } from "next/navigation";

export function NavigationEvents() {
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const walletDetails = useWalletAddress();

  useEffect(() => {
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
        case pathname === "/cbrc-20":
          pageName = "CBRC";
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
        case pathname.startsWith("/cbrc-20/"):
          pageName = "CBRC 20 Token";
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
