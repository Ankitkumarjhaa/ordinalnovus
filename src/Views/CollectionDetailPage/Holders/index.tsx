import CustomSearch from "@/components/elements/CustomSearch";
import { ICollection } from "@/types";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import { shortenString } from "@/utils";

type ItemProps = {
  collection: ICollection;
};
function Holders({ collection }: ItemProps) {
  const walletAddress = useWalletAddress();
  const [originalHolders] = useState(collection.holders);
  // Assuming `holders` is an array of your holder objects
  const maxCount =
    Math.max(...collection?.holders.map((holder) => holder.count)) ||
    collection.supply;

  const [holders, setHolders] = useState(collection?.holders || null);
  const [search, setSearch] = useState<string>("");

  const handleSearchChange = (value: string) => {
    setSearch(value);

    if (!value.trim()) {
      setHolders(originalHolders);
      return;
    }

    try {
      const regex = new RegExp(value, "i"); // 'i' for case-insensitive
      const filteredHolders = originalHolders.filter((holder) =>
        regex.test(holder.address)
      );
      setHolders(filteredHolders);
    } catch (error) {
      console.error("Invalid regex:", error);
      // Optionally handle invalid regex error case
    }
  };

  useEffect(() => {
    setHolders(originalHolders);
  }, [originalHolders]);
  return (
    <div className="py-16">
      <div className="w-full lg:pb-0 md:pl-4 lg:w-auto flex justify-between items-center">
        <CustomSearch
          placeholder="Address..."
          value={search}
          onChange={handleSearchChange}
        />
        <p className="pl-2 text-right text-xs">
          updated {moment(collection.holders_check).fromNow()}
        </p>
      </div>
      {holders && holders.length > 0 ? (
        <div className=" my-10 max-h-[50vh] overflow-x-hidden overflow-y-auto small-scrollbar">
          {holders.map((item: { address: string; count: number }) => (
            <div
              key={item.address}
              className=" relative flex justify-between items-center py-2 pr-2  lg:px-6"
            >
              {maxCount && (
                <div
                  className={`${
                    item.address === walletAddress?.cardinal_address ||
                    item.address === walletAddress?.ordinal_address
                      ? "bg-yellow-500 bg-opacity-50"
                      : "bg-gray-500 bg-opacity-10"
                  }  absolute top-0 bottom-0`}
                  style={{
                    width: `${(item.count / maxCount) * 100}%`,
                  }}
                ></div>
              )}

              <p className="hidden lg:block text-xs">{item.address}</p>
              <p className="lg:hidden">{shortenString(item.address)}</p>
              <p>{item.count}</p>
            </div>
          ))}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

export default Holders;
