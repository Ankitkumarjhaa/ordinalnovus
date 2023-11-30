import React, { useCallback, useEffect, useState } from "react";
import { InputAdornment, TextField, styled } from "@mui/material";
import debounce from "lodash.debounce";
import { IconType } from "react-icons";

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
  fullWidth?: boolean;
  icon?: IconType;
  end?: boolean;
  onIconClick?: () => void;
}

const CustomSearch: React.FC<CustomSearchProps> = ({
  placeholder,
  value,
  onChange,
  fullWidth,
  icon: Icon,
  end,
  onIconClick,
}) => {
  // const [inputValue, setInputValue] = useState(value);

  // // Create a memoized debounced version of the onChange function
  // const debouncedOnChange = useCallback(
  //   debounce((value) => {
  //     onChange(value);
  //   }, 300),
  //   [onChange]
  // );

  // useEffect(() => {
  //   // Call the debounced function when inputValue changes
  //   debouncedOnChange(inputValue);
  // }, [inputValue, debouncedOnChange]);

  // const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   setInputValue(event.target.value);
  // };
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && onIconClick) {
      onIconClick();
    }
  };

  const adornment = Icon ? (
    <InputAdornment position={end ? "end" : "start"}>
      <button
        onClick={onIconClick}
        style={{ background: "none", border: "none", cursor: "pointer" }}
      >
        <Icon style={{ color: "white" }} />
      </button>
    </InputAdornment>
  ) : null;

  return (
    <CustomTextField
      InputProps={{
        ...(end ? { endAdornment: adornment } : { startAdornment: adornment }),
        onKeyPress: handleKeyPress,
      }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      variant="outlined"
      placeholder={placeholder}
      InputLabelProps={{
        shrink: true,
      }}
      name="search"
      autoComplete="off"
      className={fullWidth ? "w-full" : "w-full sm:w-auto"}
    />
  );
};

export default CustomSearch;
