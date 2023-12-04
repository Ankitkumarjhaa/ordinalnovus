const InscribePreviewCard = ({
  file,
  dataURL,
}: {
  file: any;
  dataURL: string;
}) => {
  const renderPreview = () => {
    const fileType = file.type.split("/")[0];
    switch (fileType) {
      case "image":
        return (
          <img src={dataURL} alt={file.name} className="max-w-xs max-h-xs" />
        );
      case "video":
        return <video controls src={dataURL} className="max-w-xs max-h-xs" />;
      case "audio":
        return <audio controls src={dataURL} className="w-full" />;
      case "text":
      case "application":
        const text = atob(dataURL.split(",")[1]);

        // For simplicity, assuming text and certain application types can be handled as text.
        // You might need more specific handling based on MIME type.
        return (
          <span className="focus:outline-none p-2 border-accent border-2 rounded bg-secondary  text-white w-full h-full">
            {text}
          </span>
        );
      default:
        return <div>Unsupported file type</div>;
    }
  };

  return (
    <div className="py-4 w-full md:w-6/12 lg:w-4/12 ">
      {renderPreview()}
      <div className="mt-2 text-sm text-gray-500">{file.name}</div>
    </div>
  );
};

export default InscribePreviewCard;
