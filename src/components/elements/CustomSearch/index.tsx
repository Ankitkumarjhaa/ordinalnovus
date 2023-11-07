import React, { useCallback, useEffect, useState } from "react";
import { TextField, styled } from "@mui/material";
import debounce from "lodash.debounce";

// Update border radius value to make the search bar thinner
const CustomTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 10, // Updated border radius value
    backgroundColor: "#0a0217",
    border: "2px solid #582081",
  },
  "& .MuiOutlinedInput-input": {
    color: "white",
  },
  "& .MuiInputLabel-root": {
    color: "white",
  },
  "& .MuiInputLabel-outlined": {
    transform: "translate(14px, 20px) scale(1)",
  },
  "& .MuiInputLabel-shrink": {
    transform: "translate(14px, -6px) scale(0.75)",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
  },
  "&:hover .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
    borderColor: "#0f0025",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#0f0025",
  },
}));

interface CustomSearchProps {
  placeholder: string;
  value?: string;
  onChange: (value: string) => void;
}

const CustomSearch: React.FC<CustomSearchProps> = ({
  placeholder,
  value,
  onChange,
}) => {
  const [inputValue, setInputValue] = useState(value);

  // Create a memoized debounced version of the onChange function
  const debouncedOnChange = useCallback(
    debounce((value) => {
      onChange(value);
    }, 300),
    [onChange]
  );

  useEffect(() => {
    // Call the debounced function when inputValue changes
    debouncedOnChange(inputValue);
  }, [inputValue, debouncedOnChange]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  return (
    <CustomTextField
      value={inputValue}
      onChange={handleChange}
      variant="outlined"
      placeholder={placeholder}
      InputLabelProps={{
        shrink: true,
      }}
      className="w-full sm:w-auto"
    />
  );
};

export default CustomSearch;
