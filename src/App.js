import React, {useEffect, useState} from 'react';

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';

import { Program, Provider, web3 } from '@project-serum/anchor';

import twitterLogo from './assets/twitter-logo.svg';
import './App.css';

import idl from './idl.json';
import kp from './keypair.json';

// Constants
const TWITTER_HANDLE = 'od41';
const TWITTER_LINK = `https://github.com/${TWITTER_HANDLE}`;


const {SystemProgram} = web3;

const arr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(arr)
let baseAccount = web3.Keypair.fromSecretKey(secret)

const programId = new PublicKey(idl.metadata.address)

const network = clusterApiUrl('devnet')

const opts = {
  preflightCommitment: 'processed'
}

const TEST_GIFS = [
  "https://media.giphy.com/media/l41YAbq4zMlte0c9y/giphy.gif",
  "https://media.giphy.com/media/hteUrikqzH1aFhdSBj/giphy.gif",
  "https://media.giphy.com/media/3o72F3wdfvnuVNujjq/giphy.gif",
  "https://media.giphy.com/media/xT8qBpB6cNY6cHtT9K/giphy.gif",
  "https://media.giphy.com/media/kioCLntAPp26zpoHI7/giphy.gif",
  "https://media.giphy.com/media/xT8qBeDxGFAocmN8TS/giphy.gif",
]

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null)
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
      const {solana} = window

      if(solana ) {
        if(solana.isPhantom) {
          console.log('Phantom wallet found!');

          const response = await solana.connect({ onlyIfTrusted: true });
          console.log('connected with Public Key: ',
            response.pubclicKey.toString())
        }
      } else {
        alert('Solana object not found! Get a phantom wallet 👻')
      }
    } catch (error) {
      console.error(error)
    }
  }

  const connectWallet = async () => {
    const {solana} = window

    if(solana) {
      const response = await solana.connect()
      console.log('Connected with public key: ', response.publicKey.toString())
      setWalletAddress(response.publicKey.toString())
    }

  }

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log('No GIF link given');
      return
    }

    console.log('Empty input. Try again.');

    try {
      const provider = getProvider()
      const program = new Program(idl, programId, provider)

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        }
      });

      console.log("GIF successfully sent to program", inputValue)

      await getGifList()

    } catch (error) {
      console.log('Error sending GIF: ', error)
    }
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment)
    const provider = new Provider( connection, window.solana, opts.preflightCommitment)
    return provider
  }

  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  )

   const renderConnectedContainer = () => {

      if (gifList === null) {
        return (
          <div className="connected-container">
            <button
              className="cta-button submit-gif-button"
              onClick={createGifAccount}
            >
              Do One-Time Initialization For GIF Program Account
            </button>
          </div>
        );
      } else {
        return (
          <div className="connected-container">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendGif();
              }}
            >
              <input
                type="text"
                placeholder="Enter gif link!"
                value={inputValue}
                onChange={onInputChange}
              />
              <button type="submit" className="cta-button submit-gif-button">
                Submit
              </button>
            </form>
            <div className="gif-grid">
              {gifList.length !== 0 ? (
                gifList.map((gif) => (
                  <div className="gif-item" key={gif.gifLink}>
                    <img src={gif.gifLink} alt={gif.gifLink} />
                  </div>
                ))
              ) : (
                <h1>Sorry! No GIFs added</h1>
              )}
            </div>
          </div>
        );
      }
     
   };

  const getGifList = async () => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programId, provider)
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey)

      console.log("got the account", account)
      setGifList(account.gifList)

    } catch(error) {
      console.log('Error in getGifList: ', error)
      setGifList(null)
    }
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programId, provider)
      console.log('ping')

      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        },
        signers: [baseAccount]

      })

      console.log("Created a new BaseAccount w/ address: ", baseAccount.publicKey.toString())
      await getGifList()

    } catch (error) {
      console.log('Error creating BaseAccount account: ', error)
    }
  }

  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected()
    }
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad)
  }, [])

  useEffect(() => {
    if(walletAddress) {
      console.log('Fetching GIF list')
      getGifList()
    }
  }, [walletAddress])

  return (
    <div className="App">
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🏀 Highlights Portal</p>
          <p className="sub-text">
            View highlights collection in the metaverse ✨
          </p>
          {!walletAddress && renderNotConnectedContainer()}

          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
