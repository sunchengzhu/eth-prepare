require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config()

const MNEMONIC = process.env.MNEMONIC === undefined ? "test test test test test test test test test test test junk" : process.env.MNEMONIC
const COUNT = process.env.COUNT === undefined ? 20 : parseInt(process.env.COUNT)
const INITIALINDEX = process.env.INITIALINDEX === undefined ? 0 : parseInt(process.env.INITIALINDEX)

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "gw_testnet_v1",
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
        axon_devnet: {
            url: "http://34.216.103.183:8000",
            accounts: {
                mnemonic: MNEMONIC,
                initialIndex: INITIALINDEX,
                count: COUNT
            }
        },
        axon_perf: {
            url: "http://13.237.199.246:8000",
            accounts: {
                mnemonic: MNEMONIC,
                initialIndex: INITIALINDEX,
                count: COUNT
            }
        }
    },
    solidity: "0.8.18",
    MNEMONIC,
    INITIALINDEX,
    COUNT
};
