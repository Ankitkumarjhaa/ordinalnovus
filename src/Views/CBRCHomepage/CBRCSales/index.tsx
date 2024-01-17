"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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

import CustomSearch from "@/components/elements/CustomSearch";

import { FaHome, FaSearch } from "react-icons/fa";
import { IInscription, ITransaction } from "@/types";
import { fetchTxes } from "@/apiHelper/fetchTxes";
import moment from "moment";
import { RootState } from "@/stores";

import { FaBitcoin, FaDollarSign } from "react-icons/fa";
import { shortenString } from "@/utils";
import CustomSelector from "@/components/elements/CustomSelector";
import InscriptionImage from "./InscriptionImage";

const options = [
  { value: "timestamp:-1", label: "Latest Sales" },
  { value: "price:1", label: "Low Price" },
  { value: "inscription_number:1", label: "Low Number" },
];

function CBRCSales() {
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );
  const dispatch = useDispatch();
  const [data, setData] = useState<IInscription[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page_size, setPage_size] = useState(10);

  const [tick, setTick] = useState("");

  const [sort, setSort] = useState<string>("timestamp:-1");
  const [txs, setTxs] = useState<ITransaction[] | null>(null);

  const fetchTxData = useCallback(async () => {
    setLoading(true);
    setTxs(null);
    const q = {
      parsed: true,
      sort,
      page_size,
      page,
      tag: "sale",
      marketplace: "ordinalnovus",
      ...(tick ? { tick } : { metaprotocol: "transfer" }),
    };
    const result = await fetchTxes(q);

    if (result && result.data) {
      setTxs(result.data.txes);
      setTotalCount(result.data.pagination.total);
    }
    setLoading(false);
  }, [sort, page_size, page, tick]);

  useEffect(() => {
    fetchTxData();
  }, [sort, page_size, page]);

  const handleTxClick = (txid: string) => {
    window.open(`https://mempool.space/tx/${txid}`, "_blank");
  };

  const handleSearchChange = (value: string) => {
    setTick(value);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };
  const convertSatsToBTC = useCallback(
    (sats: number) => {
      // Convert satoshis to BTC and fix the result to 3 decimal places
      return (sats / 100_000_000).toFixed(3);
    },
    [] // No dependencies are needed as the conversion rate is fixed
  );

  const renderPagination = () =>
    txs &&
    txs?.length > 0 && (
      <div className="w-full lg:w-auto center">
        <CustomPaginationComponent
          count={Math.ceil(totalCount / page_size)}
          onChange={handlePageChange}
          page={page}
        />
      </div>
    );

  return (
    <section className="cbrc-sales w-full">
      <div className="SortSearchPages py-6 flex flex-wrap justify-between">
        <div className="w-full lg:w-auto flex justify-start items-center flex-wrap">
          <div className="w-full center pb-4 lg:pb-0 lg:w-auto">
            <CustomSelector
              label="Sort"
              value={sort}
              options={options}
              onChange={setSort}
            />
          </div>
          <div className="w-full center pb-4 lg:pb-0 md:pl-4 lg:w-auto">
            <CustomSearch
              placeholder="Ticker"
              value={tick}
              onChange={handleSearchChange}
              icon={FaSearch}
              end={true}
              onIconClick={fetchTxData}
            />
          </div>
        </div>
        {/* {txs && txs?.length > 0 && (
          <div className="w-full lg:w-auto center">
            <CustomPaginationComponent
              count={Math.ceil(totalCount / page_size)}
              onChange={handlePageChange}
              page={page}
            />
          </div>
        )} */}
        {renderPagination()}
      </div>
      {!txs || !txs?.length ? (
        <>
          {loading ? (
            <div className="text-white center py-16">
              <CircularProgress size={20} color="inherit" />
            </div>
          ) : (
            <p className="min-h-[20vh] center"> No CBRC Sales Found</p>
          )}
        </>
      ) : (
        <div className="pt-3">
          <TableContainer
            component={Paper}
            sx={{
              bgcolor: "transparent",
              color: "white",
              border: "3px",
              borderColor: "rgba(145, 2, 240, 0.50)",
            }}
          >
            <Table
              size={"small"}
              sx={{ minWidth: 650 }}
              aria-label="cbrc-20 table"
            >
              <TableHead
                sx={{ bgcolor: "rgba(145, 2, 240, 0.12)", color: "white" }}
              >
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      color: "#84848a",
                    }}
                  >
                    TICK
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      color: "#84848a",
                    }}
                  >
                    INSCRIPTION
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      color: "#84848a",
                    }}
                  >
                    FROM
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      color: "#84848a",
                    }}
                  >
                    TO
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      color: "#84848a",
                    }}
                  >
                    PRICE (TOTAL)
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      color: "#84848a",
                    }}
                  >
                    PRICE (PER TOKEN)
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      color: "#84848a",
                    }}
                  >
                    AMOUNT
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      color: "#84848a",
                    }}
                  >
                    TIMESTAMP
                  </TableCell>
                </TableRow>
              </TableHead>
              <>
                {txs && txs.length ? (
                  <TableBody sx={{ bgcolor: "", color: "white" }}>
                    {txs?.map((item: ITransaction) => {
                      const op = item.parsed_metaprotocol[1];
                      const tokenAmt = item.parsed_metaprotocol[2];
                      const token = tokenAmt.includes("=")
                        ? tokenAmt.split("=")[0]
                        : "";
                      console.log(txs, "token");
                      const amount = tokenAmt.includes("=")
                        ? Number(tokenAmt.split("=")[1])
                        : 0;
                      if (item.parsed_metaprotocol[0] === "cbrc-20")
                        return (
                          <TableRow
                            onClick={() => handleTxClick(item.txid)}
                            key={item.txid}
                            sx={{
                              "&:last-child td, &:last-child th": {
                                border: "3px",
                                borderColor: "rgba(145, 2, 240, 0.50)",
                              },
                              "&:hover": { bgcolor: "rgba(145, 2, 240, 0.12)" },
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
                              <div className="font-bold"> {token}</div>
                            </TableCell>
                            <TableCell sx={{ color: "white" }}>
                              <InscriptionImage
                                inscriptionId={item.inscriptions[0]}
                              />
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
                                  {(item.price / 100_000_000).toFixed(5)}
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
                                  {/* {(item.price / amount).toFixed(0)} */}
                                  {convertSatsToBTC(item.price)}
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
      )}
      <div className="flex justify-end w-full pt-10">{renderPagination()}</div>
    </section>
  );
}

export default CBRCSales;
