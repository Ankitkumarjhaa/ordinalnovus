"use client";
import React from "react";
import { ConnectMultiButton, Notification } from "bitcoin-wallet-adapter";
import CustomNotification from "./CustomNotification";
function Header() {
  return (
    <div>
      <div className="flex justify-end">
        <ConnectMultiButton buttonClassname="bg-accent text-white px-4 py-2 rounded center " />
      </div>
      <Notification />
      <CustomNotification />
    </div>
  );
}

export default Header;
