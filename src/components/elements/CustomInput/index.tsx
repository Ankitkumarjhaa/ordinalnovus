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

  "&.Mui-disabled": {
    backgroundColor: "#3a3a3a", // Change background color when disabled
    color: "#b1b1b1", // Change text color when disabled
    "& .MuiInputLabel-root": {
      color: "#b1b1b1", // Change label color when disabled
    },
    "& .MuiOutlinedInput-notchedOutline": {
      border: "1px solid #757575", // Change border color when disabled
    },
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
  startAdornmentText?: string;
  endAdornmentText?: string;
  adornmentStyle?: string;
  disabled?: boolean;
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
  disabled,
  startAdornmentText,
  endAdornmentText,
  adornmentStyle = " text-white text-xs 2xl:text-sm",
}) => {
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    if (onBlur) {
      onBlur(event.target.value);
    }
  };

  const startAdornment = (
    <InputAdornment position="start">
      {Icon && !end && (
        <button
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <Icon style={{ color: "white" }} />
        </button>
      )}
      <span className={adornmentStyle}>{startAdornmentText}</span>
    </InputAdornment>
  );

  const endAdornment = (
    <InputAdornment position="end">
      {Icon && end && (
        <button
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <Icon style={{ color: "white" }} />
        </button>
      )}
      <span className={adornmentStyle}>{endAdornmentText}</span>
    </InputAdornment>
  );

  return (
    <CustomTextField
      InputProps={{
        startAdornment: startAdornment,
        endAdornment: endAdornment,
      }}
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      variant="outlined"
      placeholder={placeholder}
      InputLabelProps={{
        shrink: true,
      }}
      disabled={disabled}
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
