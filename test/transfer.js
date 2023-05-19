const {ethers} = require("hardhat");
const {getTxReceipt} = require("./distribute");

describe("transfer", function () {
    it("transfer demo", async () => {
        const signers = await ethers.getSigners();
        const from = signers[0].address;
        const to = "0x3499932d7a1D1850253d6c66d830e3524bb3F2a7";
        const ethValue = "0.01";
        const value = ethers.utils.parseUnits(ethValue, "ether").toHexString().replaceAll("0x0", "0x");
        await transfer(from, to, value);
    }).timeout(60000)
})

async function transfer(from, to, value) {
    const from_balance = ethers.utils.formatEther(await ethers.provider.getBalance(from));
    const to_balance = ethers.utils.formatEther(await ethers.provider.getBalance(to));
    console.log(`before transfer ${from} balance:${from_balance} eth ${to} balance:${to_balance} eth`);
    const getPrice = await ethers.provider.getGasPrice();
    const gasPrice = getPrice.toHexString().replaceAll("0x0", "0x");
    const gas = await ethers.provider.send("eth_estimateGas", [{
        from,
        to
    }])
    const tx = await ethers.provider.send("eth_sendTransaction", [{
        from,
        to,
        "gas": gas,
        "gasPrice": gasPrice,
        "value": value,
        "data": "0x"
    }])
    await getTxReceipt(ethers.provider, tx, 100);
    const from_balance_sent = ethers.utils.formatEther(await ethers.provider.getBalance(from));
    const to_balance_sent = ethers.utils.formatEther(await ethers.provider.getBalance(to));
    console.log(`after transfer ${from} balance:${from_balance_sent} eth ${to} balance:${to_balance_sent} eth`);
}
