import React from "react";
import { InputAdornment, TextField, styled } from "@mui/material";
import { IconType } from "react-icons";

// Customized TextField with bottom border on focus
const CustomTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 5,
    backgroundColor: "#0a0217",
    border: "none", // Remove borders
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
    border: "none", // Remove borders
  },
  "&:hover .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": {
    border: "none", // Remove borders on hover
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderBottom: "2px solid #9102f0", // Bottom border on focus
  },
}));

interface CustomInputProps {
  placeholder: string;
  value?: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
  icon?: IconType;
  end?: boolean;
  multiline?: boolean;
  helperText?: string; // For validation message
  error?: boolean; // To indicate an error state
  onBlur?: (value: string) => void;
}

const CustomInput: React.FC<CustomInputProps> = ({
  placeholder,
  value,
  onChange,
  fullWidth,
  icon: Icon,
  end,
  multiline,
  helperText,
  error,
  onBlur,
}) => {
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    if (onBlur) {
      onBlur(event.target.value);
    }
  };
  const adornment = Icon ? (
    <InputAdornment position={end ? "end" : "start"}>
      <button style={{ background: "none", border: "none", cursor: "pointer" }}>
        <Icon style={{ color: "white" }} />
      </button>
    </InputAdornment>
  ) : null;

  return (
    <CustomTextField
      InputProps={{
        ...(end ? { endAdornment: adornment } : { startAdornment: adornment }),
      }}
      size="small"
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
      multiline
      rows={multiline ? 3 : 1}
      helperText={helperText} // Display validation message
      error={error} // Indicate error state
      onBlur={handleBlur}
    />
  );
};

export default CustomInput;
