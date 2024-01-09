import React from "react";
import CustomButton from "../CustomButton";
import { IInscription } from "@/types";

type InscriptionProps = {
  data: IInscription;
};
function CreateReinscription({ data }: InscriptionProps) {
  return (
    <div className="flex-1">
      <CustomButton
        loading={false}
        text={"Make it transferable"}
        hoverBgColor="hover:bg-accent_dark"
        hoverTextColor="text-white"
        bgColor="bg-accent"
        textColor="text-white"
        className="transition-all w-full rounded-xl"
        link={true}
        href={`/crafter?inscription=${data.inscription_id}`}
      />
    </div>
  );
}

export default CreateReinscription;
