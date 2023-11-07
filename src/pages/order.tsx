import React, { useEffect } from "react";
import { verifySignature } from "@/utils/Marketplace/Listing";

const psbt4 =
  "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";
const psbt3 =
  "70736274ff01005e0200000001abb0084b10ba355899bf6f5e5ae09375704144208ab58a38103d2bcae22c904b0000000000ffffffff010065cd1d00000000225120091f7721279ce065d1de5bfeaa29d20d0714ef7fd1153c064d81fbbb06557a79000000000001005e0100000001397e97c427e5b8eb954d7213ba8eeddd333fbd74c6a4dcd670f86f43cd9be0250000000000fdffffff011027000000000000225120091f7721279ce065d1de5bfeaa29d20d0714ef7fd1153c064d81fbbb06557a790000000001012b1027000000000000225120091f7721279ce065d1de5bfeaa29d20d0714ef7fd1153c064d81fbbb06557a79010304830000000000";
const psbt2 =
  "cHNidP8BAFICAAAAAZNWuQ8cbryMX7FPo/+X0KxMdy7fKEFQbjxSunthxb73AAAAAAD/////AXKH3AsAAAAAFgAU7jiuceq0p18GDGEV9htaAK/c8OEAAAAAAAEAogIAAAAAAQF5aVV8Wq2biT2RrsGs5iqheVNkBPPbgwMnJzu/Uu2vcAAAAAAA/////wGyBwAAAAAAACJRIPwmODIxbJKj5Bs7R1anpkTuzkU/wRK6HTyIrtDXqX1SAUBPZ/CAvWwX8eo7g2umIKjhbsxIPmKwpL72rWAk+Dv+59kYbrNxHPpsAok2DxFT0f1xnIqxZfpQl70Bxb/veUVOAAAAAAEBK7IHAAAAAAAAIlEg/CY4MjFskqPkGztHVqemRO7ORT/BErodPIiu0NepfVIBAwSDAAAAAQhDAUGL0A0hNDWhdPZPtdK9KmUiAZfP47g0gwSBtNJXnCGFh2/vjp8XHyh6HmTF4f3AKvi0YRbYCpWwwMXrCihxHAS3gwETQYvQDSE0NaF09k+10r0qZSIBl8/juDSDBIG00lecIYWHb++OnxcfKHoeZMXh/cAq+LRhFtgKlbDAxesKKHEcBLeDARcg0g32Sm7tUAex0Xvjsw713iHiAEUGRZAoiCtZK4ECBjMAAA==";
const psbt =
  "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";
function Order() {
  const validityCheck = () => {
    alert(`PSBT is ${verifySignature(psbt4) ? "Valid" : "Invalid"}`);
  };

  useEffect(() => {
    validityCheck();
  }, []);

  return <div>Order</div>;
}

export default Order;
