import Link from "next/link";
import React from "react";
import Image from "next/image";
function index() {
  return (
    <Link href="/" shallow>
      <div className="w-full lg:w-auto  flex items-center justify-start  pb-6 lg:pb-0">
        <div className="">
          <Image
            src="/logo_default.png"
            width={50}
            height={50}
            alt={""}
            className="mr-3"
          />
        </div>
        <div className="font-black uppercase leading-4 text-lg">
          <p className="text-accent ">Ordinal</p>
          <p className="text-xl tracking-wider text-white">Novus</p>
        </div>
      </div>
    </Link>
  );
}

export default index;
