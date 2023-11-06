const { ethers } = require("hardhat");
const { getTxReceipt } = require("./distribute");

describe("transfer", function () {
  it("transfer demo", async () => {
    const signers = await ethers.getSigners();
    const from = signers[0].address;
    const to = "0x79026E949Ba3Ef5c854186244d1597a369Bc326D";
    const ethValue = "0.01";
    const value = "0x" + ethers.parseUnits(ethValue, "ether").toString(16);
    await transfer(from, to, value);
  }).timeout(60000)
})

async function transfer(from, to, value) {
  const from_balance = ethers.formatEther(await ethers.provider.getBalance(from));
  const to_balance = ethers.formatEther(await ethers.provider.getBalance(to));
  console.log(`before transfer ${from} balance:${from_balance} eth ${to} balance:${to_balance} eth`);
  const gasPrice = "0x" + (await ethers.provider.getFeeData()).gasPrice.toString(16);
  const gas = await ethers.provider.send("eth_estimateGas", [{
    from,
    to
  }])
  const txHash = await ethers.provider.send("eth_sendTransaction", [{
    from,
    to,
    "gas": gas,
    "gasPrice": gasPrice,
    "value": value,
    "data": "0x"
  }])
  console.log("txHash:", txHash)
  await getTxReceipt(ethers.provider, txHash, 100);
  const from_balance_sent = ethers.formatEther(await ethers.provider.getBalance(from));
  const to_balance_sent = ethers.formatEther(await ethers.provider.getBalance(to));
  console.log(`after transfer ${from} balance:${from_balance_sent} eth ${to} balance:${to_balance_sent} eth`);
}
