"use client";
import React, { useCallback, useEffect, useState } from "react";
import { FetchCBRC } from "@/apiHelper/getCBRC";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { useDispatch } from "react-redux";
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

import { FaSearch } from "react-icons/fa";
function CBRC() {
  const dispatch = useDispatch();
  const [data, setData] = useState<Icbrc[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [search, setSearch] = useState("");
  const [page_size, setPage_size] = useState(21);
  const router = useRouter();

  const [sort, setSort] = useState<string>("creation:1");
  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await FetchCBRC({
      offset: (page - 1) * page_size,
      mode: "deploy",
      sort,
      search,
    });

    if (result && result.error) {
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          severity: "error",
          message: result.error,
          open: true,
        })
      );
    } else if (result && result.data) {
      setData(result.data.items);
      setTotalCount(result.data.count);
      setLoading(false);
    }
  }, [page, search, sort]);

  useEffect(() => {
    fetchData();
  }, [sort, page, dispatch]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };
  const handleRowClick = (tick: string) => {
    //@ts-ignore
    router.push(`/cbrc-20/${tick}`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  return (
    <section className="pt-16 w-full">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-2xl lg:text-4xl text-white pb-6">
          Cyborg BRC-20 Protocol
        </h2>
        {data && data.length > 0 && (
          <div className="w-full lg:w-auto center">
            <CustomPaginationComponent
              count={Math.ceil(totalCount / page_size)}
              onChange={handlePageChange}
              page={page}
            />
          </div>
        )}
      </div>
      <div className="w-full center lg:w-auto my-2">
        <CustomSearch
          placeholder="CBRC Token..."
          value={search}
          onChange={handleSearchChange}
          icon={FaSearch}
          end={true}
          onIconClick={fetchData}
          fullWidth
        />
      </div>
      <div className="">
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
                <TableCell sx={{ fontWeight: "bold", fontSize: "1.25rem" }}>
                  TICK
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "1.25rem" }}>
                  Max
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "1.25rem" }}>
                  Limit
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "1.25rem" }}>
                  Minted
                </TableCell>
              </TableRow>
            </TableHead>
            {loading ? (
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
              <TableBody sx={{ bgcolor: "#3d0263", color: "white" }}>
                {data?.map((item: Icbrc) => (
                  <TableRow
                    onClick={() => handleRowClick(item.tick)}
                    key={item.op.id}
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
                      sx={{ color: "white" }}
                    >
                      {item.tick}
                    </TableCell>
                    <TableCell sx={{ color: "white" }}>{item.max}</TableCell>
                    <TableCell sx={{ color: "white" }}>{item.lim}</TableCell>
                    <TableCell sx={{ color: "white" }}>
                      {((item.supply / item.max) * 100).toFixed(3)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        </TableContainer>
      </div>
    </section>
  );
}

export default CBRC;
