"use client";
import React, { useEffect, useState } from "react";
import ApiAccordion from "./ApiAccordion";
import checkApis from "@/apiHelper/checkApis";
export default function StatusPage() {
  const [apiStatus, setApiStatus] = useState<any>({
    collection: "loading",
    inscription: "loading",
    search: "loading",
    apiKeyCreate: "loading",
    apiKeyDetail: "loading",
    ordapiFeed: "loading",
    toolsField: "loading",
  });
  // Call the function immediately when the component mounts
  const initialCheck = async () => {
    const results = await checkApis();

    if (results) {
      results.forEach((result) => {
        setApiStatus((prevState: any) => ({
          ...prevState,
          [result.name]: result.status,
        }));
      });
    }
  };
  useEffect(() => {
    initialCheck();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">
        Ordinalnovus API{" "}
        <span className="ml-3 bg-gray-700 text-white py-1 px-2 rounded-xl text-sm">
          https://api.ordinalnovus.com/api
        </span>
      </h1>
      <ApiAccordion
        apiName="Create API Key"
        apiStatus={apiStatus.apiKeyCreate}
        apiRoute="/apikey/create"
        apiMethod="POST"
        apiQueryParams="wallet (required)"
        apiResponse={`{
    "message": "API key created successfully.",
    "apiKey": "09b92b2d-1311-47d8-9131-fade4e2e15ca"
}`}
        apiExample={`axios.post('/apikey/create', { wallet: 'your-wallet-address' })
  .then(response => {
    // Handle the response data here
  })
  .catch(error => {
    console.error(error);
    // Handle the error here
  });`}
      />

      <ApiAccordion
        apiName="Get API Key Details"
        apiStatus={apiStatus.apiKeyDetail}
        apiRoute="/apikey/[generated apikey]"
        apiMethod="GET"
        apiResponse={`{
    "success": true,
    "usage": 244,
    "userType": "gold",
    "rateLimit": 1000,
    "expirationDate": "resetting in 43 minutes"
}`}
        apiExample={`axios.get('/apikey/your-api-key-here')
  .then(response => {
    // Handle the response data here
  })
  .catch(error => {
    console.error(error);
    // Handle the error here
  });`}
      />

      <ApiAccordion
        apiName="Collection Data API (V2)"
        apiStatus={apiStatus.collection}
        apiRoute="/collection"
        apiMethod="GET"
        apiQueryParams="apiKey (required), _limit, _start, _sort, name, _id, slug, supply, featured, verified"
        apiResponse={`{
    "collections": [
        {
            "_id": "648fc1b9e01b2b2af5895a9e",
            "name": "Bitcoin Apes",
            "inscription_icon": {
                "_id": "64891d38728b79bb5099c508",
                "inscriptionId": "195185a771baa02f53afc501b793ec8da3be328856d54e2cef656b085d722c43i0",
                "number": 647386,
                "content_type": "image/png"
            },
            "supply": 10000,
            "slug": "bitcoinapes",
            "description": "Bitcoin Apes are byte-perfect inscriptions of the Ethereum-based apes to the Bitcoin blockchain using Ordinals. They are fully on-chain, Bitcoin native, and completely decentralized digital artifacts.\n\nBitcoin Apes is not affiliated or associated with Yuga Labs.",
            "twitter_link": "https://twitter.com/BitcoinApes_",
            "discord_link": "https://discord.com/invite/bitcoin-apes",
            "website_link": "https://bitcoinapes.com/",
            "live": true,
            "featured": true,
            "blockchain": "btc",
            "flagged": false,
            "banned": false,
            "verified": true,
            "updatedBy": "cronjob",
            "type": "official",
            "tags": [],
            "favourites": [],
            "volume": 0,
            "updated": 10000,
            "errored": 0,
            "erroredInscriptions": [],
            "priority": 0,
            "created_at": "2023-06-19T02:47:21.736Z",
            "updated_at": "2023-07-13T03:31:56.035Z",
            "__v": 0,
            "min": 8962,
            "max": 586263
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1
    }
}`}
        apiExample={`
  axios.get('/collection?apiKey=09b92b2d-1311-47d8-9131-fade4e2e15ca&slug=bitcoinapes')
  .then(response => {
    // Handle the response data here
  })
  .catch(error => {
    console.error(error);
    // Handle the error here
  });`}
      />
      <ApiAccordion
        apiName="Inscription Data API (V2)"
        apiStatus={apiStatus.inscription}
        apiRoute="/inscription"
        apiMethod="GET"
        apiQueryParams="apiKey (required), sha, inscriptionId, content_type, _id, official_collection, sat, sat_name, rarity, block, content, content_type, sat_offset, number, show, _limit, _start, _sort"
        apiResponse={`{
    "inscriptions": [
        {
            "_id": "64906bf1041073803de7b4bb",
            "inscriptionId": "e0e0ea646bffd69b304f0beeb135c8c17b35494f5490868af988559e22058d2bi0",
            "sha": "8e68a43ee0291149dac9041d8072ba849f5840195752babe1625ba6d29d6f374",
            "number": 11823564,
            "content_type": "text/css",
            "rarity": "common",
            "timestamp": "2023-06-14T06:16:36.000Z",
            "address": "bc1pvavm5mkt2edyspd34704nlq0nwn8wefu0r057yrxnu4mjsk8tjks25xuf3"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 1
    }
}`}
        apiExample={`axios.get('/inscription?apiKey=09b92b2d-1311-47d8-9131-fade4e2e15ca&inscriptionId=e0e0ea646bffd69b304f0beeb135c8c17b35494f5490868af988559e22058d2bi0')
  .then(response => {
    // Handle the response data here
  })
  .catch(error => {
    console.error(error);
    // Handle the error here
  });`}
      />
      <ApiAccordion
        apiName="Ord Feed API"
        apiStatus={apiStatus.ordapiFeed}
        apiRoute="/ordapi/feed"
        apiMethod="GET"
        apiQueryParams="apiKey (required)"
        apiResponse={`[
    {
        "inscriptionId": "1bd498822496b16b32ea35b478819f0b090d5551f1377d83b7acd2f473e370f7i0",
        "title": "Inscription 17343392",
        "number": 17343392,
        "content_type": "text/plain;charset=utf-8",
        "content": {
            "p": "brc-20",
            "op": "transfer",
            "tick": "OXBT",
            "amt": "5000"
        }
    }]`}
        apiExample={`axios.get('/ordapi/feed?apiKey=09b92b2d-1311-47d8-9131-fade4e2e15ca')
  .then(response => {
    // Handle the response data here
  })
  .catch(error => {
    console.error(error);
    // Handle the error here
  });`}
      />
      <ApiAccordion
        apiName="Search Inscription Data (V2)"
        apiStatus={apiStatus.search}
        apiRoute="/search"
        apiMethod="GET"
        apiQueryParams="id (required)"
        apiResponse={`{
    "statusCode": 200,
    "message": "Fetched Latest Inscription data successfully",
    "data": {
        "inscriptions": [
            {
                "lists": [],
                "inscriptionId": "e5c736d2bb4191f4dc9f0aba61620b06124416cab39cbd10ba1b9cd1c46d59cei0",
                "sha": "87ea6e9691ae1c482786b37bd3008977e5c4872f04f527f3d3229af4a877fea4",
                "number": 4500,
                "content_type": "image/svg+xml",
                "flagged": false,
                "banned": false,
                "tags": [],
                "listed": false,
                "error": false,
                "block": 481770,
                "content_length": 1468,
                "cycle": 0,
                "decimal": "481770.585553270",
                "degree": "0°61770′1962″585553270‴",
                "epoch": 2,
                "genesis_address": "bc1psuyx7nscs9vftk333detssfc5uz4t3ze4g8mz7wm084v3m38dg7qxdmgc3",
                "genesis_fee": 10584,
                "genesis_height": 775161,
                "location": "e5c736d2bb4191f4dc9f0aba61620b06124416cab39cbd10ba1b9cd1c46d59ce:0:0",
                "percentile": "78.67681368431928%",
                "period": 238,
                "preview": "e5c736d2bb4191f4dc9f0aba61620b06124416cab39cbd10ba1b9cd1c46d59cei0",
                "rarity": "common",
                "sat": 1652213085553270,
                "sat_name": "cdlgqqtrjlj",
                "sat_offset": 585553270,
                "timestamp": "2023-02-05 13:46:04 UTC",
                "genesis_transaction": "e5c736d2bb4191f4dc9f0aba61620b06124416cab39cbd10ba1b9cd1c46d59ce",
                "attributes": [
                    {
                        "number": 875,
                        "color": "green",
                        "rarity": "uncommon",
                        "percent": "27.4%"
                    }
                ],
                "name": "Bitcoin JPEG #875",
                "official_collection": {
                    "_id": "648fc1ade01b2b2af58959f9",
                    "name": "Bitcoin JPEGs",
                    "inscription_icon": {
                        "_id": "648ded8fe01b2b2af5365837",
                        "inscriptionId": "bfb451e0025ae6e6a9b3fc11bf127626f0d363c7a065d6b7f755b73032a71478i0",
                        "content_type": "image/png"
                    },
                    "supply": 1000,
                    "slug": "bitcoin-jpgs",
                    "description": "The first and only collection of 1000 Artifacts under 5k Ordinals",
                    "featured": false,
                    "verified": false
                },
                "_links": {
                    "content": {
                        "href": "/content/e5c736d2bb4191f4dc9f0aba61620b06124416cab39cbd10ba1b9cd1c46d59cei0"
                    },
                    "genesis_transaction": {
                        "href": "/tx/e5c736d2bb4191f4dc9f0aba61620b06124416cab39cbd10ba1b9cd1c46d59ce"
                    },
                    "next": {
                        "href": "/inscription/6193ead9849920ecf960bcd9edffdf2c6949adc3b931d047a0d56ff821dfe2cfi0"
                    },
                    "output": {
                        "href": "/output/e5c736d2bb4191f4dc9f0aba61620b06124416cab39cbd10ba1b9cd1c46d59ce:0"
                    },
                    "prev": {
                        "href": "/inscription/991c20f455b21abeb83f596e1762fa572b5d659c623b9904d1c9fed893837ccdi0"
                    },
                    "preview": {
                        "href": "/preview/e5c736d2bb4191f4dc9f0aba61620b06124416cab39cbd10ba1b9cd1c46d59cei0"
                    },
                    "sat": {
                        "href": "/sat/1652213085553270"
                    },
                    "self": {
                        "href": "/inscription/e5c736d2bb4191f4dc9f0aba61620b06124416cab39cbd10ba1b9cd1c46d59cei0"
                    }
                },
                "address": "bc1psuyx7nscs9vftk333detssfc5uz4t3ze4g8mz7wm084v3m38dg7qxdmgc3",
                "offset": 0,
                "output": "e5c736d2bb4191f4dc9f0aba61620b06124416cab39cbd10ba1b9cd1c46d59ce:0",
                "output_value": 10000
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 10,
            "total": 1
        }
    }
}`}
        apiExample={`axios.get('/search?id=your-id-here')
  .then(response => {
    // Handle the response data here
  })
  .catch(error => {
    console.error(error);
    // Handle the error here
  });`}
      />
      <ApiAccordion
        apiName="Get data of multiple inscriptions"
        apiStatus={apiStatus.toolsField}
        apiRoute="/tools/field"
        apiMethod="POST"
        apiQueryParams={`{
    "inscriptionIds": ["e0e0ea646bffd69b304f0beeb135c8c17b35494f5490868af988559e22058d2bi0", "f90c74f6a2f4cf6ba73312b444596c4f34641d72ba9dda049d26751ee1a908e8i0"],
    "field": "address"
}`}
        apiResponse={`{
    "inscriptions": [
        {
            "_id": "64906bf1041073803de7b4bb",
            "inscriptionId": "e0e0ea646bffd69b304f0beeb135c8c17b35494f5490868af988559e22058d2bi0",
            "number": 11823564,
            "address": "bc1pvavm5mkt2edyspd34704nlq0nwn8wefu0r057yrxnu4mjsk8tjks25xuf3"
        },
        {
            "_id": "6490e5e7041073803d0414ea",
            "inscriptionId": "f90c74f6a2f4cf6ba73312b444596c4f34641d72ba9dda049d26751ee1a908e8i0",
            "number": 12756019,
            "address": "1KwApib6ksch2ZfpbXrs5uEvjkAudnQFj2"
        }
    ]
}`}
        apiExample={`const data = {
        inscriptionIds: [
          "e0e0ea646bffd69b304f0beeb135c8c17b35494f5490868af988559e22058d2bi0",
          "f90c74f6a2f4cf6ba73312b444596c4f34641d72ba9dda049d26751ee1a908e8i0",
        ],
        field: "address",
      };
      const config = {
        headers: {
          "X-API-KEY": process.env.NEXT_PUBLIC_API_KEY, 
        },
      };
      axios
        .post(url, data, config)
        .then((res) => {
        })
        .catch((error) => {
        });`}
      />

      {/* Repeat the above Accordion component for each API */}
    </div>
  );
}
