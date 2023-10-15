const { ethers } = require("hardhat");
describe("metadata", function () {
  it("update max_contract_limit", async () => {
    const metadataManager = await ethers.getContractAt("MetadataManager","0xffffffffffffffffffffffffffffffffffffff01");
    const consensusConfig = {
      propose_ratio: 0xfn,             // 15
      prevote_ratio: 0xan,             // 10
      precommit_ratio: 0xan,           // 10
      brake_ratio: 0xan,               // 10
      tx_num_limit: 0x4e20n,           // 20000
      max_tx_size: 0x186a0000n,        // 409600000
      gas_limit: 0x3e7fffffc18n,       // 4294967295000
      interval: 0xbb8n,                // 3000
      max_contract_limit: 0x8000n      // 32768
    };
    try {
      console.log(consensusConfig)
      const tx = await metadataManager.getFunction("updateConsensusConfig").send(consensusConfig);
      console.log(`Transaction hash: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
    } catch (error) {
      console.error("An error occurred:", error.message);
      console.error("Full error object:", error);
    }
  }).timeout(60000)

  // Test whether max_contract_limit is effective
  it("deploy a larger than 24576-byte(0x6000) contract", async () => {
    const BigContract = await ethers.getContractFactory("BigContract");
    const contract = await BigContract.deploy();
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log("bigContract address:", address);
    const bytecode = contract.deploymentTransaction().data;
    console.log("bytecode:", bytecode)
    console.log(`Contract size: ${(bytecode.length - 2) / 2} bytes`);
  }).timeout(60000)
})

