const { ethers } = require("hardhat");
const { MNEMONIC, INITIALINDEX } = require("../hardhat.config");
const { concurrentRun, getTxReceipt } = require("./distribute");

describe("get msg", function () {
  it("get block msg", async () => {
    const blockNumber = await ethers.provider.getBlockNumber()
    const chainId = (await ethers.provider.getNetwork()).chainId
    const feeData = await ethers.provider.getFeeData()
    console.log(`latest block number: ${blockNumber}`)
    console.log(`chain id: ${chainId}`)
    console.log(feeData)
    // const bkMap = await getTxCount(ethers.provider, blockNumber, 10)
    // bkMap.forEach(function (value, key) {
    //     console.log(`block ${key} tx count: ${value}`)
    // });
  }).timeout(30000)

  it("get accounts msg", async () => {
    const signers = await ethers.getSigners();
    const requestFnList = signers.map((signer) => () => ethers.provider.getBalance(signer.address))
    const reply = await concurrentRun(requestFnList, 20, "查询所有账户余额");
    const requestFnList1 = signers.map((signer) => () => ethers.provider.getTransactionCount(signer.address))
    const reply1 = await concurrentRun(requestFnList1, 20, "查询所有账户nonce");
    for (let i = 0; i < signers.length; i++) {
      console.log(`account${i + INITIALINDEX} ${signers[i].address} balance: ${ethers.formatEther(reply[i])} eth,nonce: ${reply1[i]}`);
    }
  }).timeout(180000)

  it("get an account msg", async () => {
    const address = "0x79026E949Ba3Ef5c854186244d1597a369Bc326D"
    const balance = await ethers.provider.getBalance(address)
    const count = await ethers.provider.getTransactionCount(address)
    console.log(`${address} balance: ${ethers.formatEther(balance)} eth,nonce: ${count}`)
  }).timeout(30000)

  it("get receipt by txHash", async () => {
    const txHash = "0xc316517cf13da9c512b9effdc4534bcca64da6a4ffaafc385e2c9c438896e64e"
    const txReceipt = await getTxReceipt(ethers.provider, txHash, 100)
    console.log(txReceipt)
  }).timeout(30000)

  it("get random mnemonic", async () => {
    const wallet = ethers.HDNodeWallet.createRandom()
    const randomMnemonic = wallet.mnemonic
    console.log(randomMnemonic)
  }).timeout(30000)

  it("get private key by mnemonic", async () => {
    const walletNum = 20;
    const basePath = "m/44'/60'/0'/0/";
    const wallet = ethers.HDNodeWallet.fromPhrase(MNEMONIC, null, "m");
    for (let i = 0; i < walletNum; i++) {
      let hdNodeNew = wallet.derivePath(basePath + i);
      console.log(`account${i} ${hdNodeNew.address} privateKey: ${hdNodeNew.privateKey}`);
    }
  }).timeout(30000)
})

async function getTxCount(provider, blockNumber, blockCount) {
  const map = new Map();
  for (let i = 0; i < blockCount; i++) {
    let txCount = await ethers.provider.send("eth_getBlockTransactionCountByNumber", [
      "0x" + (blockNumber - i).toString(16)
    ])
    map.set((blockNumber - i), parseInt(txCount, 16));
  }
  return map;
}
