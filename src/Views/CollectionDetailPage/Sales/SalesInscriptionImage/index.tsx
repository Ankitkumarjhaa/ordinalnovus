import { shortenString } from "@/utils";
import React, { useState } from "react";

const SalesInscriptionImage = ({ inscriptionId }: { inscriptionId: string }) => {
  const [imageError, setImageError] = useState(false);

  const handleError = () => {
    setImageError(true);
  };

  const imageUrl = `/content/${inscriptionId}`;
  console.log(imageUrl, "imgurl");

  return (
    <div>
      {imageError ? (
        <span>{shortenString(inscriptionId)}</span>
      ) : (
        <div>
          <img
          className="w-16 h-16 pixelated"
            src={imageUrl}
            alt={shortenString(inscriptionId)}
            onError={handleError}
          />
        </div>
      )}
    </div>
  );
};

export default SalesInscriptionImage;
