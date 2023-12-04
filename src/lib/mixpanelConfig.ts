import mixpanel from "mixpanel-browser";

let isMixpanelInitialized = false;

const initMixpanel = () => {
  if (isMixpanelInitialized) {
    return;
  }

  let mixpanelToken = "670cc838c8dd3bbaff43b48867c465c0"; // Default token

  if (process.env.NEXT_PUBLIC_URL === "https://ordinalnovus.com") {
    mixpanelToken = "863cacfbbada1077c3128e23849ff611";
  }

  mixpanel.init(mixpanelToken, {
    debug: process.env.NODE_ENV !== "production",
  });

  isMixpanelInitialized = true;
};

export default initMixpanel;
