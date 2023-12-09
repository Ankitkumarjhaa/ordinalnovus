// CustomPagination.tsx
import React, { useState } from "react";
import Pagination from "@mui/material/Pagination";
import { styled } from "@mui/system";
import { TextField } from "@mui/material";

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

const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    height: 30,
    width: 100,
    marginRight: 8,
    backgroundColor: "#fff",
    borderRadius: 4,
  },
  "& .MuiOutlinedInput-input": {
    textAlign: "center",
    padding: "5px 6px",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#fff",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#fff",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "none",
  },
});
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
  const [inputPage, setInputPage] = useState(page);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(parseInt(event.target.value) || 1);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onChange(event, inputPage > count ? count : inputPage);
  };

  return (
    <>
      {count > 100 ? (
        <form onSubmit={handleSubmit}>
          <StyledTextField
            size="small"
            variant="outlined"
            type="number"
            value={inputPage}
            onChange={handleInputChange}
            inputProps={{ min: 1, max: count }}
          />
        </form>
      ) : (
        <></>
      )}
      <CustomPagination
        count={count}
        page={page}
        variant="outlined"
        shape="rounded"
        onChange={onChange}
      />
    </>
  );
};

export default CustomPaginationComponent;
