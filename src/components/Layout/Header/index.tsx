"use client";
import CustomNotification from "@/components/elements/CustomNotification";
import React, { useCallback, useEffect } from "react";
import Logo from "./Logo";
import Search from "./Search";
import {
  ConnectMultiButton,
  Notification,
  useWalletAddress,
} from "bitcoin-wallet-adapter";
import Link from "next/link";

import { usePathname } from "next/navigation";
import { fetchFees, getBTCPriceInDollars } from "@/utils";
import { setBTCPrice } from "@/stores/reducers/generalReducer";
import { useDispatch } from "react-redux";
import mixpanel from "mixpanel-browser";
import { CollectWallet } from "@/apiHelper/collectWalletHelper";
const additionalItems = [
  <Link key={"dashboard"} href="/dashboard" shallow>
    <p className="bwa-text-xs">Dashboard</p>
  </Link>,
];
function Header() {
  const walletDetails = useWalletAddress();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const getBTCPrice = useCallback(async () => {
    const price = await getBTCPriceInDollars();
    dispatch(setBTCPrice(price));
  }, [dispatch]);

  useEffect(() => {
    getBTCPrice();
    fetchFees(dispatch);
  }, [dispatch, getBTCPrice]);

  async function collectWalletDetails() {
    if (walletDetails && walletDetails.wallet)
      await CollectWallet({
        ordinal_address: walletDetails.ordinal_address,
        cardinal_address: walletDetails.cardinal_address,
        wallet: walletDetails.wallet,
      });
  }

  useEffect(() => {
    if (walletDetails && walletDetails.connected) {
      collectWalletDetails();
      // Identify the user with Mixpanel
      mixpanel.identify(walletDetails.ordinal_address);

      // Set user profile properties
      mixpanel.people.set({
        name: walletDetails.ordinal_address,
        ordinal_address: walletDetails.ordinal_address,
        cardinal_address: walletDetails.cardinal_address,
        wallet: walletDetails.wallet,
        // Additional properties
      });

      // Track wallet connection event
      mixpanel.track("Wallet Connected", {
        "Ordinal Address": walletDetails.ordinal_address,
        "Cardinal Address": walletDetails.cardinal_address,
        // Event-specific properties
      });
    }
  }, [walletDetails]);

  return (
    <div className="fixed bg-primary w-full left-0 right-0 top-0 z-[999] flex justify-center lg:justify-between items-center flex-wrap py-6 px-6 max-w-screen-2xl mx-auto ">
      <CustomNotification />
      <Notification />
      <Logo />
      {pathname !== "/search" && <Search />}
      <div className="w-full lg:w-auto flex justify-center lg:justify-end">
        <ConnectMultiButton
          additionalMenuItems={additionalItems}
          buttonClassname="bg-accent text-white px-4 py-2 rounded center "
          headingClass="text-white font-bold capitalize text-3xl"
          modalContainerClass="bg-black rounded-xl h-screen bg-opacity-75 center"
          modalContentClass="bg-primary border-2 border-accent p-6 min-w-[50%] shadow-xl rounded-xl relative"
        />
      </div>
    </div>
  );
}

export default Header;
