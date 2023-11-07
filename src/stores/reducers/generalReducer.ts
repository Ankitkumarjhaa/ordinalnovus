import { IFeeInfo } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: {
  btc_price_in_dollar: number;
  fees: IFeeInfo | null;
} = {
  btc_price_in_dollar: 0,
  fees: null,
};

const generalSlice = createSlice({
  name: "general",
  initialState,
  reducers: {
    setBTCPrice: (state, action: PayloadAction<number>) => {
      state.btc_price_in_dollar = action.payload;
    },
    setFees: (state, action: PayloadAction<IFeeInfo | null>) => {
      state.fees = action.payload;
    },
  },
});

export const { setBTCPrice, setFees } = generalSlice.actions;
export default generalSlice.reducer;
