import { ICbrcToken } from "@/types/CBRC";
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
import { shortenString } from "@/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";
import { IInscribeOrder } from "@/types";
import moment from "moment";
type HeroProps = {
  orders: IInscribeOrder[];
  loading: boolean;
};
function OrderList({ orders, loading }: HeroProps) {
  const handleListingClick = (id: string) => {
    window.open(`https://mempool.space/tx/${id}`, "_blank");
  };

  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
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
                Fee (in sats)
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
                          {item.inscriptionCount}
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
                        {item.chain_fee + item.service_fee} Sats
                      </TableCell>
                      <TableCell
                        sx={{
                          textAlign: "center",
                          color: "white",
                        }}
                      >
                        <div className="center">
                          {moment(item.createdAt).fromNow()}
                        </div>
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
