import { model, models } from "mongoose";
import { collectionSchema } from "./Collection";
import { inscriptionSchema } from "./Inscription";
import { APIKeySchema } from "./APIKey";
import { TXCacheSchema } from "./tx";
import { BlocksSchema } from "./block";
import { InscribeSchema } from "./Inscribe";

const Inscription =
  models.Inscription || model("Inscription", inscriptionSchema);

const Collection = models.Collection || model("Collection", collectionSchema);
const APIKey = models.APIKey || model("APIKey", APIKeySchema);
const Tx = models.Tx || model("Tx", TXCacheSchema);
const Block = models.Block || model("Block", BlocksSchema);
const Inscribe = models.Inscribe || model("Inscribe", InscribeSchema);

export { Inscribe, Inscription, Collection, APIKey, Tx, Block };
