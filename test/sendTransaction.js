const {ethers} = require("hardhat");
const {getTxReceipt} = require("./distribute");

describe("sendTransaction", function () {
    // https://v1.testnet.gwscan.com/zh-CN/account/0x9e593da2fb96abf2bd5483e7fc417508df6ea40e?tab=contract
    it("sendTransaction demo", async () => {
        const to = "0x9e593da2fb96abf2bd5483e7fc417508df6ea40e";
        const data = "0x1939c1ff00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000079026e949ba3ef5c854186244d1597a369bc326d0000000000000000000000008c49952eabebfa1ee2bc17ae29eda2fbb849f0c200000000000000000000000089b9b9e9f75e8a2edff8f314d8a696b8f443c1b9";
        const signers = await ethers.getSigners();
        const from = signers[0].address;
        const ethValue = "3";
        const value = "0x" + ethers.parseUnits(ethValue, "ether").toString(16);
        await sendTransaction(from, to, value, data);
    }).timeout(60000)
})

async function sendTransaction(from, to, value, data) {
    const gasPrice = "0x" + (await ethers.provider.getFeeData()).gasPrice.toString(16);
    const gas = await ethers.provider.send("eth_estimateGas", [{
        from,
        to,
        data,
        value
    }])
    const tx = await ethers.provider.send("eth_sendTransaction", [{
        from,
        to,
        "gas": gas,
        "gasPrice": gasPrice,
        "value": value,
        "data": data
    }])
    await getTxReceipt(ethers.provider, tx, 100);
}
