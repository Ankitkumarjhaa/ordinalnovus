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
import {
  useLeatherSign,
  useWalletAddress,
  useXverseSign,
} from "bitcoin-wallet-adapter";
import getUnsignedBuyPsbt from "@/apiHelper/getUnsignedBuyPsbt";
import { Slider } from "@mui/material";
import { IFeeInfo } from "@/types";
import FeePicker from "@/components/elements/FeePicker";
// import mergeSignedPsbt from "@/api/mergeSignedPsbt";
// import broadcast from "@/api/broadcast";

// bitcoin.initEccLib(secp256k1);
type InscriptionProps = {
  data: IInscription;
};

function BuyInscription({ data }: InscriptionProps) {
  const dispatch = useDispatch();
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

  const [loading, setLoading] = useState<boolean>(false);

  const [unsignedPsbtBase64, setUnsignedPsbtBase64] = useState<string>("");
  const [action, setAction] = useState<string>("");
  const [feeRate, setFeeRate] = useState(0);
  const [marks, setMarks] = useState<any>(null);

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
        fee_rate: feeRate,
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

  const broadcast = (signedPsbt: string) => {
    console.log({ signedPsbt });
  };

  const signTx = async () => {
    if (walletDetails.wallet === "Leather") {
      const options: any = {
        psbt: base64ToHex(unsignedPsbtBase64),
        network: "Mainnet",
        action: "dummy",
        inputs: [
          {
            address: walletDetails.cardinal_address,
            publickey: walletDetails.cardinal_pubkey,
            sighash: 1,
            index: [0],
          },
        ],
      };
      console.log(options, "OPTIONS");

      await leatherSign(options);
    } else if (walletDetails.wallet === "Xverse") {
      const options: any = {
        psbt: unsignedPsbtBase64,
        network: "Mainnet",
        action: "dummy",
        inputs: [
          {
            address: walletDetails.cardinal_address,
            publickey: walletDetails.cardinal_pubkey,
            sighash: 1,
            index: [0],
          },
        ],
      };
      console.log(options, "OPTIONS");

      await xverseSign(options);
    }
  };

  useEffect(() => {
    // Handling Leather Wallet Sign Results/Errors
    if (leatherResult) {
      // Handle successful result from leather wallet sign
      console.log("Leather Sign Result:", leatherResult);

      if (leatherResult) {
        broadcast(leatherResult);
        // listOrdinal(leatherResult);
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
      if (xverseResult.psbtBase64) {
        broadcast(xverseResult.psbtBase64);
        // listOrdinal(xverseResult.psbtBase64);
      }
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Leather wallet transaction successful",
          open: true,
          severity: "success",
        })
      );
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
      <div className="w-full  py-6 border-b-2 border-accent">
        {/* {result?.data?.for === "dummy" && (
        <p className="p-3">This will generate DUMMY UTXO.</p>
      )} */}
        <div>
          <div className="center ">
            <p className="py-1 px-4 font-medium rounded bg-bitcoin text-xs text-yellow-900">
              Selected Fee <strong className="text-lg">{feeRate}</strong>{" "}
              sats/vB
            </p>
          </div>
          <FeePicker onChange={setFeeRate} />
        </div>
        <CustomButton
          loading={loading}
          disabled={!data.signed_psbt}
          text={`${
            action === "dummy"
              ? "Confirm Transaction for Dummy UTXO"
              : `Buy Now ${
                  data?.listed_price
                    ? `for ${convertSatToBtc(
                        Number(data.listed_price)
                      )} BTC USD ${calculateBTCCostInDollars(
                        Number(convertSatToBtc(data.listed_price)),
                        btcPrice
                      )}`
                    : ""
                }`
          }`}
          hoverBgColor="hover:bg-accent_dark"
          hoverTextColor="text-white"
          bgColor="bg-accent"
          textColor="text-white"
          className="transition-all w-full rounded-xl"
          onClick={buy} // Add this line to make the button functional
        />
      </div>
    </>
  );
}

export default BuyInscription;
