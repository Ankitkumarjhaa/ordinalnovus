import BuyInscriptionCardButton from "@/components/elements/BuyInscriptionCardButton";
import { RootState } from "@/stores";
import { IInscription } from "@/types";
import { formatNumber } from "@/utils";
import { cbrcListed, myInscription } from "@/utils/validate";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import moment from "moment";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { FaBitcoin, FaCheckCircle, FaDollarSign } from "react-icons/fa";
import { IoIosWarning } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
type HeroProps = {
  listings: IInscription[];
  loading: boolean;
};
function CbrcListings({ listings, loading }: HeroProps) {
  const router = useRouter();

  //wallet
  const walletDetails = useWalletAddress();

  const allowed_cbrcs = useSelector(
    (state: RootState) => state.general.allowed_cbrcs
  );
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );
  const dispatch = useDispatch();
  const handleListingClick = (id: string) => {
    router.push(`/inscription/${id}`);
  };
  const handleMempoolClick = (txid: string) => {
    window.open(`https://mempool.space/tx/${txid}`);
  };

  return (
    <div className="py-2 w-full">
      {!loading && listings && listings.length > 0 ? (
        <div className="flex justify-start items-center w-full flex-wrap">
          {listings.map((item: IInscription) => (
            <div
              className="w-full md:w-6/12 lg:w-3/12  p-6"
              key={item.inscription_id}
            >
              <div className="border-2 overflow-hidden border-gray-700 rounded-lg bg-accent bg-opacity-[12%]">
                <div className="TokenDetail p-1">
                  <div className="flex justify-between items-center p-2">
                    <p className="px-2 py-1 rounded tracking-wider bg-dark_gray bg-opacity-30 text-white font-bold uppercase">
                      {item.listed_token}
                    </p>
                    <p className="px-2 py-1 rounded tracking-wider bg-accent_dark text-white">
                      Transfer
                    </p>
                  </div>
                  <p className="text-center font-bold text-2xl py-6 text-white">
                    {formatNumber(item.listed_amount || 0)}
                  </p>

                  {item.listed_amount &&
                    item.listed_token &&
                    item.listed_price &&
                    item.listed_price_per_token && (
                      <>
                        <div className="px-2 text-center">
                          <span className="text-yellow-500 text-xl">
                            {" "}
                            {item.listed_price_per_token.toFixed(0)}{" "}
                          </span>
                          <span>
                            {" sats / "}{" "}
                            <span className="uppercase">
                              {" "}
                              {item.listed_token}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-center py-2">
                          <div className="mr-2 text-green-500">
                            <FaDollarSign className="" />
                          </div>
                          {(
                            (item.listed_price_per_token / 100_000_000) *
                            btcPrice
                          ).toFixed(2)}{" "}
                        </div>
                      </>
                    )}
                </div>
                <div className="ListingDetail  bg-primary p-5">
                  <div className="text-white pb-2 border-b border-gray-600 w-full flex justify-between items-center">
                    <Link href={`/inscription/${item.inscription_number}`}>
                      {" "}
                      <p className="">#{item.inscription_number}</p>
                    </Link>
                    <div className="ml-3">
                      {item.cbrc_valid ? (
                        <FaCheckCircle className="text-green-400" />
                      ) : (
                        <IoIosWarning className="text-red-400" />
                      )}
                    </div>
                  </div>
                  {cbrcListed(item, allowed_cbrcs || []) &&
                    !myInscription(
                      item,
                      walletDetails?.ordinal_address || ""
                    ) &&
                    item.listed_price && (
                      <>
                        <div className="flex justify-between pt-2 items-center">
                          <div className="pt-2 flex justify-between  items-center">
                            <div className="flex items-center text-white pb-1">
                              <div className="mr-2 text-bitcoin">
                                <FaBitcoin className="" />
                              </div>
                              {(item?.listed_price / 100_000_000).toFixed(6)}{" "}
                            </div>
                          </div>
                          <div className="flex items-center text-white">
                            <div className="mr-2 text-green-500">
                              <FaDollarSign className="" />
                            </div>
                            {(
                              (item.listed_price / 100_000_000) *
                              btcPrice
                            ).toFixed(2)}{" "}
                          </div>
                        </div>
                        <BuyInscriptionCardButton data={item} />
                      </>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !loading ? (
        <div>No Data Found</div>
      ) : (
        <>Loading...</>
      )}
    </div>
  );
}

export default CbrcListings;
