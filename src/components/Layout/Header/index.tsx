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
import { fetchFees, getBTCPriceInDollars, shortenString } from "@/utils";
import {
  setAllowedCbrcs,
  setBTCPrice,
  setBalanceData,
} from "@/stores/reducers/generalReducer";
import { useDispatch, useSelector } from "react-redux";
import mixpanel from "mixpanel-browser";
import { CollectWallet } from "@/apiHelper/collectWalletHelper";
import { fetchAllowed } from "@/apiHelper/fetchAllowed";
import { RootState } from "@/stores";
import {
  FaDiscord,
  FaFaceFrown,
  FaFaceGrinStars,
  FaFaceMeh,
  FaFaceSadCry,
  FaFaceSmile,
  FaFaceSmileWink,
  FaXTwitter,
} from "react-icons/fa6";
import { Popover } from "@mui/material";
import { fetchBalance } from "@/apiHelper/fetchBalance";

function Header() {
  const balanceData = useSelector(
    (state: RootState) => state.general.balanceData
  );

  const walletDetails = useWalletAddress();
  const dispatch = useDispatch();
  const getBTCPrice = useCallback(async () => {
    // console.log("Getting new BTC Price...");
    const price = await getBTCPriceInDollars();
    console.log({ price: price });
    if (price) dispatch(setBTCPrice(price));
  }, [dispatch]);

  const fetchAllowedTokensChecksum = useCallback(async () => {
    const allowed = await fetchAllowed();
    dispatch(setAllowedCbrcs([...allowed]));
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

  const fetchBalanceData = useCallback(async () => {
    if (walletDetails) {
      console.log("fetching bal...");
      const cacheKey = `walletBalance-${walletDetails.cardinal_address}`;
      const cachedData = localStorage.getItem(cacheKey);
      const now = new Date().getTime();

      if (cachedData) {
        console.log("cache exists in LS -> checking validity");
        const { timestamp } = JSON.parse(cachedData);

        if (now - timestamp < 5 * 60 * 1000) {
          console.log("no need to fetch bal");
          // Less than 5 minutes
          // Use cached data to update state and skip new balance fetch
          const { balance, mempool_balance, dummyUtxos } =
            JSON.parse(cachedData);

          dispatch(setBalanceData({ balance, mempool_balance, dummyUtxos }));
          return; // Exit function early
        } else {
          // Proceed to fetch new balance data
          const result = await fetchBalance({
            address: walletDetails.cardinal_address,
          });
          console.log({ result }, "Fetch Balance");
          if (result && result.data) {
            const { balance, mempool_balance, dummyUtxos } = result.data;
            dispatch(setBalanceData({ balance, mempool_balance, dummyUtxos }));
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                balance,
                mempool_balance,
                timestamp: now,
                dummyUtxos,
              })
            );
          }
        }

        console.log("no cache / expired ", now - timestamp);
      } else {
        // Proceed to fetch new balance data
        const result = await fetchBalance({
          address: walletDetails.cardinal_address,
        });
        if (result && result.data) {
          const { balance, mempool_balance, dummyUtxos } = result.data;
          dispatch(setBalanceData({ balance, mempool_balance, dummyUtxos }));
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              balance,
              mempool_balance,
              timestamp: now,
              dummyUtxos,
            })
          );
        }
      }
    }
  }, [walletDetails]);

  useEffect(() => {
    if (walletDetails && walletDetails.connected) {
      fetchBalanceData();
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
        <ConnectMultiButton
          modalContentClass="bg-primary border rounded-xl border-accent overflow-hidden relative lg:p-16 md:p-12 p-6"
          buttonClassname={` text-white rounded flex items-center px-4 py-1 ${
            walletDetails
              ? "  font-bold bg-accent_dark "
              : " font-light bg-accent"
          }`}
          headingClass="text-center text-white pt-2 pb-2 text-3xl capitalize font-bold mb-4"
          walletItemClass="w-full bg-accent_dark my-3 hover:border-accent border border-transparent cursor-pointer"
          walletLabelClass="text-lg text-white capitalize tracking-wider"
          walletImageClass="w-[30px]"
          InnerMenu={InnerMenu}
          balance={balanceData?.balance}
        />
      </div>
    </div>
  );
}

export default Header;

const Face = ({ balance }: { balance: number }) => {
  let balInBTC = balance / 100_000_000;

  console.log({ balInBTC }, "BTCBAL");

  // Check from the highest threshold down to the lowest
  if (balInBTC >= 0.01) {
    return <FaFaceSmileWink />;
  } else if (balInBTC >= 0.001) {
    return <FaFaceSmile />;
  } else if (balInBTC >= 0.0005) {
    return <FaFaceMeh />;
  } else if (balInBTC >= 0.0001) {
    return <FaFaceFrown />;
  } else if (balInBTC <= 0) {
    return <FaFaceSadCry />;
  } else {
    // For any case not covered above, though technically this branch might never be reached with the current logic
    return <FaFaceGrinStars />;
  }
};

const InnerMenu = ({ anchorEl, open, onClose, disconnect }: any) => {
  const walletDetails = useWalletAddress();

  const balanceData = useSelector(
    (state: RootState) => state.general.balanceData
  );
  if (walletDetails)
    return (
      <Popover
        anchorEl={anchorEl}
        onClose={onClose}
        open={open}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <div className="p-6 bg-primary-dark min-w-[300px] max-w-[400px] relative text-white">
          <div className="intro flex items-center pb-6">
            <div className="mr-2 text-3xl">
              {balanceData ? (
                <Face balance={balanceData.balance} />
              ) : (
                <FaFaceSmileWink />
              )}
            </div>
            <p className="uppercase font-bold text-sm">
              {shortenString(walletDetails.cardinal_address, 5)}
            </p>
          </div>
          <div className="BTCWallet flex items-center pb-6 w-full">
            <div className="mr-2">
              <img
                alt=""
                src="https://pngimg.com/uploads/bitcoin/bitcoin_PNG48.png"
                width={35}
              />{" "}
            </div>
            <div className="flex-1 flex justify-between items-center text-sm">
              <div>
                <p className="font-bold tracking-wider text-white">
                  BTC Wallet
                </p>
                <p className="uppercase">
                  {shortenString(walletDetails.cardinal_address, 5)}
                </p>
              </div>
              {balanceData && (
                <div>
                  <p className="font-bold tracking-wider text-white">
                    {(balanceData.balance / 100_000_000).toFixed(5)} BTC
                  </p>
                  {/* <p className="uppercase font-bold text-sm">
                {shortenString(walletDetails.cardinal_address, 5)}
              </p> */}
                </div>
              )}
            </div>
          </div>
          <div className="OrdinalsWallet flex items-center pb-6 w-full">
            <div className="mr-2">
              <img
                alt=""
                src="https://pngimg.com/uploads/bitcoin/bitcoin_PNG48.png"
                width={35}
              />{" "}
            </div>
            <div className="flex-1 flex justify-between items-center text-sm">
              <div>
                <p className="font-bold tracking-wider text-white">
                  Ordinals Wallet
                </p>
                <p className="uppercase">
                  {shortenString(walletDetails.ordinal_address, 5)}
                </p>
              </div>
            </div>
          </div>
          <div className="relative ">
            <div className="bg-primary rounded cursor-pointer styled-button-wrapper my-2">
              <button
                className="accent_transition p-2 w-full"
                onClick={onClose}
              >
                <Link href="/dashboard">Dashboard</Link>
              </button>
            </div>
          </div>
          <div className="relative ">
            <div className="bg-primary rounded cursor-pointer styled-button-wrapper my-2">
              <button
                className="red_transition p-2 w-full"
                onClick={() => {
                  disconnect();
                  onClose();
                }}
              >
                Disconnect
              </button>
            </div>
          </div>
          <div className="socials flex space-x-3 text-xl relative">
            <div className="relative ">
              <div className="bg-primary rounded cursor-pointer styled-button-wrapper">
                <button className="accent_transition p-2">
                  <FaXTwitter />
                </button>
              </div>
            </div>
            <div className="relative ">
              <button className="bg-primary rounded cursor-pointer  styled-button-wrapper">
                <button className="accent_transition p-2">
                  <FaDiscord />
                </button>
              </button>
            </div>
          </div>
        </div>
      </Popover>
    );
  else <></>;
};
