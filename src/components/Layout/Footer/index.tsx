"use client";
import Link from "next/link";
import React from "react";
import { FaDiscord } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import Image from "next/image";
import { useDispatch } from "react-redux";
import mixpanel from "mixpanel-browser";
import { RiNftFill } from "react-icons/ri";
function Footer() {
  const dispatch = useDispatch();
  function handleSocialClick(platform: string, url: string) {
    mixpanel.track("Social Media Click", {
      referrer: document.referrer,
      platform: platform,
      url,
      collection: "ordinalnovus", // Additional properties
    });
  }
  return (
    <footer>
      <div className="flex justify-between flex-wrap items-start py-36 lg:py-12 px-6 max-w-screen-2xl mx-auto relative">
        <div className="logoSection w-full md:w-6/12 lg:w-4/12  pb-6 lg:pb-0">
          <div className="flex items-center justify-start pb-3">
            <Image
              src="/logo_default.png"
              width={50}
              height={50}
              alt={""}
              className="mr-3"
            />
            <div className="font-black uppercase leading-4 text-xl">
              <p className="text-accent ">Ordinal</p>
              <p className="text-2xl tracking-wider text-white">Novus</p>
            </div>
          </div>
          <div className="w-8/12">
            <p className="text-light_gray text-xs">
              Explore, trade, and showcase unique Bitcoin-based ordinals and
              inscriptions on OrdinalNovus, the ultimate platform for NFT
              enthusiasts, collectors, and creators.
            </p>
          </div>
        </div>
        <div className="LinksSection w-full md:w-6/12 lg:w-4/12  pb-6 lg:pb-0">
          <p className="underline font-bold pb-6">Links</p>
          <div>
            <div>
              <Link shallow href="/collection">
                <span className="hover:text-white">Collection</span>
              </Link>
            </div>

            <div>
              <Link shallow href="/developer">
                <span className="hover:text-white">Developer</span>
              </Link>
            </div>

            <div>
              <Link shallow href="/crafter">
                <span className="hover:text-white">Crafter</span>
              </Link>
            </div>

            <div>
              <Link shallow href="/reinscribe">
                <span className="hover:text-white">Reinscribe</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="socials w-full md:w-6/12 lg:w-4/12  pb-6 lg:pb-0">
          <p className="underline font-bold pb-6">Follow Us</p>
          <ul className="flex justify-start items-center text-2xl">
            <li className="pr-6">
              <a
                onClick={() =>
                  handleSocialClick("discord", "https://discord.gg/Wuy45UfxsG")
                }
                href="https://discord.gg/Wuy45UfxsG"
                target={"#"}
              >
                <FaDiscord />
              </a>
            </li>
            <li>
              <a
                onClick={() =>
                  handleSocialClick("x", "https://x.com/OrdinalNovus")
                }
                href="https://x.com/OrdinalNovus"
                target={"#"}
              >
                <FaXTwitter />
              </a>
            </li>
          </ul>
        </div>
      </div>
      {/* <div className="w-full bg-primary-dark ">
        <div className=" py-12 lg:py-3 px-6 lg:px-24 max-w-7xl mx-auto relative center flex flex-wrap justify-center items-center">
          <p className="w-full md:w-auto text-center">Donate with ❤️ on </p>
          <div
            onClick={() => {
              copy("bc1qhg8828sk4yq6ac08rxd0rh7dzfjvgdch3vfsm4");
              dispatch(
                addNotification({
                  id: new Date().valueOf(),
                  message: "Copied BTC donation address",
                  open: true,
                  severity: "success",
                })
              );
            }}
            className="mx-3 flex cursor-pointer items-center justify-center bg-secondary py-2 px-4 rounded-xl w-full md:w-auto"
          >
            <p className="mr-3 text-yellow-500">
              <FaBitcoin />
            </p>
            <p className="">
              {shortenString("bc1qhg8828sk4yq6ac08rxd0rh7dzfjvgdch3vfsm4")}{" "}
            </p>
            <p className="ml-3 text-yellow-500">
              <FaCopy />
            </p>
          </div>
          <div
            onClick={() => {
              copy(
                "bc1pe3j6wuwgc6xw7f6dtz36amn4u9fgg4cp3j2as6h5qvnhgff9qw2qhs6wzr"
              );
              dispatch(
                addNotification({
                  id: new Date().valueOf(),
                  message: "Copied Inscription donation address",
                  open: true,
                  severity: "success",
                })
              );
            }}
            className="mx-3 flex cursor-pointer items-center justify-center bg-secondary py-2 px-4 rounded-xl w-full md:w-auto"
          >
            <p className="mr-3 text-yellow-500">
              <RiNftFill />
            </p>
            <p className="">
              {shortenString(
                "bc1pe3j6wuwgc6xw7f6dtz36amn4u9fgg4cp3j2as6h5qvnhgff9qw2qhs6wzr"
              )}{" "}
            </p>
            <p className="ml-3 text-yellow-500">
              <FaCopy />
            </p>
          </div>
        </div>
      </div> */}
      {/* <div className="w-full my-2 text-xs py-2 uppercase font-bold text-white text-center">
        <p
          className={`text-bitcoin bg-secondary  py-2 w-full tracking-widest font-bold`}
        >
          *only {`<600`} sats for identifying tx is charged
        </p>
      </div> */}
    </footer>
  );
}

export default Footer;
