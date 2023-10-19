import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

import {
  Box,
  Tab,
  Tabs,
  Spinner,
  Text,
} from 'grommet';



import { AppContext, useAppState } from './hooks/useAppState'
import useWeb3Modal from './hooks/useWeb3Modal';
import useNextID from './hooks/useNextID';


import Game from './Game';

import MainHeader from './components/MainHeader';
import GameHeader from './components/GameHeader';
import Instructions from './components/Instructions';

import addresses from './contracts/addresses';
import abis from './contracts/abis';

export default function App() {

  const { state, actions } = useAppState();

  const [gameContract,setGameContract] = useState();

  const {
    loadWeb3Modal,
    provider,
    coinbase,
    netId
  } = useWeb3Modal();

  const {
    renderNextIdBox
  } = useNextID();

  useEffect(() => {
    actions.setProvider(provider);
    actions.setCoinbase(coinbase);
    actions.setNetId(Number(netId));
    if(gameContract){
      actions.setGameContract(gameContract);
    }

  }, [
    coinbase,
    provider,
    netId,
    gameContract
  ]);

  useEffect(() => {
  let newGameContract;
  if (netId === 534351) {
    newGameContract = new ethers.Contract(addresses.game.test_scroll, abis.game, provider);

  }
  setGameContract(newGameContract);

}, [netId, provider])

  const getMetadata = item => {
    return (
      new Promise(async (resolve, reject) => {
        try {
          let uri;
          let tokenURI;
          const contractAddress = item.id.split("/")[0];
          //ERC1155
          if (item.token) {
            tokenURI = item.token.uri;
          } else {
            tokenURI = item.uri;
          }

          let returnObj = {
            uri: tokenURI
          }

          if (!tokenURI) {
            resolve({});
          }
          if (!tokenURI.includes("://")) {
            uri = `https://ipfs.io/ipfs/${tokenURI}`;
          } else if (tokenURI.includes("ipfs://ipfs/")) {
            uri = tokenURI.replace("ipfs://ipfs/", "https://ipfs.io/ipfs/");
          } else if (tokenURI.includes("ipfs://") && !tokenURI.includes("https://ipfs.io/ipfs/")) {
            uri = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/");
          } else if (tokenURI.includes("data:application/json;base64")) {
            uri = tokenURI.replace("data:application/json;base64,", "");
          } else {
            uri = tokenURI;
          }
          let metadataToken;
          if (tokenURI.includes("data:application/json;base64")) {
            metadataToken = JSON.parse(atob(tokenURI.replace("data:application/json;base64,", "")));
          } else {
            metadataToken = JSON.parse(await (await fetch(uri)).text());
          }
          returnObj.address = contractAddress;
          returnObj.metadata = metadataToken;
          resolve(returnObj)
        } catch (err) {
          resolve({});
        }
      })
    )
  }





  return (
    <AppContext.Provider value={{ state, actions }}>
      <Game />
      <Box id="blocker">
        <MainHeader />
        <Box align="center" className='menu_box'>
          <GameHeader
            loadWeb3Modal={loadWeb3Modal}
            renderNextIdBox={renderNextIdBox}
          />
          <Instructions />
        </Box>
      </Box>
      <Box id="canvas-container" align="center">
      </Box>
    </AppContext.Provider>
  )
}
