import { model, models } from "mongoose";
import { collectionSchema } from "./Collection";
import { inscriptionSchema } from "./Inscription";
import { APIKeySchema } from "./APIKey";
import { TXCacheSchema } from "./tx";
import { BlocksSchema } from "./block";
import { InscribeOrderSchema } from "./InscribeOrder";
import { salesSchema } from "./Sale";
import { WalletSchema } from "./Wallets";
import { CbrcStatsSchema } from "./CBRCStats";
import { APIUsageLogSchema } from "./APIUsageLog";

import { AllowedTokensSchema } from "./AllowedTokens";
import { CBRCTokenSchema } from "./CBRCTokens";
import { createInscriptionSchema } from "./createInscription";
import { satsCollSchema } from "./SatCollection";
import { cbrcmarketDataSchema } from "./CbrcMarketdata";

const Inscription =
  models.Inscription || model("Inscription", inscriptionSchema);

const Collection = models.Collection || model("Collection", collectionSchema);
const APIKey = models.APIKey || model("APIKey", APIKeySchema);
const Tx = models.Tx || model("Tx", TXCacheSchema);
const Block = models.Block || model("Block", BlocksSchema);
const Inscribe = models.Inscribe || model("Inscribe", InscribeOrderSchema);
const CreateInscription =
  models.CreateInscription ||
  model("CreateInscription", createInscriptionSchema);
const Sale = models.Sale || model("Sale", salesSchema);
const Wallet = models.Wallet || model("Wallet", WalletSchema);
const AllowedCbrcs =
  models.AllowedCbrcs || model("AllowedCbrcs", AllowedTokensSchema);
const APIKeyUsage =
  models.APIKeyUsage || model("APIKeyUsage", APIUsageLogSchema);

const CBRCToken = models.CBRCToken || model("CBRCToken", CBRCTokenSchema);
const CBRCStats = models.CBRCStats || model("CBRCStats", CbrcStatsSchema);
const SatCollection =
  models.SatCollection || model("SatCollection", satsCollSchema);

const CbrcMarketData =
  models.CbrcMarketData || model("CbrcMarketData", cbrcmarketDataSchema);
export {
  Inscribe,
  CreateInscription,
  Inscription,
  Collection,
  APIKey,
  Tx,
  Block,
  Sale,
  Wallet,
  APIKeyUsage,
  AllowedCbrcs,
  CBRCToken,
  SatCollection,
  CBRCStats,
  CbrcMarketData,
};
