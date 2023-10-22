// CustomPagination.tsx
import React from "react";
import Pagination from "@mui/material/Pagination";
import { styled } from "@mui/system";

const CustomPagination = styled(Pagination)(({ theme }) => ({
  "& .MuiPaginationItem-root": {
    color: "#fff",
    borderColor: "#fff",
  },
  "& .MuiPaginationItem-page.Mui-selected": {
    backgroundColor: "#9102F0",
  },
  "& .MuiPaginationItem-page.Mui-selected:hover": {
    backgroundColor: "#9102F0",
  },
  "& .MuiPaginationItem-ellipsis": {
    borderColor: "transparent",
  },
}));

interface CustomPaginationComponentProps {
  count: number;
  page: number;
  onChange: (event: React.ChangeEvent<unknown>, value: number) => void;
}

const CustomPaginationComponent: React.FC<CustomPaginationComponentProps> = ({
  count,
  page,
  onChange,
}) => {
  return (
    <CustomPagination
      count={count}
      page={page}
      variant="outlined"
      shape="rounded"
      onChange={onChange}
      siblingCount={0}
    />
  );
};

export default CustomPaginationComponent;
