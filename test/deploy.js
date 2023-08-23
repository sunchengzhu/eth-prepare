const { ethers } = require("hardhat");

describe("deploy", function () {
  it("deploy BatchTransfer", async () => {
    const BatchTransfer = await ethers.getContractFactory("BatchTransfer");
    const contract = await BatchTransfer.deploy();
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log("batchTransfer address:", address);
  }).timeout(60000)

  it("deploy SimpleStorage", async () => {
    const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
    const simpleStorage = await SimpleStorage.deploy();
    await simpleStorage.waitForDeployment();
    const address = await simpleStorage.getAddress();
    console.log("simpleStorage address:", address);
    const randomNum = Math.floor(Math.random() * 1000000);
    const tx = await simpleStorage.getFunction("setValue").send(randomNum);
    const receipt = await tx.wait();
    console.log("txHash:", receipt.hash)
    const value = await simpleStorage.getFunction("getValue").staticCall();
    console.log("value:", value)
    const populateTx = await simpleStorage.getFunction("getValue").populateTransaction();
    console.log("tx data:", populateTx.data);
  }).timeout(60000)
})
