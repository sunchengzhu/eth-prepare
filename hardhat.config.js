require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config()

const MNEMONIC = process.env.MNEMONIC === undefined ? "test test test test test test test test test test test junk" : process.env.MNEMONIC
const COUNT = 20
const INITIALINDEX = process.env.INITIALINDEX === undefined ? 0 : parseInt(process.env.INITIALINDEX)

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "fantom_testnet",
  networks: {
    gw_testnet_v1: {
      url: "https://v1.testnet.godwoken.io/rpc/instant-finality-hack",
      accounts: {
        mnemonic: MNEMONIC,
        initialIndex: INITIALINDEX,
        count: COUNT
      }
    },
    gw_alphanet_v1: {
      url: "https://gw-alphanet-v1.godwoken.cf/instant-finality-hack",
      accounts: {
        mnemonic: MNEMONIC,
        initialIndex: INITIALINDEX,
        count: COUNT
      }
    },
    axon_alphanet: {
      url: "https://rpc-alphanet-axon.ckbapp.dev",
      accounts: {
        mnemonic: MNEMONIC,
        initialIndex: INITIALINDEX,
        count: COUNT
      }
    },
    axon_single: {
      url: "https://axon-debug.ckbapp.dev",
      accounts: {
        mnemonic: MNEMONIC,
        initialIndex: INITIALINDEX,
        count: COUNT
      }
    },
    axon_local: {
      url: "http://localhost:8000",
      accounts: {
        mnemonic: MNEMONIC,
        initialIndex: INITIALINDEX,
        count: COUNT
      }
    },
    fantom_testnet: {
      url: "https://rpc.testnet.fantom.network",
      accounts: {
        mnemonic: MNEMONIC,
        initialIndex: INITIALINDEX,
        count: COUNT
      }
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/jBG_4O1H5CHQugJjwBt_md0ks3FQpsqN",
      accounts: {
        mnemonic: MNEMONIC,
        initialIndex: INITIALINDEX,
        count: COUNT
      }
    }
  },
  solidity: {
    compilers: [
      { version: "0.8.18" },
      { version: "0.6.6", settings: { optimizer: { enabled: true, runs: 200 } } },
      { version: "0.5.16" }
    ]
  },
  MNEMONIC,
  INITIALINDEX,
  COUNT
};
