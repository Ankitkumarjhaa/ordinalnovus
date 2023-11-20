"use client";
import Link from "next/link";
import React from "react";
import { FaCopy, FaDiscord, FaTwitter } from "react-icons/fa";
import Image from "next/image";
import { shortenString } from "@/utils";
import copy from "copy-to-clipboard";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { useDispatch } from "react-redux";
function Footer() {
  const dispatch = useDispatch();
  return (
    <footer>
      <div className="flex justify-between flex-wrap items-start py-36 lg:py-12 px-6 lg:px-24 max-w-7xl mx-auto relative">
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
          <Link shallow href="/collection">
            <p>Collection</p>
          </Link>

          <Link shallow href="/developer">
            <p>Developer</p>
          </Link>
        </div>
        <div className="socials w-full md:w-6/12 lg:w-4/12  pb-6 lg:pb-0">
          <p className="underline font-bold pb-6">Follow Us</p>
          <ul className="flex justify-start items-center text-2xl">
            <li className="pr-6">
              <a href="https://discord.gg/Wuy45UfxsG" target={"#"}>
                <FaDiscord />
              </a>
            </li>
            <li>
              <a href="https://twitter.com/OrdinalNovus" target={"#"}>
                <FaTwitter />
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="w-full bg-primary-dark">
        <div className=" py-12 lg:py-3 px-6 lg:px-24 max-w-7xl mx-auto relative center">
          <p>Donate with ❤️ on </p>
          <div
            onClick={() => {
              copy("bc1qhg8828sk4yq6ac08rxd0rh7dzfjvgdch3vfsm4");
              dispatch(
                addNotification({
                  id: new Date().valueOf(),
                  message: "Copied donation address",
                  open: true,
                  severity: "success",
                })
              );
            }}
            className="mx-3 flex cursor-pointer items-center justify-center bg-secondary py-2 px-4 rounded-xl"
          >
            <p className="">
              {shortenString("bc1qhg8828sk4yq6ac08rxd0rh7dzfjvgdch3vfsm4")}{" "}
            </p>
            <p className="ml-3 text-yellow-500">
              <FaCopy />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;