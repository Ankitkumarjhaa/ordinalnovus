import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  IconButton,
} from "@mui/material";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaCopy,
} from "react-icons/fa";
import { MdExpandMore } from "react-icons/md";

interface ApiAccordionProps {
  apiName: string;
  apiStatus: string;
  apiRoute: string;
  apiMethod: string;
  apiQueryParams?: string;
  apiResponse: string;
  apiExample: string;
}

const ApiAccordion: React.FC<ApiAccordionProps> = ({
  apiName,
  apiStatus,
  apiRoute,
  apiMethod,
  apiQueryParams,
  apiResponse,
  apiExample,
}) => {
  const getStatusIcon = (status: string) => {
    if (status === "success") {
      return <FaCheckCircle className="text-green-500 ml-2" />;
    } else if (status === "error") {
      return <FaTimesCircle className="text-red-500 ml-2" />;
    } else {
      return <FaHourglassHalf className="text-yellow-500 ml-2" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Accordion
      style={{ backgroundColor: "transparent", color: "white" }}
      className="border-accent border-2 "
    >
      <AccordionSummary expandIcon={<MdExpandMore />}>
        <div className="center">
          <div>{apiName}</div>
          {getStatusIcon(apiStatus)}
        </div>
      </AccordionSummary>
      <AccordionDetails className="border-t-2 border-accent">
        <div className="text-sm text-gray-200">
          <strong>Route:</strong>{" "}
          <span className="text-white text-xs">{apiRoute}</span>
          <br />
          <strong>Method:</strong>{" "}
          <span className="text-white text-xs">{apiMethod}</span>
          <br />
          <strong>Query Parameters:</strong>{" "}
          <span className="text-white text-xs">{apiQueryParams}</span>
          <br />
          <strong className="my-3">Response Type:</strong>{" "}
          <div className="bg-black mt-2 bg-opacity-90 text-white py-2 px-3  rounded-tl-md rounded-tr-md flex justify-start items-center">
            JSON
          </div>
          <pre className="code bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 overflow-hidden rounded-bl-md rounded-br-md">
            {apiResponse}
          </pre>
          <br />
          <strong>Request Example:</strong>
          <div className="relative">
            <div className="bg-black bg-opacity-90 text-white py-2 px-3  rounded-tl-md rounded-tr-md flex justify-start items-center">
              Axios
            </div>
            <pre className="code bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 overflow-hidden rounded-bl-md rounded-br-md">
              {apiExample}
            </pre>
            <IconButton
              className="absolute top-1 right-1 text-sm text-white "
              aria-label="Copy"
              onClick={() => copyToClipboard(apiExample)}
            >
              <FaCopy className="" />
            </IconButton>
          </div>
        </div>
      </AccordionDetails>
    </Accordion>
  );
};

export default ApiAccordion;
