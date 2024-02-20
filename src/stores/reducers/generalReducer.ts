import { IBalanceData, IFeeInfo } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: {
  btc_price_in_dollar: number;
  fees: IFeeInfo | null;
  allowed_cbrcs: string[] | null;
  balanceData: IBalanceData | null;
} = {
  btc_price_in_dollar: 0,
  fees: null,
  allowed_cbrcs: null,
  balanceData: null,
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
    setAllowedCbrcs: (state, action: PayloadAction<string[] | null>) => {
      state.allowed_cbrcs = action.payload;
    },
    setBalanceData: (state, action: PayloadAction<IBalanceData | null>) => {
      state.balanceData = action.payload;
    },
  },
});

export const { setBTCPrice, setFees, setAllowedCbrcs, setBalanceData } =
  generalSlice.actions;
export default generalSlice.reducer;
