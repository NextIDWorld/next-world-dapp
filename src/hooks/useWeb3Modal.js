import { useCallback,useMemo, useState } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

const RPC = "https://scroll-sepolia.blockpi.network/v1/rpc/public";
const NETID = 534351;

const providerOptions = {

  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      rpc:{
        534351: RPC
      }
    }
  }


};

const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions
});
// Register the web3modal so the connector has access to it.

function useWeb3Modal(config = {}) {
  const [provider, setProvider] = useState(new ethers.JsonRpcProvider(RPC));
  const [coinbase, setCoinbase] = useState();
  const [netId , setNetId] = useState(NETID);
  const [connecting , setConnecting] = useState();
  const [noProvider , setNoProvider] = useState();

  const [autoLoaded, setAutoLoaded] = useState(false);
  // Web3Modal also supports many other wallets.
  // You can see other options at https://github.com/Web3Modal/web3modal
  const logoutOfWeb3Modal = useCallback(
    async function () {
      await web3Modal.clearCachedProvider();
      setCoinbase();
      setNetId(NETID);
      setProvider(new ethers.JsonRpcProvider(RPC));
    },
    [],
  );
  // Open wallet selection modal.
  const loadWeb3Modal = useCallback(async () => {

    try{
      setConnecting(true)
      setAutoLoaded(true);
      const conn = await web3Modal.connect();
      const newProvider = new ethers.BrowserProvider(conn,"any");
      const signer = await newProvider.getSigner()
      const newCoinbase = await signer.getAddress();
      const {chainId} = await newProvider.getNetwork();
      setProvider(newProvider);
      setCoinbase(newCoinbase);
      setNetId(chainId);
      setNoProvider(true);
      setConnecting(false);
      conn.on('accountsChanged', accounts => {
        const newProvider = new ethers.BrowserProvider(conn,"any");
        setProvider(newProvider)
        setCoinbase(accounts[0]);
      });
      conn.on('chainChanged', async chainId => {
        window.location.reload();
      });
      // Subscribe to provider disconnection
      conn.on("disconnect", async (error: { code: number; message: string }) => {
        logoutOfWeb3Modal();
      });
      conn.on("close", async () => {
        logoutOfWeb3Modal();
      });

      return;
    } catch(err){
      console.log(err);
      setConnecting(false)
      logoutOfWeb3Modal();
    }

  }, [logoutOfWeb3Modal]);




  // If autoLoad is enabled and the the wallet had been loaded before, load it automatically now.
  useMemo(() => {
    if (!autoLoaded && web3Modal.cachedProvider) {
      setAutoLoaded(true);
      loadWeb3Modal();
      setNoProvider(true);
    }
  },[autoLoaded,loadWeb3Modal]);



  return({provider, loadWeb3Modal, logoutOfWeb3Modal,coinbase,netId,connecting});
}



export default useWeb3Modal;
