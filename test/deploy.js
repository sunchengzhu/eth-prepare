const {ethers} = require("hardhat");

describe("deploy", function () {
    it("deploy BatchTransfer", async () => {
        const BatchTransfer = await ethers.getContractFactory("BatchTransfer");
        const contract = await BatchTransfer.deploy();
        await contract.deployed();
        console.log("batchTransfer address:", contract.address);
    }).timeout(60000)

    it("deploy SimpleStorage", async () => {
        const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
        const simpleStorage = await SimpleStorage.deploy();
        await simpleStorage.deployed();
        console.log("simpleStorage address:", simpleStorage.address);
        const value = await simpleStorage.getValue();
        console.log(value)
        const tx = await simpleStorage.populateTransaction.getValue();
        console.log("tx data:", tx.data);
    }).timeout(60000)
})
