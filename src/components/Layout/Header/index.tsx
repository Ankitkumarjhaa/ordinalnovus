"use client";
import CustomNotification from "@/components/elements/CustomNotification";
import React from "react";
import Logo from "./Logo";
import Search from "./Search";
import { ConnectMultiButton, Notification } from "bitcoin-wallet-adapter";
import Link from "next/link";

const additionalItems = [
  <Link key={"dashboard"} href="/dashboard" shallow>
    <p className="bwa-text-xs">Dashboard</p>
  </Link>,
];
function index() {
  return (
    <div className="fixed bg-primary w-full left-0 right-0 top-0 z-[999] flex justify-center lg:justify-between items-center flex-wrap py-6 px-6 lg:px-24 max-w-7xl mx-auto ">
      <CustomNotification />
      <Notification />
      <Logo />
      <Search />
      <div className="flex justify-end">
        <ConnectMultiButton
          additionalMenuItems={additionalItems}
          buttonClassname="bg-accent text-white px-4 py-2 rounded center "
        />
      </div>
    </div>
  );
}

export default index;
