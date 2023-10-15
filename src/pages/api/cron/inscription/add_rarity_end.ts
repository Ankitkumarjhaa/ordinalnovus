// import { NextApiRequest, NextApiResponse } from "next";
// //@ts-ignore
// import Inscription from "../../../../models/Inscription";
// import axios from "axios";
// import dbConnect from "../../../../lib/dbConnect";
// import { IInscription } from "@/types/Ordinals";

// async function fetchInscriptionDetails(inscriptionId: string) {
//   try {
//     const inscriptionDetailsResponse = await axios.get(
//       `${process.env.NEXT_PUBLIC_PROVIDER}/api/inscription/${inscriptionId}`
//     );

//     if (!inscriptionDetailsResponse.data.sat) {
//       throw Error("server down");
//     }

//     const inscriptionDetails = inscriptionDetailsResponse.data;

//     const data: Partial<IInscription> = {
//       // content: inscriptionDetails._links.content.href,
//       genesis_transaction: inscriptionDetails.genesis_transaction,
//       block: inscriptionDetails.block,
//       content_length: inscriptionDetails.content_length,
//       // content_type: inscriptionDetails.content_type,
//       cycle: inscriptionDetails.cycle,
//       decimal: inscriptionDetails.decimal,
//       degree: inscriptionDetails.degree,
//       epoch: inscriptionDetails.epoch,
//       genesis_address: inscriptionDetails.genesis_address,
//       genesis_fee: inscriptionDetails.genesis_fee,
//       genesis_height: inscriptionDetails.genesis_height,
//       location: inscriptionDetails.location,
//       number: inscriptionDetails.number,
//       percentile: inscriptionDetails.percentile,
//       period: inscriptionDetails.period,
//       rarity: inscriptionDetails.rarity,
//       sat: inscriptionDetails.sat,
//       sat_name: inscriptionDetails.sat_name,
//       sat_offset: inscriptionDetails.sat_offset,
//       timestamp: new Date(inscriptionDetails.timestamp),
//       preview: inscriptionDetails._links.preview.href.split("/")[2],
//     };
//     return data;
//   } catch (error: any) {
//     if (
//       error.response &&
//       (error.response.status === 500 || error.response.status === 502)
//     ) {
//       return { error: true };
//     } else {
//       throw error;
//     }
//   }
// }

// async function fetchAndSaveInscriptions(inscriptionIds: string[] = []) {
//   const fetchPromises = inscriptionIds.map((inscriptionId) =>
//     fetchInscriptionDetails(inscriptionId).catch((error) => {
//       console.error(
//         `Error fetching inscription ${inscriptionId}: ${error.message || error}`
//       );
//       return null;
//     })
//   );
//   const newInscriptions = await Promise.all(fetchPromises);
//   return newInscriptions;
// }

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   await dbConnect();
//   console.log("***ADDING RARITY***");

//   try {
//     const inscriptionsToUpdate = await Inscription.find(
//       {
//         genesis_transaction: null,
//         error: false,
//       },
//       "number inscriptionId"
//     )
//       .sort({ number: -1 })
//       .limit(500);

//     console.log(inscriptionsToUpdate[499], "ITU");

//     if (!inscriptionsToUpdate.length) {
//       return res.status(200).json({ message: "No inscriptions to update." });
//     }

//     const inscriptionIds = inscriptionsToUpdate.map(
//       (inscription: { inscriptionId: any }) => inscription.inscriptionId
//     );
//     const updatedInscriptions = await fetchAndSaveInscriptions(inscriptionIds);

//     const bulkOps = inscriptionsToUpdate
//       .map((inscription: { _id: any; number: any }, i: number) => {
//         const updatedInscription = updatedInscriptions[i];
//         if (updatedInscription) {
//           return {
//             updateOne: {
//               filter: { _id: inscription._id },
//               update: {
//                 $set: { ...updatedInscription, number: inscription.number },
//               },
//             },
//           };
//         }
//       })
//       .filter(Boolean);

//     const bulkResult = await Inscription.bulkWrite(bulkOps);

//     console.log(updatedInscriptions[499], "UI");

//     const modifiedInscriptionNumbers = updatedInscriptions
//       .filter(Boolean)
//       .map((inscription: any) => inscription.number);

//     res.status(200).json({
//       message: "Inscriptions fetched and updated successfully",
//       totalModified: bulkResult.nModified,
//       modifiedNumbers: modifiedInscriptionNumbers,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(400).json({
//       message: "Error fetching and updating inscriptions",
//     });
//   }
// }
