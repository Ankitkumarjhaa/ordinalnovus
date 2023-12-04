import mixpanel from "mixpanel-browser";

let isMixpanelInitialized = false;

const initMixpanel = () => {
  if (isMixpanelInitialized) {
    return;
  }

  let mixpanelToken =
    process.env.NEXT_PUBLIC_MIXPANEL || "670cc838c8dd3bbaff43b48867c465c0"; // Default token

  console.log(process.env.NEXT_PUBLIC_URL, "URL");
  if (process.env.NEXT_PUBLIC_URL !== "https://ordinalnovus.com") {
    mixpanelToken = "670cc838c8dd3bbaff43b48867c465c0";
  }

  console.log(mixpanelToken, "TOKEN");
  mixpanel.init(mixpanelToken, {
    debug: true || process.env.NODE_ENV === "production",
  });
  mixpanel.set_config({
    ip: true,
    ignore_dnt: true,
  });

  isMixpanelInitialized = true;
};

export default initMixpanel;

export const dynamic = "force-dynamic";
