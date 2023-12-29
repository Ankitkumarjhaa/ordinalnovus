import { IToken } from "@/types/CBRC";
import { useRouter } from "next/navigation";
import React from "react";

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
import { FaChevronCircleDown, FaChevronCircleUp } from "react-icons/fa";
import { formatNumber } from "@/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";

type HeroProps = {
  tokens: IToken[];
  loading: boolean;
};
function TokenList({ tokens, loading }: HeroProps) {
  const router = useRouter();

  const handleListingClick = (id: string) => {
    router.push(`/cbrc-20/${id}`);
  };

  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );

  const allowed_cbrcs = useSelector(
    (state: RootState) => state.general.allowed_cbrcs
  );
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
        <Table sx={{ minWidth: 650 }} aria-label="cbrc-20 table">
          <TableHead sx={{ bgcolor: "#84848a", color: "white" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                TICKER
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                STATUS
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                PRICE
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                24H %
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                7D %
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                MARKET CAP
              </TableCell>
              {/* <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                VOLUME (24h)
              </TableCell> */}
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                SUPPLY
              </TableCell>
            </TableRow>
          </TableHead>
          <>
            {tokens && tokens.length ? (
              <TableBody sx={{ color: "white" }}>
                {tokens?.map((item: IToken) => {
                  const price = ((item?.price || 0) / 100_000_000) * btcPrice; // in $
                  // if (allowed_cbrcs?.includes(item.checksum))
                  return (
                    <TableRow
                      onClick={() => handleListingClick(item.tick)}
                      key={item.tick}
                      sx={{
                        bgcolor: allowed_cbrcs?.includes(item.checksum)
                          ? ""
                          : "#4d4d4d",
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
                          textAlign: "left",
                          color: "white",
                          textTransform: "uppercase",
                        }}
                      >
                        <p className="text-left uppercase">{item.tick}</p>
                      </TableCell>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          textAlign: "left",
                          color: "white",
                          textTransform: "uppercase",
                        }}
                      >
                        <p className="text-left uppercase">
                          {allowed_cbrcs?.includes(item.checksum)
                            ? "Enabled"
                            : "Disabled"}
                        </p>
                      </TableCell>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          textAlign: "center",
                          color: "white",
                        }}
                      >
                        <p className="text-center">
                          soon...
                          {/* {" "}
                          {price
                            ? `$${
                                price < 1 ? price.toFixed(6) : price.toFixed(2)
                              }`
                            : " - "} */}
                        </p>
                      </TableCell>
                      <TableCell sx={{ color: "white", textAlign: "center" }}>
                        {/* {item.historicalData?.length ? (
                          (price - item.historicalData[0].price) /
                            item.historicalData[0].price >=
                          0 ? (
                            <div className="flex items-center justify-center text-green-400 ">
                              {" "}
                              <FaChevronCircleUp className="mr-2" />
                              {`${(
                                ((price - item.historicalData[0].price) /
                                  item.historicalData[0].price) *
                                100
                              ).toFixed(2)}%`}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center text-red-400">
                              <FaChevronCircleDown className=" mr-2" />
                              {`${(
                                ((price - item.historicalData[0].price) /
                                  item.historicalData[0].price) *
                                100
                              ).toFixed(2)}%`}
                            </div>
                          )
                        ) : (
                          <> - </>
                        )} */}
                        soon...
                      </TableCell>
                      <TableCell
                        sx={{
                          textAlign: "center",
                          color: "white",
                        }}
                      >
                        {/* {item.historicalData?.length >= 7 ? (
                          (price - item.historicalData[6].price) /
                            item.historicalData[6].price >=
                          0 ? (
                            <div className="flex justify-center items-center text-green-400">
                              <FaChevronCircleUp className="mr-2" />{" "}
                              {item.historicalData?.length >= 7
                                ? `${(
                                    ((price - item.historicalData[6].price) /
                                      item.historicalData[6].price) *
                                    100
                                  ).toFixed(2)}%`
                                : "-"}
                            </div>
                          ) : (
                            <div className="flex justify-center items-center text-red-400">
                              <FaChevronCircleDown className="mr-2" />{" "}
                              {item.historicalData?.length >= 7
                                ? `${(
                                    ((price - item.historicalData[6].price) /
                                      item.historicalData[6].price) *
                                    100
                                  ).toFixed(2)}%`
                                : "-"}
                            </div>
                          )
                        ) : (
                          <> - </>
                        )} */}
                        soon...
                      </TableCell>
                      <TableCell
                        sx={{
                          textAlign: "center",
                          color: "white",
                        }}
                      >
                        {/* <p className="text-center">
                          {item?.historicalData && item.historicalData?.length
                            ? `$ ${formatNumber(item.supply * price)}`
                            : "-"}
                        </p> */}
                        soon...
                      </TableCell>
                      {/* <TableCell
                      sx={{
                        textAlign: "center",
                        color: "white",
                      }}
                    >
                      <p className="text-center">
                        {item?.volume
                          ? `$ ${formatNumber(Number(item?.volume.toFixed(0)))}`
                          : "-"}
                      </p>
                    </TableCell> */}
                      <TableCell
                        sx={{
                          textAlign: "center",
                          color: "white",
                        }}
                      >
                        {formatNumber(item.supply)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            ) : loading ? (
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={7}
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
                    colSpan={7}
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

export default TokenList;
