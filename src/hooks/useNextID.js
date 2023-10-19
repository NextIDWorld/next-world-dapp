import { useState } from "react";
import { ethers } from "ethers";
import * as ethUtil from 'ethereumjs-util';
import * as secp256k1 from 'secp256k1';
import {
  Box,
 } from 'grommet';


const API_URL = 'https://proof-service.nextnext.id'


function useNextID() {

  const [payload, setPayload] = useState();
  const [content, setContent] = useState();

  const [pubkey, setPubKey] = useState();
  const [postid,setPostId] = useState();
  const [twitter_handler,setTwitter] = useState();

  const [proofRes, setProofRes] = useState();
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
  const handleSignMessage = async (provider) => {

    const timestamp = Math.floor(Date.now() / 1000);
    const message = 'Join NextWorld'

    const obj = await personalSign(message,provider);
    if (obj) {
      setPubKey(obj.publicKey);
      const payload = await getPayload();
      // Remove the '0x' prefix
      let signedPayload = await personalSign(payload.sign_payload,provider);
      const hexSignature = signedPayload.signature.slice(2);

      // Convert hex to base64
      const base64Signature = Buffer.from(hexSignature, 'hex').toString('base64');
      console.log(`Signature: ${base64Signature}`);
      setContent(payload.post_content.default.replace("%SIG_BASE64%",base64Signature));
      setPayload(payload);
    }
  };

  const verifyPost = async () => {
    const body = {
      action: "create",
      platform: "twitter",
      identity: twitter_handler,
      public_key: pubkey?.slice(2),
      proof_location: postid,
      extra: {},
      uuid: payload.uuid,
      created_at: payload.created_at
    };
    console.log(body)
    const response = await fetch(`${API_URL}/v1/proof`, {
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

  const getPayload = async () => {
    const body = {
      action: "create",
      platform: "twitter",
      identity: twitter_handler,
      public_key: pubkey?.slice(2)
    };
    const response = await fetch(`${API_URL}/v1/proof/payload`, {
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

  const renderNextIdBox = (provider) => {
    return(
      <Box>
      <label>Twitter Account</label>
      <input type="text" onChange={(e) => { setTwitter(e.target.value) }} />
      <button onClick={() => {handleSignMessage(provider)}}>Sign Message with MetaMask</button>
      {
        content &&
        <>
          <h3>Make post on twitter:</h3>
          <div>{content}</div>
          <br /><br />
          <label>Post ID</label>
          <input type="text" onChange={(e) => { setPostId(e.target.value) }} />
          <button onClick={verifyPost}>Verify Post</button>
          {JSON.stringify(proofRes)}
        </>
      }
      </Box>
    )
  };
  return({
    handleSignMessage,
    verifyPost,
    getPayload,
    proofRes,
    renderNextIdBox
  })
}



export default useNextID;
