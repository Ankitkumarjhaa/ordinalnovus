import React from "react";
import {
  Select,
  MenuItem,
  FormControl,
  styled,
  SelectChangeEvent,
} from "@mui/material";

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  minWidth: 200, // Adjust the width
  borderRadius: 10, // Add border radius
  backgroundColor: "#0a041c",
  border: "2px solid #6615a2",
  "& .Mui-focused": {
    color: "white",
  },
  "& .MuiInput-underline:after": {
    borderBottomColor: "#6615a2",
  },
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: "#6615a2",
    },
    "&:hover fieldset": {
      borderColor: "#6615a2",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#6615a2",
    },
  },
}));

const StyledSelect = styled(Select)({
  color: "white",
  "&:focus": {
    backgroundColor: "transparent",
  },
  "& .MuiSvgIcon-root": {
    // Target the SVG Icon
    color: "white", // Set the color to white
  },
});

const StyledMenuItem = styled(MenuItem)({
  backgroundColor: "white", // Set the background color to white
  "&:hover": {
    backgroundColor: "#f5f5f5", // Optionally, change the color on hover
  },
});

interface CustomSelectorProps {
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  widthFull?: boolean;
}

const CustomSelector: React.FC<CustomSelectorProps> = ({
  label,
  value,
  options,
  onChange,
  widthFull,
  disabled,
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    !disabled && onChange(event.target.value);
  };

  return (
    <StyledFormControl variant="outlined" fullWidth={widthFull}>
      {/* <StyledInputLabel htmlFor={label}>{label}</StyledInputLabel> */}
      <StyledSelect
        value={value || options[0]?.value}
        //@ts-ignore
        onChange={handleChange}
        displayEmpty
        label={label}
        inputProps={{
          id: label,
        }}
      >
        {options.map((option) => (
          <StyledMenuItem key={option.value} value={option.value}>
            {option.label}
          </StyledMenuItem>
        ))}
      </StyledSelect>
    </StyledFormControl>
  );
};

export default CustomSelector;
