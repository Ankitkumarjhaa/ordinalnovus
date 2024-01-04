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
import { formatNumber, shortenString } from "@/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";
import { IInscribeOrder } from "@/types";
import { PayButton } from "bitcoin-wallet-adapter";

type HeroProps = {
  orders: IInscribeOrder[];
  loading: boolean;
};
function OrderList({ orders, loading }: HeroProps) {
  const router = useRouter();

  const handleListingClick = (id: string) => {
    window.open(`https://mempool.space/tx/${id}`, "_blank");
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
                Order ID
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                Files
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                Fee
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                Status
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                Fee-Rate
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <>
            {orders && orders.length ? (
              <TableBody sx={{ color: "white" }}>
                {orders?.map((item: IInscribeOrder) => {
                  return (
                    <TableRow
                      key={item._id}
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        "&:hover": { bgcolor: "#1f1d3e" },
                        color: "white",
                        cursor: "pointer",
                      }}
                      onClick={() => item.txid && handleListingClick(item.txid)}
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
                        <p className="text-left uppercase">
                          {shortenString(item.order_id)}
                        </p>
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
                          {item.inscriptions.length}
                        </p>
                      </TableCell>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          textAlign: "center",
                          color: "white",
                          textTransform: "uppercase",
                        }}
                      >
                        <p className="text-center">
                          {" "}
                          ${" "}
                          {(
                            ((item.service_fee + item.chain_fee) /
                              100_000_000) *
                            btcPrice
                          ).toFixed(2)}
                        </p>
                      </TableCell>
                      <TableCell sx={{ color: "white", textAlign: "center" }}>
                        {item.status}
                      </TableCell>
                      <TableCell
                        sx={{
                          textAlign: "center",
                          color: "white",
                        }}
                      >
                        {item.fee_rate} sats/vB
                      </TableCell>
                      <TableCell
                        sx={{
                          textAlign: "center",
                          color: "white",
                        }}
                      >
                        {item.status === "payment pending" ? (
                          <div className="center">
                            <PayButton
                              receipient={item.funding_address}
                              amount={item.service_fee + item.chain_fee}
                              buttonClassname="bg-accent text-white px-4 py-2 rounded center "
                            />
                          </div>
                        ) : (
                          "-"
                        )}
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

export default OrderList;
