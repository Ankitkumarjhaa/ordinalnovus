"use client";
import CustomButton from "@/components/elements/CustomButton";
// import { useSignTx } from "@/hooks/useHiroSignTx";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { IInscription, WalletDetail } from "@/types/Ordinals";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
// import * as bitcoin from "bitcoinjs-lib";
// import secp256k1 from "@bitcoinerlab/secp256k1";
import { RootState } from "@/stores";
import {
  base64ToHex,
  calculateBTCCostInDollars,
  convertSatToBtc,
  //   range,
} from "@/utils";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import getUnsignedBuyPsbt from "@/apiHelper/getUnsignedBuyPsbt";
// import mergeSignedPsbt from "@/api/mergeSignedPsbt";
// import broadcast from "@/api/broadcast";

// bitcoin.initEccLib(secp256k1);
type InscriptionProps = {
  data: IInscription;
};

function BuyInscription({ data }: InscriptionProps) {
  const dispatch = useDispatch();
  //   const signTx = useSignTx();
  //   const signXversePSBT = useXverseSignTx();
  const [loading, setLoading] = useState<boolean>(false);

  const [unsignedPsbtBase64, setUnsignedPsbtBase64] = useState<string>("");
  const [signedPsbtBase64, setSignedPsbtBase64] = useState<string>("");
  const [action, setAction] = useState<string>("");

  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );

  //wallet
  const walletDetails = useWalletAddress();

  const buy = useCallback(async () => {
    if (
      !walletDetails ||
      !walletDetails.cardinal_address ||
      !walletDetails.ordinal_address ||
      !walletDetails.wallet ||
      !walletDetails.cardinal_pubkey
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
      const result = await getUnsignedBuyPsbt({
        inscription_id: data.inscription_id,
        pay_address: walletDetails.cardinal_address,
        receive_address: walletDetails.ordinal_address,
        publickey: walletDetails.cardinal_pubkey,
        wallet: walletDetails.wallet,
      });

      if (result.ok && result.unsigned_psbt_base64) {
        if (result.for === "dummy") {
          dispatch(
            addNotification({
              id: new Date().valueOf(),
              message: "Creating dummy UTXO",
              open: true,
              severity: "info",
            })
          );
          setAction("dummy");

          setUnsignedPsbtBase64(result.unsigned_psbt_base64);

          console.log(result, "UNSIGNED DUMMY");
        } else {
          setAction("buy");

          setUnsignedPsbtBase64(result.unsigned_psbt_base64);

          console.log(result, "UNSIGNED BUY");
        }
      } else {
        throw Error(result.message);
      }

      return 0;
    } catch (e: any) {
      setLoading(false);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: e.message || e,
          open: true,
          severity: "error",
        })
      );
    }
  }, [walletDetails, data]);

  //   const buy = useCallback(async () => {
  //     if (
  //       data?.inscription_id &&
  //       data?.output &&
  //       data?.inscription_number &&
  //       data?.output_value
  //     ) {
  // if (
  //   !walletDetails ||
  //   !walletDetails.cardinal_address ||
  //   !walletDetails.ordinal_address ||
  //   !walletDetails.wallet
  // ) {
  //   dispatch(
  //     addNotification({
  //       id: new Date().valueOf(),
  //       message: "Connect wallet to continue",
  //       open: true,
  //       severity: "error",
  //     })
  //   );
  //   return;
  // }

  //     try {
  //       setLoading(true);
  //       const result = await getUnsignedBuyingPsbt({
  //         tokenId: data.inscription_id,
  //         pay_address: walletDetails.cardinal_address,
  //         receive_address: walletDetails.ordinal_address,
  //         publickey: walletDetails.cardinal_pubkey,
  //       });

  //       if (result.ok && result.unsignedPsbtBase64) {
  //         if (result.for === "dummy") {
  //           dispatch(
  //             addNotification({
  //               id: new Date().valueOf(),
  //               message: "Creating dummy UTXO",
  //               open: true,
  //               severity: "info",
  //             })
  //           );
  //           setAction("dummy");

  //           setUnsignedPsbtBase64(result.unsignedPsbtBase64);

  //           console.log(result.unsignedPsbtBase64, "UNSIGNED");
  //         } else {
  //           setAction("buy");

  //           setUnsignedPsbtBase64(result.unsignedPsbtBase64);

  //           console.log(result.unsignedPsbtBase64, "UNSIGNED");
  //         }
  //       } else {
  //         throw Error(result.message);
  //       }

  //       return 0;
  //     } catch (e: any) {
  //       setLoading(false);
  //       dispatch(
  //         addNotification({
  //           id: new Date().valueOf(),
  //           message: e.message || e,
  //           open: true,
  //           severity: "error",
  //         })
  //       );
  //     }
  //   }
  //   }, [data, walletDetails, lastWallet, dispatch]);

  //   useEffect(() => {
  //     const signTransaction = async () => {
  //       try {
  //         if (
  //           unsignedPsbtBase64 &&
  //           walletDetails?.ordinalPubkey &&
  //           walletDetails.cardinalPubkey
  //         ) {
  //           if (lastWallet === "Hiro") {
  //             const signResult = await signTx({
  //               publicKey: walletDetails?.cardinalPubkey,
  //               hex: base64ToHex(unsignedPsbtBase64),
  //               signAtIndex: range(
  //                 bitcoin.Psbt.fromBase64(unsignedPsbtBase64).inputCount
  //               ).filter((a) => a !== 2),
  //             });
  //             console.log(signResult, "SIGNRESULT");
  //             if (!signResult) {
  //               setLoading(false);
  //               setUnsignedPsbtBase64("");
  //             } else {
  //               setUnsignedPsbtBase64("");
  //               setSignedPsbtBase64(signResult);
  //             }
  //           } else if (lastWallet === "Xverse") {
  //             // // Decode the base64 PSBT
  //             const decodedPSBT = bitcoin.Psbt.fromBase64(unsignedPsbtBase64);

  //             // Extract the inputs
  //             const inputs = decodedPSBT.data.inputs
  //               .map((input: any, index: number) => {
  //                 if (input.witnessUtxo && input.redeemScript) {
  //                   // Get the address from the output script
  //                   const address = bitcoin.address.fromOutputScript(
  //                     input.witnessUtxo.script,
  //                     bitcoin.networks.bitcoin || undefined
  //                   );
  //                   const publicKey =
  //                     address === walletDetails?.cardinal
  //                       ? walletDetails?.cardinalPubkey
  //                       : walletDetails?.ordinalPubkey;
  //                   if (publicKey) {
  //                     const publicKeyBuffer = Buffer.from(publicKey, "hex");
  //                     const p2wpkh = bitcoin.payments.p2wpkh({
  //                       pubkey: publicKeyBuffer,
  //                       network: bitcoin.networks.bitcoin || undefined,
  //                     });
  //                     const p2sh = bitcoin.payments.p2sh({
  //                       redeem: p2wpkh,
  //                       network: bitcoin.networks.bitcoin || undefined,
  //                     });
  //                     return {
  //                       address: address,
  //                       signingIndexes: [index],
  //                       redeemScript: p2sh.redeem,
  //                     };
  //                   }
  //                 } else if (input.redeemScript) {
  //                   const nonWitnessUtxoTx = bitcoin.Transaction.fromBuffer(
  //                     input.nonWitnessUtxo
  //                   );

  //                   console.log(nonWitnessUtxoTx, "tx", input);
  //                   const output = nonWitnessUtxoTx.outs[input.index];

  //                   // Get the address from the output script
  //                   const address = bitcoin.address.fromOutputScript(
  //                     output.script,
  //                     bitcoin.networks.bitcoin
  //                   );

  //                   const publicKey =
  //                     address === walletDetails?.cardinal
  //                       ? walletDetails?.cardinalPubkey
  //                       : walletDetails?.ordinalPubkey;
  //                   if (publicKey) {
  //                     const publicKeyBuffer = Buffer.from(publicKey, "hex");
  //                     const p2wpkh = bitcoin.payments.p2wpkh({
  //                       pubkey: publicKeyBuffer,
  //                       network: bitcoin.networks.bitcoin || undefined,
  //                     });
  //                     const p2sh = bitcoin.payments.p2sh({
  //                       redeem: p2wpkh,
  //                       network: bitcoin.networks.bitcoin || undefined,
  //                     });
  //                     return {
  //                       address: address,
  //                       signingIndexes: [index],
  //                       redeemScript: p2sh,
  //                     };
  //                   }
  //                 }
  //               })
  //               .filter((input: any) => input !== null && input !== undefined);
  //             const signPsbtOptions = {
  //               payload: {
  //                 network: {
  //                   type: "Mainnet",
  //                 },
  //                 message: "Sign Transaction",
  //                 psbtBase64: unsignedPsbtBase64,
  //                 broadcast: false,
  //                 inputsToSign: inputs,
  //               },
  //               onFinish: (response: { psbtBase64: any }) => {
  //                 console.log(response.psbtBase64, "signed");

  //                 setSignedPsbtBase64(response.psbtBase64);

  //                 setUnsignedPsbtBase64("");
  //                 //  alert(response.psbtBase64);
  //                 // setLoading(false);
  //                 // setUnsignedPsbtBase64("");

  //                 // return base64ToHex(response.psbtBase64);
  //               },
  //               onCancel: () => {
  //                 setLoading(false);
  //                 setUnsignedPsbtBase64("");
  //                 alert("Canceled");
  //               },
  //             };

  //             console.log(signPsbtOptions, "XVERSE_OPTIONS");

  //             //@ts-ignore
  //             const signedResult = await signXversePSBT(signPsbtOptions);
  //             console.log(signedResult, "SIGNED");
  //           } else {
  //             throw Error("Invalid wallet");
  //           }
  //         }
  //       } catch (e) {
  //         setLoading(false);
  //         setUnsignedPsbtBase64("");
  //       }
  //     };

  //     signTransaction();
  //   }, [data.inscription_id, dispatch, unsignedPsbtBase64, walletDetails]);

  //   useEffect(() => {
  //     const mergePsbts = async () => {
  //       if (!data.signedPsbt) {
  //         throw Error("Missing seller psbt");
  //       }
  //       try {
  //         setLoading(true);
  //         const result = await mergeSignedPsbt({
  //           signedBuyingPSBTBase64: signedPsbtBase64,
  //           signedListingPSBTBase64: data.signedPsbt,
  //         });

  //         if (result.ok) {
  //           setLoading(false);
  //           dispatch(
  //             addNotification({
  //               id: new Date().valueOf(),
  //               message: "Successfully created Tx",
  //               open: true,
  //               severity: "success",
  //             })
  //           );
  //         } else {
  //           throw Error(result.message);
  //         }

  //         return 0;
  //       } catch (e: any) {
  //         setLoading(false);

  //         setSignedPsbtBase64("");
  //         setAction("");
  //         dispatch(
  //           addNotification({
  //             id: new Date().valueOf(),
  //             message: e.message || e,
  //             open: true,
  //             severity: "error",
  //           })
  //         );
  //       }
  //     };

  //     const broadcastDummyTx = async () => {
  //       if (!data.signedPsbt) {
  //         throw Error("Missing dummy psbt");
  //       }
  //       try {
  //         setLoading(true);
  //         const result = await broadcast({
  //           signedPsbt: signedPsbtBase64,
  //         });

  //         if (result.ok) {
  //           setLoading(false);
  //           dispatch(
  //             addNotification({
  //               id: new Date().valueOf(),
  //               message: "Successfully created Tx",
  //               open: true,
  //               severity: "success",
  //             })
  //           );
  //         } else {
  //           throw Error(result.message);
  //         }

  //         return 0;
  //       } catch (e: any) {
  //         setLoading(false);
  //         setSignedPsbtBase64("");
  //         setAction("");
  //         dispatch(
  //           addNotification({
  //             id: new Date().valueOf(),
  //             message: e.message || e,
  //             open: true,
  //             severity: "error",
  //           })
  //         );
  //       }
  //     };

  //     console.log(signedPsbtBase64, " SIGNED BASE64");
  //     if (data.signed_psbt && signedPsbtBase64 && action == "dummy")
  //       broadcastDummyTx();
  //     else if (data.signed_psbt && signedPsbtBase64 && action == "buy")
  //       mergePsbts();
  //   }, [action, data.signed_psbt, dispatch, signedPsbtBase64]);

  return (
    <>
      <div className="center  w-full  py-6 border-b-2 border-accent">
        {/* {result?.data?.for === "dummy" && (
        <p className="p-3">This will generate DUMMY UTXO.</p>
      )} */}
        <CustomButton
          loading={loading}
          disabled={!data.signed_psbt}
          text={`Buy Now ${
            data?.listed_price
              ? ` for ${convertSatToBtc(
                  Number(data?.listed_price)
                )} BTC USD ${calculateBTCCostInDollars(
                  Number(convertSatToBtc(data?.listed_price)),
                  btcPrice
                )}`
              : ""
          }`}
          hoverBgColor="hover:bg-accent_dark"
          hoverTextColor="text-white"
          bgColor="bg-accent"
          textColor="text-white"
          className="transition-all w-full rounded-xl"
          //   onClick={buy} // Add this line to make the button functional
        />
      </div>
    </>
  );
}

export default BuyInscription;
