const {ethers} = require("hardhat");
const {getTxReceipt} = require("./distribute");

describe("sendTransaction", function () {
    //in sepolia.etherscan https://sepolia.etherscan.io/address/0xb2dab7f5ebb0b299a880d8398791e96a6a6f2026#code
    it("sendTransaction demo", async () => {
        const to = "0x9e593da2fb96abf2bd5483e7fc417508df6ea40e";
        const data = "0x1939c1ff00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000de0b6b3a7640000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000079026e949ba3ef5c854186244d1597a369bc326d0000000000000000000000008c49952eabebfa1ee2bc17ae29eda2fbb849f0c200000000000000000000000089b9b9e9f75e8a2edff8f314d8a696b8f443c1b9";
        const signers = await ethers.getSigners();
        const from = signers[0].address;
        const ethValue = "3";
        const value = ethers.utils.parseUnits(ethValue, "ether").toHexString().replaceAll("0x0", "0x");
        await sendTransaction(from, to, value, data);
    }).timeout(60000)

    it("swap demo", async () => {
        const oldData = "0x7ff36ab5000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000800000000000000000000000003499932d7a1d1850253d6c66d830e3524bb3f2a700000000000000000000000000000000000000000000000000005af3107a3fff00000000000000000000000000000000000000000000000000000000000000020000000000000000000000006eb7975f2b38f91e5e649a031afa555b3032232600000000000000000000000080e016c0358c542ac97b4914ccfa7c9f0332e3e0";
        const to = "0x752A36b5dBf7b673Be2073Fe8B6c84f0D2e1CC79";
        const signers = await ethers.getSigners();
        const from = signers[1].address;
        const data = oldData.replace(signers[0].address.replace("0x", "").toLowerCase(), from.replace("0x", "").toLowerCase())
        const ethValue = "0.000000000000001";
        const value = ethers.utils.parseUnits(ethValue, "ether").toHexString().replaceAll("0x0", "0x");
        await sendTransaction(from, to, value, data);
        const usdtInfoContract = await ethers.getContractFactory("ERC20");
        const usdtContract = await usdtInfoContract.attach("0x80e016c0358C542aC97B4914CCFA7c9F0332e3E0");
        const result = await usdtContract.balanceOf(from)
        console.log(result)
    }).timeout(60000)
})

async function sendTransaction(from, to, value, data) {
    const getPrice = await ethers.provider.getGasPrice();
    const gasPrice = getPrice.toHexString().replaceAll("0x0", "0x");
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

describe("deploy", function () {
    it("deploy contract", async () => {
        const BatchTransfer = await ethers.getContractFactory("BatchTransfer");
        const contract = await BatchTransfer.deploy();
        await contract.deployed();
        console.log("contract address:", contract.address);
    }).timeout(60000)
})
