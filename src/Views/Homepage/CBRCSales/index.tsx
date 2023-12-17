"use client";
import React, { useCallback, useEffect, useState } from "react";
import { FetchCBRC } from "@/apiHelper/getCBRC";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { useDispatch, useSelector } from "react-redux";
import { Icbrc } from "@/types/CBRC";
import {
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import CustomPaginationComponent from "@/components/elements/CustomPagination";
import { useRouter } from "next/navigation";
import CustomSearch from "@/components/elements/CustomSearch";

import { FaHome, FaSearch } from "react-icons/fa";
import mixpanel from "mixpanel-browser";
import { ITransaction } from "@/types";
import { fetchTxes } from "@/apiHelper/fetchTxes";
import moment from "moment";
import { RootState } from "@/stores";

import { FaBitcoin, FaDollarSign } from "react-icons/fa";
import { shortenString } from "@/utils";
function CBRCSales() {
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );
  const dispatch = useDispatch();
  const [data, setData] = useState<Icbrc[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [page_size, setPage_size] = useState(21);
  const router = useRouter();

  const [sort, setSort] = useState<string>("creation:1");
  const [txs, setTxs] = useState<ITransaction[] | null>(null);

  const fetchTxData = useCallback(async () => {
    const result = await fetchTxes({
      parsed: true,
      metaprotocol: "transfer",
      sort: "timestamp:-1",
      page_size: 500,
      page: 1,
      tag: "sale",
    });

    if (!result) {
    } else if (result && result.data) {
      setTxs(result.data.txes);
      // setTotalCount(result.data.pagination.total);
    }
  }, []);

  useEffect(() => {
    fetchTxData();
  }, []);

  const handleTxClick = (txid: string) => {
    window.open(`https://mempool.space/tx/${txid}`, "_blank");
  };

  return (
    <section className="pt-16 w-full">
      {txs && txs?.length ? (
        <div className="pt-16">
          <h3 className=" py-2 text-3xl font-bold text-white">
            Cyborg BRC-20 Protocol Sales
          </h3>
          <TableContainer
            component={Paper}
            sx={{
              bgcolor: "#3d0263",
              color: "white",
              border: "3px",
              borderColor: "#3d0263",
            }}
          >
            <Table
              size={"small"}
              sx={{ minWidth: 650 }}
              aria-label="cbrc-20 table"
            >
              <TableHead sx={{ bgcolor: "#84848a", color: "white" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    TICK
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    FROM
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    TO
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
                </TableRow>
              </TableHead>
              <>
                {txs && txs.length ? (
                  <TableBody sx={{ bgcolor: "#3d0263", color: "white" }}>
                    {txs?.map((item: ITransaction) => {
                      const op = item.parsed_metaprotocol[1];
                      const tokenAmt = item.parsed_metaprotocol[2];
                      const token = tokenAmt.includes("=")
                        ? tokenAmt.split("=")[0]
                        : "";
                      const amount = tokenAmt.includes("=")
                        ? Number(tokenAmt.split("=")[1])
                        : 0;
                      if (item.parsed_metaprotocol[0] === "cbrc-20")
                        return (
                          <TableRow
                            onClick={() => handleTxClick(item.txid)}
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
                              {token}
                            </TableCell>
                            <TableCell sx={{ color: "white" }}>
                              {shortenString(item.from)}
                            </TableCell>{" "}
                            <TableCell sx={{ color: "white" }}>
                              {shortenString(item.to)}
                            </TableCell>
                            <TableCell sx={{ color: "white" }}>
                              <div>
                                <div className="flex items-center pb-1">
                                  <div className="mr-2 text-bitcoin">
                                    <FaBitcoin className="" />
                                  </div>
                                  {(item.price / 100_000_000).toFixed(5)}{" "}
                                </div>
                                <div className="flex items-center ">
                                  <div className="mr-2 text-green-500">
                                    <FaDollarSign className="" />
                                  </div>
                                  {(
                                    (item.price / 100_000_000) *
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
                                  {(item.price / amount / 100_000_000).toFixed(
                                    5
                                  )}{" "}
                                </div>
                                <div className="flex items-center ">
                                  <div className="mr-2 text-green-500">
                                    <FaDollarSign className="" />
                                  </div>
                                  {(
                                    (item.price / amount / 100_000_000) *
                                    btcPrice
                                  ).toFixed(2)}{" "}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell sx={{ color: "white" }}>
                              {amount}
                            </TableCell>
                            <TableCell sx={{ color: "white" }}>
                              <div className="flex justify-start items-center">
                                {moment(item.timestamp).fromNow()}{" "}
                                {item?.marketplace === "ordinalnovus" && (
                                  <FaHome className="ml-3" />
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                    })}
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
      ) : (
        <></>
      )}
    </section>
  );
}

export default CBRCSales;
