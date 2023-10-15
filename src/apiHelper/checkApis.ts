"use server";
import axios from "axios";
const api = process.env.NEXT_PUBLIC_API;

const checkApis = async () => {
  const apiCalls = [
    (() => {
      const url = `${api}/apikey/create`;
      // console.log("Fetching data from:", url);
      return axios
        .post(url, {
          wallet:
            "bc1plsnrsv33djf28eqm8dr4dfaxgnhvu3flcyft58fu3zhdp4af04fqtvfpex",
        })
        .then((res) => {
          // console.log("Response in apiKeyCreate:", res.data);

          return {
            name: "apiKeyCreate",
            status: "success",
            response: res.data,
          };
        })
        .catch((error) => {
          console.error("Error in apiKeyCreate:", error.message);
          if (error.response.status === 400) {
            return {
              name: "apiKeyCreate",
              status: "success",
            };
          }
          return {
            name: "apiKeyCreate",
            status: "error",
            error: error.message,
          };
        });
    })(),
    (() => {
      const url = `${api}/apikey/09b92b2d-1311-47d8-9131-fade4e2e15ca`;
      // console.log("Fetching data from:", url);
      return axios
        .get(url)
        .then((res) => {
          // console.log("Response in apiKeyDetail:", res.data);
          return {
            name: "apiKeyDetail",
            status: "success",
            response: res.data,
          };
        })
        .catch((error) => {
          console.error("Error in apiKeyDetail:", error.message);
          return {
            name: "apiKeyDetail",
            status: "error",
            error: error.message,
          };
        });
    })(),
    (() => {
      const url = `${api}/v2/collection?apikey=${process.env.API_KEY}`;
      return axios
        .get(url)
        .then((res) => {
          return { name: "collection", status: "success", response: res.data };
        })
        .catch((error) => {
          console.error("Error in collection:", error.message);
          return { name: "collection", status: "error", error: error.message };
        });
    })(),
    (() => {
      const url = `${api}/ordapi/feed?apiKey=${process.env.API_KEY}`;
      // console.log("Fetching data from:", url);
      return axios
        .get(url)
        .then((res) => {
          return { name: "ordapiFeed", status: "success", response: res.data };
        })
        .catch((error) => {
          console.error("Error in ordapiFeed:", error.message);
          return { name: "ordapiFeed", status: "error", error: error.message };
        });
    })(),
    (() => {
      const url = `${api}/v2/inscription?apikey=${process.env.API_KEY}`;
      // console.log("Fetching data from:", url);
      return axios
        .get(url)
        .then((res) => {
          return { name: "inscription", status: "success", response: res.data };
        })
        .catch((error) => {
          console.error("Error in inscription:", error.message);
          return { name: "inscription", status: "error", error: error.message };
        });
    })(),
    (() => {
      const url = `${api}/v2/search?id=12&apikey=${process.env.API_KEY}`;
      // console.log("Fetching data from:", url);
      return axios
        .get(url)
        .then((res) => {
          return { name: "search", status: "success", response: res.data };
        })
        .catch((error) => {
          console.error("Error in search:", error.message);
          return { name: "search", status: "error", error: error.message };
        });
    })(),

    (() => {
      const url = `${api}/tools/field?apiKey=${process.env.API_KEY}`;
      const data = {
        inscriptionIds: [
          "e0e0ea646bffd69b304f0beeb135c8c17b35494f5490868af988559e22058d2bi0",
          "f90c74f6a2f4cf6ba73312b444596c4f34641d72ba9dda049d26751ee1a908e8i0",
        ],
        field: "address",
      };
      const config = {
        headers: {
          "X-API-KEY": process.env.API_KEY, // or 'Authorization': `Bearer ${process.env.API_KEY}`
        },
      };
      return axios
        .post(url, data, config)
        .then((res) => {
          return { name: "toolsField", status: "success", response: res.data };
        })
        .catch((error) => {
          console.error("Error in toolsField:", error.message);
          return { name: "toolsField", status: "error", error: error.message };
        });
    })(),
  ];
  const results = await Promise.all(apiCalls);

  // console.log(results, "RES");
  return results;
};

export default checkApis;
