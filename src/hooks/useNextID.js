import { useState,useEffect } from "react";
import { ethers } from "ethers";
import * as ethUtil from 'ethereumjs-util';
import * as secp256k1 from 'secp256k1';
import {
  Box,
  Paragraph,
  Button
 } from 'grommet';


const PROOF_API_URL = 'https://proof-service.next.id'
const KV_API_URL = 'https://kv-service.next.id'

function useNextID() {



  const [proof,setProof] = useState();
  const [avatar,setAvatar] = useState();
  const [kv,setKV] = useState();

  const [pubkey, setPubKey] = useState();


  const personalSign = async (message,provider) => {

    const signer = await provider.getSigner();
    const messageHash = ethers.hashMessage(message);
    const signature = await signer.signMessage(message);

    console.log('Message Hash:', messageHash);
    console.log('Signature:', signature);

    // Convert hex signature to Uint8Array
    const signatureMatch = signature.slice(2).match(/.{1,2}/g);
    if (!signatureMatch) {
      throw new Error('Invalid signature format');
    }
    const signatureBytes = new Uint8Array(signatureMatch.map(byte => parseInt(byte, 16)));

    // Ensure signatureBytes is 64 bytes long
    if (signatureBytes.length !== 65) {
      throw new Error('Invalid signature length');
    }

    // Convert message hash to Uint8Array
    const messageHashMatch = messageHash.slice(2).match(/.{1,2}/g);
    if (!messageHashMatch) {
      throw new Error('Invalid message hash format');
    }
    const messageHashBytes = new Uint8Array(messageHashMatch.map(byte => parseInt(byte, 16)));

    // Recover the public key
    const recoveredPublicKey = secp256k1.ecdsaRecover(
      signatureBytes.slice(0, 64), // Exclude the recovery id
      signatureBytes[64] - 27, // Recovery id
      messageHashBytes,
      true
    );

    const publicKeyHex = '04' + Buffer.from(recoveredPublicKey).toString('hex');

    console.log('Recovered Public Key:', publicKeyHex);

    return {
      signature: signature,
      coinbase: await signer.getAddress(),
      publicKey: publicKeyHex
    };
  }

  const checkProof = async (address) => {

    const response = await fetch(`${PROOF_API_URL}/v1/proof?platform=ethereum&identity=${address}&exact=true`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    const proof = await response.json();
    console.log(proof)
    setProof(proof)
  };

  const getSK = async () => {

    const response = await fetch(`${KV_API_URL}/v1/kv?avatar=${avatar}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    });
    const newSK = await response.json();
    console.log(newSK)
    setKV(newSK)
  };


  const renderNextIdBox = (address) => {
    return(
      <Box>
      {
        !proof ?
        <>
        <Button secondary onClick={() => {checkProof(address)}} label="Check NextID Proof" />
        </>:
        <>
        {
          proof.ids.length > 0 ?
          <Paragraph>Select Avatar</Paragraph> :
          <>
          <Paragraph>Ooooooops! It looks like you do not have a NextID yet.</Paragraph>
          <Paragraph>Install Mask extension and connect your Metamask wallet there.</Paragraph>
          </>

        }
        {
          proof.ids.map(item => {
            return(
              <Box key={item.avatar} onClick={() => {setAvatar(item.avatar)}}>
                {item.avatar}
              </Box>
            )
          })
        }
        </>
      }
      {
        kv &&
        <Paragraph style={{overflowX: "auto"}}>KV {JSON.stringify(kv)}</Paragraph>

      }
      </Box>
    )
  };




  useEffect(() => {
    if(avatar){
      getSK();
    }
  },[avatar])

  /*
  // Not being used but can be usefull
  const [payload, setPayload] = useState();
  const [content, setContent] = useState();
  const [signPayload,setSignedPayload] = useState();
  const [proofRes, setProofRes] = useState();

  const handleSignMessage = async (provider) => {

    const timestamp = Math.floor(Date.now() / 1000);
    const message = 'Join NextWorld'

    const obj = await personalSign(message,provider);
    if (obj) {
      setPubKey(obj.publicKey);
      const payload = await getPayload(obj.coinbase);
      // Remove the '0x' prefix
      let signedPayload = await personalSign(payload.sign_payload,provider);
      const hexSignature = signedPayload.signature.slice(2);
      setSignedPayload(signedPayload);
      // Convert hex to base64
      const base64Signature = Buffer.from(hexSignature, 'hex').toString('base64');
      console.log(`Signature: ${base64Signature}`);
      setContent(payload.post_content.default.replace("%SIG_BASE64%",base64Signature));
      setPayload(payload);
    }
  };

  const verifyPost = async (address) => {
    const body = {
      action: "create",
      platform: "ethereum",
      identity: address,
      public_key: pubkey?.slice(2),
      extra: {
        wallet_signature: signPayload,
        signature: null
      },
      uuid: payload.uuid,
      created_at: payload.created_at
    };
    console.log(body)
    const response = await fetch(`${PROOF_API_URL}/v1/proof`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    const newProofRes = await response.json()
    setProofRes(newProofRes);
  };

  const getPayload = async (address) => {
    const body = {
      action: "create",
      platform: "ethereum",
      identity: address,
      public_key: pubkey?.slice(2)
    };
    const response = await fetch(`${PROOF_API_URL}/v1/proof/payload`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    const payloadRes = await response.json();
    console.log(payloadRes);
    return payloadRes;
  };
  */

  return({
    renderNextIdBox,
    avatar,
    proof
  })
}



export default useNextID;
