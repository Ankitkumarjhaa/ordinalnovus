"use client";
import CustomNotification from "@/components/elements/CustomNotification";
import React, { useCallback, useEffect } from "react";
import Logo from "./Logo";
import Search from "./Search";
import { ConnectMultiButton, Notification } from "bitcoin-wallet-adapter";
import Link from "next/link";

import { usePathname } from "next/navigation";
import { fetchFees, getBTCPriceInDollars } from "@/utils";
import { setBTCPrice } from "@/stores/reducers/generalReducer";
import { useDispatch } from "react-redux";
import path from "path";
const additionalItems = [
  <Link key={"dashboard"} href="/dashboard" shallow>
    <p className="bwa-text-xs">Dashboard</p>
  </Link>,
];
function Header() {
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
  return (
    <div className="fixed bg-primary w-full left-0 right-0 top-0 z-[999] flex justify-center lg:justify-between items-center flex-wrap py-6 px-6 lg:px-24 max-w-7xl mx-auto ">
      <CustomNotification />
      <Notification />
      <Logo />
      {pathname !== "/search" && <Search />}
      <div className="flex justify-end">
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
