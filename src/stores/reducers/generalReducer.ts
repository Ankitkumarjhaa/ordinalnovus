import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: {
  btc_price_in_dollar: number;
} = {
  btc_price_in_dollar: 0,
};

const generalSlice = createSlice({
  name: "general",
  initialState,
  reducers: {
    setBTCPrice: (state, action: PayloadAction<number>) => {
      state.btc_price_in_dollar = action.payload;
    },
  },
});

export const { setBTCPrice } = generalSlice.actions;
export default generalSlice.reducer;
