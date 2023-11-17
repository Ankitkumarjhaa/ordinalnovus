"use client";
import CustomButton from "@/components/elements/CustomButton";
// import { useSignTx } from "@/hooks/useHiroSignTx";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { IInscription } from "@/types/Ordinals";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import copy from "copy-to-clipboard";
import { RootState } from "@/stores";
import getUnsignedListingPsbt from "@/apiHelper/getUnsignedListingPsbt";

import {
  base64ToHex,
  calculateBTCCostInDollars,
  convertBtcToSat,
  convertSatToBtc,
} from "@/utils";
// import listOrdinal, { listOrdinalData } from "@/apiHelper/listOrdinal";
import {
  useWalletAddress,
  useLeatherSign,
  useXverseSign,
} from "bitcoin-wallet-adapter";
import listInscription from "@/apiHelper/listInscription";

type InscriptionProps = {
  data: IInscription;
};

function ListInscription({ data }: InscriptionProps) {
  const dispatch = useDispatch();
  const walletDetails = useWalletAddress();
  const {
    loading: leatherLoading,
    result: leatherResult,
    error: leatherError,
    sign: leatherSign,
  } = useLeatherSign();

  const {
    loading: xverseLoading,
    result: xverseResult,
    error: xverseError,
    sign: xverseSign,
  } = useXverseSign();

  // const signTx = useSignTx();
  // const signXversePSBT = useXverseSignTx();

  const [loading, setLoading] = useState(false);
  const [unsignedPsbtBase64, setUnsignedPsbtBase64] = useState("");

  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );
  const [price, setPrice] = useState(
    data?.listed_price ? convertSatToBtc(data?.listed_price) : "0"
  );
  // const [price, setPrice] = useState("0");

  const list = useCallback(async () => {
    if (data?.inscription_id && data?.inscription_number) {
      if (
        !walletDetails ||
        !walletDetails.cardinal_address ||
        !walletDetails.ordinal_address
      ) {
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: "Connect wallet to continue",
            open: true,
            severity: "error",
          })
        );
        return;
      }
      try {
        setLoading(true);
        const result = await getUnsignedListingPsbt({
          inscription_id: data.inscription_id,
          price: convertBtcToSat(Number(price)),
          receive_address: walletDetails.cardinal_address,
          wallet: walletDetails.wallet,
          publickey: walletDetails.ordinal_pubkey,
        });

        console.log(result, "RESULT");
        if (result.ok && result.unsigned_psbt_base64) {
          // copy(result.unsigned_psbt_base64);
          setUnsignedPsbtBase64(result.unsigned_psbt_base64);
        } else {
          setUnsignedPsbtBase64("");
          throw Error(result.message);
        }
      } catch (e: any) {
        setLoading(false);
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: e.message || "Some error occurred",
            open: true,
            severity: "error",
          })
        );
      }
    }
  }, [data, dispatch, price, walletDetails]);

  const signTx = async () => {
    if (walletDetails.wallet === "Leather") {
      const options: any = {
        psbt: base64ToHex(unsignedPsbtBase64),
        network: "Mainnet",
        action: "sell",
        inputs: [
          {
            address: walletDetails.ordinal_address,
            publickey: walletDetails.ordinal_pubkey,
            sighash: 131,
            index: [0],
          },
        ],
      };
      console.log(options, "OPTIONS");

      await leatherSign(options);
    }
  };

  const listOrdinal = async (signedPsbt: string) => {
   try {
     const result = await listInscription({
       seller_receive_address: walletDetails.cardinal_address || "",
       price: convertBtcToSat(Number(price)),
       inscription_id: data.inscription_id,
       unsigned_listing_psbt_base64: unsignedPsbtBase64,
       tap_internal_key: walletDetails.ordinal_pubkey || "",
       signed_listing_psbt_base64: signedPsbt,
     });
     if (result.ok) {
       // copy(result.unsigned_psbt_base64);
       setUnsignedPsbtBase64("");
     } else {
       setUnsignedPsbtBase64("");
       throw Error(result.message);
     }
   } catch (e: any) {
     setLoading(false);
     dispatch(
       addNotification({
         id: new Date().valueOf(),
         message: e.message || "Some error occurred",
         open: true,
         severity: "error",
       })
     );
   }
  };
  useEffect(() => {
    // Handling Leather Wallet Sign Results/Errors
    if (leatherResult) {
      // Handle successful result from leather wallet sign
      console.log("Leather Sign Result:", leatherResult);

      if (leatherResult) {
        listOrdinal(leatherResult);
      }
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Leather wallet transaction successful",
          open: true,
          severity: "success",
        })
      );
      // Additional logic here
    }

    if (leatherError) {
      // Handle error from leather wallet sign
      console.error("Leather Sign Error:", leatherError);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: leatherError.message || "Leather wallet error occurred",
          open: true,
          severity: "error",
        })
      );
      // Additional logic here
    }

    // Handling Xverse Wallet Sign Results/Errors
    if (xverseResult) {
      // Handle successful result from xverse wallet sign
      console.log("Xverse Sign Result:", xverseResult);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Xverse wallet transaction successful",
          open: true,
          severity: "success",
        })
      );
      // Additional logic here
    }

    if (xverseError) {
      // Handle error from xverse wallet sign
      console.error("Xverse Sign Error:", xverseError);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: xverseError.message || "Xverse wallet error occurred",
          open: true,
          severity: "error",
        })
      );
      // Additional logic here
    }

    // Turn off loading after handling results or errors
    setLoading(false);
  }, [leatherResult, leatherError, xverseResult, xverseError]);

  useEffect(() => {
    if (unsignedPsbtBase64) {
      signTx();
    }
  }, [unsignedPsbtBase64]);

  // useEffect(() => {
  //   const signTransaction = async () => {
  //     try {
  //       let signResult = null;
  //       if (unsignedPsbtBase64 && walletDetails?.ordinalPubkey) {
  //         if (lastWallet === "Xverse") {
  //           // // Decode the base64 PSBT
  //           const decodedPSBT = bitcoin.Psbt.fromBase64(unsignedPsbtBase64);
  //           console.log("psbt decoded");

  //           // Extract the inputs
  //           const inputs = decodedPSBT.data.inputs
  //             .map((input: any, index: number) => {
  //               if (input.witnessUtxo) {
  //                 console.log("input has witness");
  //                 // Get the address from the output script
  //                 const address = bitcoin.address.fromOutputScript(
  //                   input.witnessUtxo.script,
  //                   bitcoin.networks.bitcoin || undefined
  //                 );
  //                 console.log(address, "address");
  //                 const publicKey =
  //                   address === walletDetails?.cardinal
  //                     ? walletDetails?.cardinalPubkey
  //                     : walletDetails?.ordinalPubkey;
  //                 if (publicKey) {
  //                   return {
  //                     address: address,
  //                     signingIndexes: [index],
  //                     sigHash: 131,
  //                   };
  //                 }
  //               } else if (input.redeemScript) {
  //                 const nonWitnessUtxoTx = bitcoin.Transaction.fromBuffer(
  //                   input.nonWitnessUtxo
  //                 );

  //                 console.log(nonWitnessUtxoTx, "tx", input);
  //                 const output = nonWitnessUtxoTx.outs[input.index];

  //                 // Get the address from the output script
  //                 const address = bitcoin.address.fromOutputScript(
  //                   output.script,
  //                   bitcoin.networks.bitcoin
  //                 );

  //                 const publicKey =
  //                   address === walletDetails?.cardinal
  //                     ? walletDetails?.cardinalPubkey
  //                     : walletDetails?.ordinalPubkey;
  //                 if (publicKey) {
  //                   const publicKeyBuffer = Buffer.from(publicKey, "hex");
  //                   const p2wpkh = bitcoin.payments.p2wpkh({
  //                     pubkey: publicKeyBuffer,
  //                     network: bitcoin.networks.bitcoin || undefined,
  //                   });
  //                   const p2sh = bitcoin.payments.p2sh({
  //                     redeem: p2wpkh,
  //                     network: bitcoin.networks.bitcoin || undefined,
  //                   });
  //                   console.log({
  //                     address: address,
  //                     signingIndexes: [index],
  //                     redeemScript: p2sh,
  //                   });
  //                   return {
  //                     address: address,
  //                     signingIndexes: [index],
  //                     redeemScript: p2sh,
  //                   };
  //                 }
  //               }
  //             })
  //             .filter((input: any) => input !== null && input !== undefined);

  //           console.log(inputs, "Inputs");
  //           const signPsbtOptions = {
  //             payload: {
  //               network: {
  //                 type: "Mainnet",
  //               },
  //               message: "Sign Transaction",
  //               psbtBase64: unsignedPsbtBase64,
  //               broadcast: false,
  //               inputsToSign: inputs,
  //             },
  //             onFinish: (response: { psbtBase64: any }) => {
  //               console.log(unsignedPsbtBase64, "unsigned");
  //               console.log(response.psbtBase64, "signed");
  //               signResult = response.psbtBase64;
  //               setUnsignedPsbtBase64("");
  //               //  alert(response.psbtBase64);
  //               // setLoading(false);
  //               // setUnsignedPsbtBase64("");

  //               // return base64ToHex(response.psbtBase64);
  //             },
  //             onCancel: () => {
  //               setLoading(false);
  //               setUnsignedPsbtBase64("");
  //               alert("Canceled");
  //             },
  //           };

  //           console.log(signPsbtOptions, "XVERSE_OPTIONS");

  //           //@ts-ignore
  //           const signedResult = await signXversePSBT(signPsbtOptions);
  //           console.log(signedResult, "SIGNED");
  //         } else
  //           signResult = await signTx({
  //             publicKey: walletDetails?.ordinalPubkey,
  //             hex: base64ToHex(unsignedPsbtBase64),
  //             signAtIndex: range(
  //               bitcoin.Psbt.fromBase64(unsignedPsbtBase64).inputCount
  //             ),
  //           });

  //         if (
  //           signResult &&
  //           walletDetails &&
  //           data.inscriptionId &&
  //           walletDetails.ordinalPubkey
  //         ) {
  //           const listData: listOrdinalData = {
  //             sellerReceiveAddress: walletDetails?.cardinal,
  //             tokenId: data.inscriptionId,
  //             price: convertBtcToSat(Number(price)),
  //             unsignedListingPSBTBase64: unsignedPsbtBase64,
  //             toSignInputs: [0],
  //             toSignSigHash: 131,
  //             tapInternalKey: walletDetails?.ordinalPubkey,
  //             listing: {
  //               seller: {
  //                 sellerOrdAddress: walletDetails?.ordinal,
  //                 sellerReceiveAddress: walletDetails?.cardinal,
  //               },
  //             },
  //             signedListingPSBTBase64:
  //               bitcoin.Psbt.fromHex(signResult).toBase64(),
  //           };

  //           try {
  //             console.log(bitcoin.Psbt.fromHex(signResult).toBase64());
  //             const result = await listOrdinal(listData);

  //             // Check if the request was successful
  //             if (result.success) {
  //               setLoading(false);
  //               setUnsignedPsbtBase64("");
  //               dispatch(
  //                 addNotification({
  //                   id: new Date().valueOf(),
  //                   message: "Successfully Listed Ordinal for sale.",
  //                   open: true,
  //                   severity: "success",
  //                 })
  //               );
  //               // Additional code to handle success if needed
  //             } else {
  //               setUnsignedPsbtBase64("");
  //               setLoading(false);
  //               dispatch(
  //                 addNotification({
  //                   id: new Date().valueOf(),
  //                   message: "Some error occurred",
  //                   open: true,
  //                   severity: "error",
  //                 })
  //               );
  //               // Additional code to handle failure if needed
  //             }
  //           } catch (error: any) {
  //             setLoading(false);
  //             dispatch(
  //               addNotification({
  //                 id: new Date().valueOf(),
  //                 message: error.message || "Some error occurred",
  //                 open: true,
  //                 severity: "error",
  //               })
  //             );
  //           }
  //         }
  //       }
  //     } catch (e) {
  //       console.log(e, "Error in txSign");
  //       setLoading(false);
  //     }
  //   };

  //   signTransaction();
  // }, [
  //   data.inscriptionId,
  //   dispatch,
  //   price,
  //   signTx,
  //   unsignedPsbtBase64,
  //   walletDetails,
  // ]);

  return (
    <>
      {" "}
      <div className="center">
        <div className="flex-1 mr-3 border border-white rounded-xl">
          <div className="flex items-center">
            <input
              type="text"
              value={price}
              placeholder="List Price"
              onChange={(e) => {
                const inputVal = e.target.value;
                const isValidInput = /^[0-9]*\.?[0-9]*$/.test(inputVal); // Regex to validate decimal or numeric input

                if (isValidInput) {
                  setPrice(inputVal);
                }
              }}
              className="bg-transparent w-9/12 p-2 focus:outline-none"
            />
            <span className="pl-2 flex text-xs justify-end">
              USD {calculateBTCCostInDollars(Number(price), btcPrice)}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <CustomButton
            loading={loading}
            text={data.listed_price ? "Update Price" : `List Now`}
            hoverBgColor="hover:bg-accent_dark"
            hoverTextColor="text-white"
            bgColor="bg-accent"
            textColor="text-white"
            className="transition-all w-full rounded-xl"
            onClick={() => list()} // Add this line to make the button functional
          />
        </div>
      </div>
    </>
  ); // We render the content state variable here
}

export default ListInscription;
