import { RootState } from "@/stores";
import { IInscription } from "@/types";
import { Icbrc } from "@/types/CBRC";
import {
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import moment from "moment";
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
    <div className="py-2">
      <TableContainer
        component={Paper}
        sx={{
          bgcolor: "#3d0263",
          color: "white",
          border: "3px",
          borderColor: "#3d0263",
        }}
      >
        <Table size={"small"} sx={{ minWidth: 650 }} aria-label="cbrc-20 table">
          <TableHead sx={{ bgcolor: "#84848a", color: "white" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                TOKEN
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                INSCRIPTION #
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                PRICE (TOTAL)
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                PRICE (PER TOKEN)
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                AMOUNT
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                TIMESTAMP
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                STATUS
              </TableCell>
            </TableRow>
          </TableHead>
          <>
            {listings && listings.length ? (
              <TableBody sx={{ bgcolor: "#3d0263", color: "white" }}>
                {listings?.map((item: IInscription) => {
                  if (!item.parsed_metaprotocol || !item.listed_price) {
                    console.log({
                      item,
                      msg: " NOT SHOWING THIS because parsed_metaprotocol or listed_price are missing",
                    });
                    return <></>;
                  }
                  const op = item.parsed_metaprotocol[1];
                  const tokenAmt = item.parsed_metaprotocol[2];
                  const token = tokenAmt?.includes("=")
                    ? tokenAmt.split("=")[0]
                    : "";
                  const amount = tokenAmt?.includes("=")
                    ? Number(tokenAmt.split("=")[1])
                    : 0;
                  if (item.parsed_metaprotocol[0] === "cbrc-20")
                    return (
                      <TableRow
                        onClick={() =>
                          item.in_mempool
                            ? handleMempoolClick(item.txid)
                            : handleListingClick(item.inscription_id)
                        }
                        key={item.txid}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                          "&:hover": { bgcolor: "#1f1d3e" },
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{
                            color: "white",
                            textTransform: "uppercase",
                          }}
                        >
                          <div className="center ">
                            <p>{token}</p>
                          </div>
                        </TableCell>
                        <TableCell sx={{ color: "white" }}>
                          <div className="center ">
                            <p>#{item.inscription_number}</p>
                            <div className="ml-3">
                              {item.cbrc_valid ? (
                                <FaCheckCircle className="text-green-400" />
                              ) : (
                                <IoIosWarning className="text-red-400" />
                              )}
                            </div>
                          </div>
                        </TableCell>{" "}
                        <TableCell sx={{ color: "white" }}>
                          <div>
                            <div className="flex items-center pb-1">
                              <div className="mr-2 text-bitcoin">
                                <FaBitcoin className="" />
                              </div>
                              {(item.listed_price / 100_000_000).toFixed(5)}{" "}
                            </div>
                            <div className="flex items-center ">
                              <div className="mr-2 text-green-500">
                                <FaDollarSign className="" />
                              </div>
                              {(
                                (item.listed_price / 100_000_000) *
                                btcPrice
                              ).toFixed(2)}{" "}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell sx={{ color: "white" }}>
                          <div>
                            <div className="flex items-center pb-1">
                              <div className="mr-2 text-bitcoin">
                                <FaBitcoin className="" />
                              </div>
                              {(
                                item.listed_price /
                                amount /
                                100_000_000
                              ).toFixed(5)}{" "}
                            </div>
                            <div className="flex items-center ">
                              <div className="mr-2 text-green-500">
                                <FaDollarSign className="" />
                              </div>
                              {(
                                (item.listed_price / amount / 100_000_000) *
                                btcPrice
                              ).toFixed(2)}{" "}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell sx={{ color: "white" }}>{amount}</TableCell>
                        <TableCell sx={{ color: "white" }}>
                          {moment(item.listed_at).fromNow()}{" "}
                        </TableCell>
                        <TableCell sx={{ color: "white" }}>
                          {item.in_mempool ? "In Mempool" : "Buy Now"}
                        </TableCell>
                      </TableRow>
                    );
                  else {
                    console.log({
                      item,
                      msg: " NOT SHOWING THIS because parsed_metaprotocol[0] is not cbrc-20",
                    });
                    return <></>;
                  }
                })}
              </TableBody>
            ) : loading ? (
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={4}
                    style={{ textAlign: "center", color: "white" }}
                  >
                    <CircularProgress color="inherit" size={40} />
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={4}
                    style={{ textAlign: "center", color: "white" }}
                  >
                    No DATA Found
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </>
        </Table>
      </TableContainer>
    </div>
  );
}

export default CbrcListings;
