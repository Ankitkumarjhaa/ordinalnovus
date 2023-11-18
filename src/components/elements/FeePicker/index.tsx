import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Slider from "@mui/material/Slider";
import { RootState } from "@/stores";
import styled from "@emotion/styled";

interface IFeeInfo {
  [key: string]: number;
}

interface FeePickerProps {
  onChange: (value: number) => void;
}

const CustomSlider = styled(Slider)(({ theme }) => ({
  color: "#6615a2", // Thumb and track color
  "& .MuiSlider-thumb": {
    backgroundColor: "#fff", // Thumb color
  },
  "& .MuiSlider-track": {
    border: "none",
  },
  "& .MuiSlider-rail": {
    color: "#ccc", // Rail color
  },
  "& .MuiSlider-mark": {
    backgroundColor: "#fff", // Mark color
    width: 2, // Width of the mark
  },
  "& .MuiSlider-markLabel": {
    color: "#fff", // Mark label color
  },
  "& .MuiSlider-valueLabel": {
    backgroundColor: "#6615a2", // Value label background color
    color: "#fff", // Value label text color
  },
}));

const FeePicker: React.FC<FeePickerProps> = ({ onChange }) => {
  const fees = useSelector((state: RootState) => state.general.fees);
  const [marks, setMarks] = useState<{ value: number; label: string }[]>([]);
  const [feeRate, setFeeRate] = useState<number>(0);

  useEffect(() => {
    const createFeeMarks = (feeData: IFeeInfo) => {
      return Object.keys(feeData)
        .filter((key) => key.includes("Fee"))
        .map((key) => ({
          value: feeData[key],
          label: `${feeData[key]}`,
        }));
    };

    if (fees) {
      //@ts-ignore
      const createdMarks = createFeeMarks(fees);
      setMarks(createdMarks);
      if (createdMarks[1].value) {
        setFeeRate(createdMarks[1]?.value);
        onChange(createdMarks[1]?.value);
      }
    }
  }, [fees]);

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    setFeeRate(newValue as number);
    onChange(newValue as number);
  };

  function valuetext(value: number) {
    return `${value} sats/vB`;
  }

  return (
    <CustomSlider
      size="small"
      aria-label="Fee Picker"
      defaultValue={feeRate}
      value={feeRate}
      onChange={handleSliderChange}
      //   step={marks[0]?.value - marks[2].value > 100 ? 10 : 5}
      min={marks[2]?.value || 0}
      max={(marks[0]?.value || 0) + 100}
      valueLabelDisplay="auto"
      marks={marks}
      getAriaValueText={valuetext}
    />
  );
};

export default FeePicker;
