import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import { ethers } from 'ethers';


export interface Token {
  symbol?: string;
  name?: string;
  rank?: string;
  platform?: Platform;
  abi?: string;
  id?: number
}
export interface Platform {
  name?: string;
  token_address?: string;
}

export interface Erc20Properties {
  total_supply?: string;
  name?: string;
  decimals?: string;
}

const coinmarketcap = axios.create({
  baseURL: 'https://pro-api.coinmarketcap.com/v1',
  headers: {'X-CMC_PRO_API_KEY': 'e8485e87-a832-45ad-ab42-d6e1e6ffbb50'}
});

function App() {
  const [error, setError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [data, setData] = useState([]);
  const [token, setToken] = useState<Token>();  
  const [price, setPrice] = useState();
  const [abi, setAbi] = useState();
  const [erc20Properties, setErc20Properties] = useState<Erc20Properties>();



  const getPrice = (id: number) => {
    coinmarketcap.get('/cryptocurrency/quotes/latest', {
      params: {
        id: id,
      }    
    })
      .then(function (response) {
        const data = response.data.data

        const price = data[id].quote.USD.price
        setPrice(price.toFixed(2));
        setIsLoaded(true);
      })
      .catch(function (error) {
        setError("Error getting quotes for this ticker");
      })
  }

  async function get_data_from_blockchain(_token: Token, abi: any, ) {
    setErc20Properties({ total_supply: '', decimals: '', name: '' });
    let infuraProvider = new ethers.providers.InfuraProvider('mainnet');
    const tokenContract = new ethers.Contract(_token?.platform?.token_address as string, abi, infuraProvider);
  
    const value = await tokenContract.totalSupply();

    const decimals = await tokenContract.decimals();
    const name = await tokenContract.name();
    const totalSupply = BigInt(parseInt(value)).toString();
    setErc20Properties({ total_supply: totalSupply, decimals: decimals.toString(), name: name });
  
    setIsLoaded(true);
  }

  const search = (e: any) => {
    e.preventDefault();
    const { symbol } = e.target.elements
    setToken({ symbol: symbol.value });
    const _token = data.find((x: any) => x.symbol === symbol.value.toUpperCase()) || {} as Token
    setToken(_token)

    getPrice(_token.id as number);

    if (_token?.platform?.token_address) {
      console.log("getting abi")
      axios.get('https://api.etherscan.io/api',
        {
          params: {
            module: 'contract',
            action: 'getabi',
            address: _token.platform.token_address,
            apikey: 'KV8J6J9BJDC462NEVH4VY3RSQX8B5CZ5FY'
          }
        })
        .then(async function (response) {
          const abi = response.data.result
          setAbi(abi);
        
          await get_data_from_blockchain(_token, abi);

        })
        .catch(function (error) {
          setError(error.response);
        })
    }




  }

  useEffect(() => {

    coinmarketcap.get('/cryptocurrency/map?aux=platform')
      .then(function (response) {
        const data = response.data.data
        setData(data);
        setIsLoaded(true);

      })
      .catch(function (error) {
        setError('Error in request');
      })

  }, [])

  if (error) {
    return <h3 className="error"> {error} </h3>
  } 
  else if (!isLoaded) {
    return <div>Loading...</div>;
  } 
  else {
    return (
      <div className="col d-flex justify-content-center">
        <div className="card border-dark mb-3 m-5">
          <h2 className="card-header ">
          Crypto Tracker
          </h2>
          <div className="card-body s-3">
          <form className="center-block" onSubmit={search}>
            <input type="text" defaultValue="LINK" id="symbol" />
            <input type="submit" />
          </form>
          <br />
          <div style={{ fontWeight: `bold` }}>Data from CoinMarketCap</div>
          <div>Name: {token?.name}</div>
          <div>Symbol: {token?.symbol}</div>
          <div>Rank: {token?.rank}</div>
          <div>Price: ${price}</div>
          {
            token?.platform &&
            <div>
              <div>Blockchain: {token.platform.name}</div>
              <div>Token Address: {token.platform.token_address}</div>
              <br />
              <div style={{ fontWeight: `bold` }}>Data from blockchain</div>
              <div>Name: {erc20Properties?.name}</div>
              <div>Total Supply: {erc20Properties?.total_supply}</div>
              <div>decimals: {erc20Properties?.decimals}</div>
              <br />
              <div style={{ fontWeight: `bold` }}>ABI</div>
              <pre style={{ float: `left`, height: `40px`, width: `500px`, border: `1px solid #ccc`, overflow: `auto` }}>
                {abi}
              </pre>
            </div>
          }
          </div>
          </div>
        </div>
    );
  }
}
export default App;


