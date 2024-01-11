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
import { MdDashboard } from "react-icons/md";
import { usePathname } from "next/navigation";
import { fetchFees, getBTCPriceInDollars } from "@/utils";
import { setAllowedCbrcs, setBTCPrice } from "@/stores/reducers/generalReducer";
import { useDispatch, useSelector } from "react-redux";
import mixpanel from "mixpanel-browser";
import { CollectWallet } from "@/apiHelper/collectWalletHelper";
import { fetchAllowed } from "@/apiHelper/fetchAllowed";
import moment from "moment";
import { RootState } from "@/stores";
import CustomButton from "@/components/elements/CustomButton";
const additionalItems = [
  <Link key={"dashboard"} href="/dashboard" shallow>
    <div className="flex items-center">
      <MdDashboard />
      <p className="bwa-text-xs bwa-ml-2">Dashboard</p>
    </div>
  </Link>,
];
function Header() {
  const fees = useSelector((state: RootState) => state.general.fees);
  const walletDetails = useWalletAddress();
  const pathname = usePathname();
  const dispatch = useDispatch();
  const getBTCPrice = useCallback(async () => {
    // console.log("Getting new BTC Price...");
    const price = await getBTCPriceInDollars();
    console.log({ price: price });
    if (price) dispatch(setBTCPrice(price));
  }, [dispatch]);

  const fetchAllowedTokensChecksum = useCallback(async () => {
    const allowed = await fetchAllowed();
    dispatch(setAllowedCbrcs([...allowed, "63706e6b"]));
  }, [dispatch]);

  async function collectWalletDetails() {
    if (walletDetails && walletDetails.wallet)
      await CollectWallet({
        ordinal_address: walletDetails.ordinal_address,
        cardinal_address: walletDetails.cardinal_address,
        ordinal_pubkey: walletDetails.ordinal_pubkey,
        cardinal_pubkey: walletDetails.cardinal_pubkey,
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

  useEffect(() => {
    // Function to fetch fees and other data
    const fetchData = () => {
      fetchFees(dispatch);
      getBTCPrice();
      fetchAllowedTokensChecksum();
    };

    // Call the function immediately when the component mounts
    fetchData();

    // Set up an interval to call the function every minute (60000 milliseconds)
    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    // Clear the interval when the component is unmounted
    return () => clearInterval(interval);
  }, [dispatch]); // Add other dependencies if necessary

  return (
    <div className="fixed bg-primary w-full left-0 right-0 top-0 z-[999] flex justify-center lg:justify-between items-center flex-wrap py-6 px-6 max-w-screen-2xl mx-auto ">
      <CustomNotification />
      <Notification />
      <Logo />
      <Search />
      <div className="w-full lg:w-auto flex justify-center lg:justify-end">
        {/* <CustomButton
          text="Crafter"
          bgColor="bg-indigo-600"
          hoverBgColor="hover:bg-indigo-800"
          href={`/crafter`}
          link={true}
          className="mr-2"
        /> */}
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
