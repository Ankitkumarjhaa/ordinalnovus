"use client";
import CustomButton from "@/components/elements/CustomButton";
import { useSignTx } from "@/hooks/useHiroSignTx";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { IInscription } from "@/types/Ordinals";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import copy from "copy-to-clipboard";
import { RootState } from "@/stores";
import getUnsignedListingPsbt from "@/api/getUnsignedListingPsbt";
import {
  base64ToHex,
  range,
  calculateBTCCostInDollars,
} from "../../../../utils";
import { convertBtcToSat, convertSatToBtc } from "@/utils";
import listOrdinal, { listOrdinalData } from "@/api/listOrdinal";
import useXverseSignTx from "@/hooks/useXverseSignTx";

bitcoin.initEccLib(secp256k1);

type InscriptionProps = {
  data: IInscription;
};

function ListInscription({ data }: InscriptionProps) {
  const dispatch = useDispatch();
  const signTx = useSignTx();
  const signXversePSBT = useXverseSignTx();

  const [loading, setLoading] = useState(false);
  const [unsignedPsbtBase64, setUnsignedPsbtBase64] = useState("");

  const [content, setContent] = useState(<></>);
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );
  const [price, setPrice] = useState(
    data?.listedPrice ? convertSatToBtc(data?.listedPrice) : "0"
  );

  const list = useCallback(async () => {
    if (data?.inscriptionId && data?.number) {
      if (!walletDetails || !walletDetails.cardinal || !walletDetails.ordinal) {
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
          tokenId: data.inscriptionId,
          price: convertBtcToSat(Number(price)),
          receive_address: walletDetails.cardinal,
          wallet: lastWallet.toLowerCase(),
          publickey: walletDetails.ordinalPubkey,
        });

        if (result.ok && result.unsignedPsbtBase64) {
          copy(result.unsignedPsbtBase64);
          setUnsignedPsbtBase64(result.unsignedPsbtBase64);
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
  }, [
    data.inscriptionId,
    data?.number,
    dispatch,
    lastWallet,
    price,
    walletDetails,
  ]);

  useEffect(() => {
    const signTransaction = async () => {
      try {
        let signResult = null;
        if (unsignedPsbtBase64 && walletDetails?.ordinalPubkey) {
          if (lastWallet === "Xverse") {
            // // Decode the base64 PSBT
            const decodedPSBT = bitcoin.Psbt.fromBase64(unsignedPsbtBase64);
            console.log("psbt decoded");

            // Extract the inputs
            const inputs = decodedPSBT.data.inputs
              .map((input: any, index: number) => {
                if (input.witnessUtxo) {
                  console.log("input has witness");
                  // Get the address from the output script
                  const address = bitcoin.address.fromOutputScript(
                    input.witnessUtxo.script,
                    bitcoin.networks.bitcoin || undefined
                  );
                  console.log(address, "address");
                  const publicKey =
                    address === walletDetails?.cardinal
                      ? walletDetails?.cardinalPubkey
                      : walletDetails?.ordinalPubkey;
                  if (publicKey) {
                    return {
                      address: address,
                      signingIndexes: [index],
                      sigHash: 131,
                    };
                  }
                } else if (input.redeemScript) {
                  const nonWitnessUtxoTx = bitcoin.Transaction.fromBuffer(
                    input.nonWitnessUtxo
                  );

                  console.log(nonWitnessUtxoTx, "tx", input);
                  const output = nonWitnessUtxoTx.outs[input.index];

                  // Get the address from the output script
                  const address = bitcoin.address.fromOutputScript(
                    output.script,
                    bitcoin.networks.bitcoin
                  );

                  const publicKey =
                    address === walletDetails?.cardinal
                      ? walletDetails?.cardinalPubkey
                      : walletDetails?.ordinalPubkey;
                  if (publicKey) {
                    const publicKeyBuffer = Buffer.from(publicKey, "hex");
                    const p2wpkh = bitcoin.payments.p2wpkh({
                      pubkey: publicKeyBuffer,
                      network: bitcoin.networks.bitcoin || undefined,
                    });
                    const p2sh = bitcoin.payments.p2sh({
                      redeem: p2wpkh,
                      network: bitcoin.networks.bitcoin || undefined,
                    });
                    console.log({
                      address: address,
                      signingIndexes: [index],
                      redeemScript: p2sh,
                    });
                    return {
                      address: address,
                      signingIndexes: [index],
                      redeemScript: p2sh,
                    };
                  }
                }
              })
              .filter((input: any) => input !== null && input !== undefined);

            console.log(inputs, "Inputs");
            const signPsbtOptions = {
              payload: {
                network: {
                  type: "Mainnet",
                },
                message: "Sign Transaction",
                psbtBase64: unsignedPsbtBase64,
                broadcast: false,
                inputsToSign: inputs,
              },
              onFinish: (response: { psbtBase64: any }) => {
                console.log(unsignedPsbtBase64, "unsigned");
                console.log(response.psbtBase64, "signed");
                signResult = response.psbtBase64;
                setUnsignedPsbtBase64("");
                //  alert(response.psbtBase64);
                // setLoading(false);
                // setUnsignedPsbtBase64("");

                // return base64ToHex(response.psbtBase64);
              },
              onCancel: () => {
                setLoading(false);
                setUnsignedPsbtBase64("");
                alert("Canceled");
              },
            };

            console.log(signPsbtOptions, "XVERSE_OPTIONS");

            //@ts-ignore
            const signedResult = await signXversePSBT(signPsbtOptions);
            console.log(signedResult, "SIGNED");
          } else
            signResult = await signTx({
              publicKey: walletDetails?.ordinalPubkey,
              hex: base64ToHex(unsignedPsbtBase64),
              signAtIndex: range(
                bitcoin.Psbt.fromBase64(unsignedPsbtBase64).inputCount
              ),
            });

          if (
            signResult &&
            walletDetails &&
            data.inscriptionId &&
            walletDetails.ordinalPubkey
          ) {
            const listData: listOrdinalData = {
              sellerReceiveAddress: walletDetails?.cardinal,
              tokenId: data.inscriptionId,
              price: convertBtcToSat(Number(price)),
              unsignedListingPSBTBase64: unsignedPsbtBase64,
              toSignInputs: [0],
              toSignSigHash: 131,
              tapInternalKey: walletDetails?.ordinalPubkey,
              listing: {
                seller: {
                  sellerOrdAddress: walletDetails?.ordinal,
                  sellerReceiveAddress: walletDetails?.cardinal,
                },
              },
              signedListingPSBTBase64:
                bitcoin.Psbt.fromHex(signResult).toBase64(),
            };

            try {
              console.log(bitcoin.Psbt.fromHex(signResult).toBase64());
              const result = await listOrdinal(listData);

              // Check if the request was successful
              if (result.success) {
                setLoading(false);
                setUnsignedPsbtBase64("");
                dispatch(
                  addNotification({
                    id: new Date().valueOf(),
                    message: "Successfully Listed Ordinal for sale.",
                    open: true,
                    severity: "success",
                  })
                );
                // Additional code to handle success if needed
              } else {
                setUnsignedPsbtBase64("");
                setLoading(false);
                dispatch(
                  addNotification({
                    id: new Date().valueOf(),
                    message: "Some error occurred",
                    open: true,
                    severity: "error",
                  })
                );
                // Additional code to handle failure if needed
              }
            } catch (error: any) {
              setLoading(false);
              dispatch(
                addNotification({
                  id: new Date().valueOf(),
                  message: error.message || "Some error occurred",
                  open: true,
                  severity: "error",
                })
              );
            }
          }
        }
      } catch (e) {
        console.log(e, "Error in txSign");
        setLoading(false);
      }
    };

    signTransaction();
  }, [
    data.inscriptionId,
    dispatch,
    price,
    signTx,
    unsignedPsbtBase64,
    walletDetails,
  ]);

  useEffect(() => {
    if (walletDetails?.ordinal === data?.address) {
      setContent(
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
              text={data?.listedPrice ? "Update Price" : `List Now`}
              hoverBgColor="hover:bg-accent_dark"
              hoverTextColor="text-white"
              bgColor="bg-accent"
              textColor="text-white"
              className="transition-all w-full rounded-xl"
              onClick={() => list()} // Add this line to make the button functional
            />
          </div>
        </div>
      );
    }
  }, [walletDetails, data, price, loading, list, btcPrice]);

  return <>{content}</>; // We render the content state variable here
}

export default ListInscription;
