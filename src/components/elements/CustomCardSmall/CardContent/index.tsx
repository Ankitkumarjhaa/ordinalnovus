import React, { useEffect, useState } from "react";

import CircularProgress from "@mui/material/CircularProgress";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import STL from "../../STLViewer";
import GLTF from "../../GLTFViewer";

import JSZip from "jszip";

type CardContentProps = {
  inscriptionId: string;
  content_type?: string;
  content?: string;
  className?: string;
  showTag?: boolean;
};

const CardContent: React.FC<CardContentProps> = ({
  inscriptionId,
  content_type,
  content,
  className,
  showTag = false,
}) => {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [fetchedContent, setFetchedContent] = useState<string | undefined>(
    content
  );
  const [fetchedContentType, setFetchedContentType] = useState<
    string | undefined
  >(content_type);

  useEffect(() => {
    setIsLoading(true); // Set isLoading to true when starting the fetch
    fetch(`/content/${inscriptionId}`)
      .then((response: any) => {
        if (!response.ok) {
          throw new Error("HTTP error " + response.status);
        }
        setFetchedContentType(response?.headers?.get("Content-Type") + "");

        // Check the content type to decide how to parse the response
        const contentType = response?.headers?.get("Content-Type") + "";
        if (
          contentType === "application/zip" ||
          contentType === "application/x-zip-compressed"
        ) {
          // For zip files, use arrayBuffer
          return response.arrayBuffer();
        } else {
          // For other content types, use text
          return response.text();
        }
      })
      .then((data) => {
        setFetchedContent(data);
      })
      .catch((error) => {
        console.error("Fetching error: ", error);
      })
      .finally(() => {
        setIsLoading(false); // Set isLoading to false when fetch is completed
      });
  }, [inscriptionId]);

  const renderContent = () => {
    const contentType = fetchedContentType
      ? fetchedContentType
      : "No content type provided";
    switch (contentType) {
      case "image/jpeg":
      case "image/png":
      case "image/gif":
      case "image/webp":
      case "image/avif":
      case "image/svg+xml":
        //@ts-ignore
        return (
          <div
            className={`${
              className ? className : "w-full h-full center p-2 no-scrollbar"
            }`}
          >
            <img
              style={{
                imageRendering: "pixelated",
                width: "inherit",
                height: "inherit",
              }}
              className=""
              src={`/content/${inscriptionId}`}
              alt={inscriptionId}
            />
          </div>
        );
      case "audio/mpeg":
      case "audio/midi":
      case "audio/mod":
        return (
          <div className="w-full h-full center">
            <audio
              className="w-11/12 "
              src={`/content/${inscriptionId}`}
              controls
            />
          </div>
        );
      case "video/mp4":
      case "video/avi":
      case "video/webm":
        return (
          <video
            className="object-cover w-full h-full"
            muted
            autoPlay
            src={`/content/${inscriptionId}`}
            controls
          />
        );
      case "application/json":
        let jsonContent;
        try {
          jsonContent = JSON.stringify(
            JSON.parse(fetchedContent + ""),
            null,
            2
          );
        } catch (error) {
          console.error("Error parsing JSON: ", error);
          jsonContent = fetchedContent;
        }
        return (
          <pre className="whitespace-pre-wrap p-2 text-white">
            {jsonContent}
          </pre>
        );
      case "text/plain":
      case "text/javascript":
      case "text/plain;charset=utf-8":
      case "application/javascript":
        let parsedJson;
        try {
          parsedJson = JSON.parse(fetchedContent + "");
        } catch (error) {
          parsedJson = null;
        }

        if (parsedJson) {
          // If the content is valid JSON, display it as JSON
          let jsonContent;
          try {
            jsonContent = JSON.stringify(parsedJson, null, 2);
          } catch (error) {
            console.error("Error parsing JSON: ", error);
            jsonContent = fetchedContent;
          }
          return (
            <pre className="whitespace-pre-wrap p-2 text-white">
              {jsonContent}
            </pre>
          );
        } else {
          // If the content is not JSON, display it as plain text
          return (
            <pre className="whitespace-pre-wrap p-2 text-sm text-white">
              {fetchedContent}
            </pre>
          );
        }

      case "text/markdown":
        return (
          <div className="p-2">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="markdown-content overflow-scroll" // Add a CSS class to the ReactMarkdown component
              components={{
                p: ({ children }) => (
                  <p className="text-gray-500 text-xs py-2">{children}</p>
                ),
                h1: ({ children }) => (
                  <h1 className="text-white text-xl underline uppercase pt-4 pb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-white text-lg font-bold pb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-gray-400 text-md font-medium pb-2">
                    {children}
                  </h3>
                ),
                span: ({ children }) => (
                  <span className="text-gray-300">{children}</span>
                ),
                a: ({ children, href }) => (
                  <a className="text-blue-500 hover:text-blue-700" href={href}>
                    {children}
                  </a>
                ),
                br: () => <br />,
                hr: () => <hr className="border-gray-400 my-4" />,
                ul: ({ children }) => (
                  <ul className="list-disc ml-6">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal ml-6">{children}</ol>
                ),
                li: ({ children }) => <li>{children}</li>,
                // Add styling for other Markdown elements as needed
              }}
            >
              {fetchedContent + ""}
            </ReactMarkdown>
          </div>
        );
      case "application/pdf":
        return (
          <iframe
            className="no-scrollbar"
            src={`/content/${inscriptionId}`}
            style={{ width: "100%", height: "100%" }}
          />
        );
      case "text/html;charset=utf-8":
        return (
          <iframe
            sandbox="allow-scripts"
            className="no-scrollbar"
            src={`/content/${inscriptionId}`}
            style={{ minWidth: "100%", minHeight: "100%" }}
          />
        );
      case "model/stl":
        return <STL url={`/content/${inscriptionId}`} />;
      case "model/gltf-binary":
        return <GLTF url={`/content/${inscriptionId}`} />;
      case "application/zip":
      case "application/x-zip-compressed":
      case "application/zip":
      case "application/x-zip-compressed":
        // Load and read the contents of the zip file using JSZip
        const zip = new JSZip();
        //@ts-ignore
        zip.loadAsync(fetchedContent).then((zip) => {
          let names: string[] = [];
          zip.forEach((relativePath, file) => {
            names.push(relativePath);
          });
          setFileNames(names);
        });
        return (
          <div className="p-2">
            <h4 className="uppercase text-center font-bold pb-2 text-white">
              Zip Archive
            </h4>
            <ul>
              {fileNames.map((name, index) => (
                <li className="text-xs underline " key={index}>
                  {name}
                </li>
              ))}
            </ul>
          </div>
        );
      default:
        return <div>Unsupported content type: {contentType}</div>;
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden no-scrollbar">
      {showTag && fetchedContent && fetchedContent.includes(`"p":"brc-20"`) && (
        <span className="px-2 py-1 rounded-xl border border-yellow-500 bg-yellow-300 text-yellow-800 text-xs font-bold">
          BRC 20
        </span>
      )}
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <CircularProgress /> {/* Display the loading component */}
        </div>
      ) : fetchedContent ? (
        renderContent()
      ) : (
        <div className="flex justify-center items-center h-full">
          <CircularProgress /> {/* Display the loading component */}
        </div>
      )}
    </div>
  );
};

export default CardContent;
