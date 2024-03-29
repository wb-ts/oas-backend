const axios = require("axios").default;
const cors = require("cors");
const express = require("express");

const port = process.env.PORT || 8080

if (process.env.NODE_ENV !== "production") {

  require("dotenv").config()

}

const app = express();

const opensea_x_api_key = process.env.OPENSEA_X_API_KEY || "";
const moralis_x_api_key = process.env.MORALIS_X_API_KEY || "";
const domainsFromEnv = process.env.CORS_DOMAINS || ""

const whitelist = domainsFromEnv.split(",").map(item => item.trim());

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true,
}
app.use(cors(corsOptions));

const getListings = async (asset_contract_address , token_id) => {
  console.log("###", asset_contract_address , token_id);
  const options = {
    method: 'GET',
    url: `https://api.opensea.io/api/v1/asset/${asset_contract_address}/${token_id}/listings`,
    headers: {
      Accept: 'application/json',
      "x-api-key": opensea_x_api_key
    }
  };
  const result = await axios.request(options)
  .then( (response) => {
    return response.data.listings
  })
  .catch(async (error) => {
    console.log(error);
    return await getListings(asset_contract_address , token_id);
  });

  return result;
}


app.get("/getAssets/:collection_slug/:offset", async (req, res) => {
  let offset = req.params.offset , collection_slug = req.params.collection_slug , err_msg = "" ;

  const options = {
      method: 'GET',
      url: `https://api.opensea.io/api/v1/assets?collection_slug=${collection_slug}&limit=50&offset=${offset}`,
      headers: {
          Accept: 'application/json',
          "x-api-key": opensea_x_api_key
      }
  };
  const result = await axios.request(options)
  .then( (response) => {
      return response.data 
  })
  .catch((error) => {
      console.log(error);
      err_msg = error;
  });

  if( !err_msg ) res.send(result.assets);

});

app.get("/getListings/:asset_contract_address/:token_id", async (req, res) => {
  let asset_contract_address = req.params.asset_contract_address , token_id = req.params.token_id ;
  const result = await getListings(asset_contract_address , token_id);

  res.send(result);
})

app.get("/getTransactions/:asset_contract_address/:token_id", async (req, res) => {
  let asset_contract_address = req.params.asset_contract_address , token_id = req.params.token_id ;
  const options = {
    method: 'GET',
    url: `https://deep-index.moralis.io/api/v2/nft/${asset_contract_address}/${token_id}/transfers?chain=eth&format=decimal`,
    headers: {
      Accept: 'application/json',
      "x-api-key": moralis_x_api_key
    }
  };
  const result = await axios.request(options)
  .then( (response) => {
    return response.data.result
  })
  .catch((error) => {
    console.log(error);
  });

  res.send(result);
})

app.use(express.static('./build'));

app.listen(port, function() {
  console.log('Server is running on port:' , 8080);
})