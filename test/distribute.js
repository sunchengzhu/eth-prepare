const { ethers } = require("hardhat")
const BigNumber = require('bignumber.js');
const { COUNT, INITIALINDEX, MNEMONIC } = require("../hardhat.config.perf");
const { expect } = require("chai");
const hre = require("hardhat");

const accountsNum = parseInt(process.env.ACCOUNTSNUM)
const depositAmount = parseFloat(process.env.DEPOSITAMOUNT)
const minAmount = parseFloat(process.env.MINAMOUNT)
const interval = COUNT
let contractAddress
if (hre.network.name === "gw_testnet_v1") {
  contractAddress = "0x9e593da2fb96abf2bd5483e7fc417508df6ea40e"
} else if (hre.network.name === "gw_alphanet_v1") {
  contractAddress = "0x3F83d35De751C6CaF49665235590F5f4C4Db97dD"
} else if (hre.network.name === "axon_alphanet") {
  contractAddress = "0x3abBB0D6ad848d64c8956edC9Bf6f18aC22E1485"
} else if (hre.network.name === "fantom_testnet") {
  contractAddress = "0xbcab4f17Cf6Ea56326c4A910b2a13CbaD9B0fc73"
}

describe("recharge", async function () {
  it("recharge", async function () {
    const gasPrice = await getSufficientGasPrice()
    const signers = await ethers.getSigners()
    const addressList = await getAddressList(accountsNum, interval, MNEMONIC)
    if (addressList.length > 1) {
      for (let i = 1; i < addressList.length; i++) {
        const ethValue = ethers.parseUnits((depositAmount * COUNT * 1.1).toString(), "ether")
        const balance = await ethers.provider.getBalance(addressList[i])
        const count = await ethers.provider.getTransactionCount(addressList[i])
        if ((balance - ethValue) >= BigInt(0)) {
          console.log(`account${i * interval + Number(process.env.INITIALINDEX)} ${addressList[i]} has sufficient balance: ${ethers.formatEther(balance)} eth >= ${ethers.formatEther(ethValue)} eth,nonce: ${count}`)
        } else {
          const value = "0x" + (ethValue - balance).toString(16)
          await transferWithReceipt(signers[0].address, addressList[i], gasPrice, value);
          const newBalance = await ethers.provider.getBalance(addressList[i])
          console.log(`account${i * interval + Number(process.env.INITIALINDEX)} ${addressList[i]} balance: ${ethers.formatEther(newBalance)} eth,nonce: ${count}`)
        }
      }
    }
    const balance = await ethers.provider.getBalance(addressList[0])
    const count = await ethers.provider.getTransactionCount(addressList[0])
    console.log(`account${INITIALINDEX} ${addressList[0]} balance: ${ethers.formatEther(balance)} eth,nonce: ${count}`)
  }).timeout(180000)
})

describe("deposit", function () {
  it("deposit", async function () {
    console.log(`deposit from account${INITIALINDEX}`)
    const signers = await ethers.getSigners()
    const recipients = signers.map((item) => {
      return item.address;
    })
    await deposit(recipients, 50)
  }).timeout(120000)
})

describe("withdraw", function () {
  it("withdraw", async function () {
    console.log(`withdraw from account${INITIALINDEX}`)
    const signers = await ethers.getSigners()
    const wallet = ethers.HDNodeWallet.fromPhrase(MNEMONIC, null, "m/44'/60'/0'/0/0")
    const gasPrice = await getSufficientGasPrice()
    const requestFnList = signers.map((signer) => () => ethers.provider.getBalance(signer.address))
    const reply = await concurrentRun(requestFnList, 20, "查询所有账户余额")
    const requestFnList1 = signers.map((signer) => () => ethers.provider.getTransactionCount(signer.address))
    const reply1 = await concurrentRun(requestFnList1, 20, "查询所有账户nonce")
    for (let i = 0; i < COUNT; i++) {
      let value = reply[i] - BigInt(21000) * BigInt(gasPrice)
      if (value > 0) {
        let nonce = "0x" + reply1[i].toString(16)
        await transfer(signers[i].address, wallet.address, gasPrice, "0x" + value.toString(16), nonce)
      }
    }
  }).timeout(240000)
})

describe("check accounts balance", function () {
  let signers, reply
  before(async function () {
    this.timeout(60000);
    console.log(`check from account${INITIALINDEX}`)
    signers = await ethers.getSigners()
    const requestFnList = signers.map((signer) => () => ethers.provider.getBalance(signer.address))
    reply = await concurrentRun(requestFnList, 20, "查询所有账户余额");
  });

  it("checkAndDeposit", async function () {
    let recipients = []
    for (let i = 0; i < signers.length; i++) {
      const balance = ethers.formatEther(reply[i]);
      if (balance < minAmount && (i + INITIALINDEX) % 100 === 0) {
        console.error(`account${i + INITIALINDEX} ${signers[i].address} has insufficient balance: ${balance} eth < ${minAmount} eth`);
      }
      if (balance < minAmount) {
        recipients.push(signers[i].address);
      }
    }
    if (recipients.length > 0) {
      await deposit(recipients, 50)
      console.log(`${recipients.length} accounts with insufficient balance`)
    }
  }).timeout(120000)

  it("afterDeposit", async function () {
    let j = 0
    for (let i = 0; i < signers.length; i++) {
      let balance = ethers.formatEther(reply[i])
      if (balance < depositAmount) {
        console.error(`account${i + INITIALINDEX} ${signers[i].address} balance: ${balance} eth < ${depositAmount} eth`)
      } else {
        // console.log(`account${i + INITIALINDEX} ${signers[i].address} balance: ${balance} eth}`)
        j++
      }
    }
    expect(j).to.be.equal(COUNT)
  }).timeout(30000)

  it("afterWithdraw", async function () {
    let j = 0
    let gasPrice = await getSufficientGasPrice()
    for (let i = 0; i < signers.length; i++) {
      let balance = ethers.formatEther(reply[i])
      let value = reply[i] - BigInt(21000) * BigInt(gasPrice)
      if (INITIALINDEX !== 0 && value > 0) {
        console.error(`account${i + INITIALINDEX} ${signers[i].address} balance: ${balance} eth > ${ethers.formatEther(BigInt(21000) * BigInt(gasPrice))} eth`)
      } else {
        // console.log(`account${i + INITIALINDEX} ${signers[i].address} balance: ${balance} eth`)
        j++
      }
    }
    expect(j).to.be.equal(COUNT)
  }).timeout(30000)
})

async function deposit(recipients, recipientSize) {
  const BatchTransfer = await ethers.getContractFactory("BatchTransfer");
  const batchTransfer = await BatchTransfer.attach(contractAddress);
  const loopCount = Math.floor(recipients.length / recipientSize)
  for (let j = 0; j < loopCount; j++) {
    let tmpRecipients = []
    for (let k = j * recipientSize; k < (j + 1) * recipientSize; k++) {
      tmpRecipients.push(recipients[k])
    }
    const tx = await batchTransfer.getFunction("transfer").send(tmpRecipients, ethers.parseUnits(depositAmount.toString(), "ether"),
      {
        value: ethers.parseEther((recipientSize * depositAmount).toString())
      });
    await tx.wait();
  }
  const remainingNum = recipients.length % recipientSize
  const remainingRecipients = []
  for (let m = loopCount * recipientSize; m < loopCount * recipientSize + remainingNum; m++) {
    remainingRecipients.push(recipients[m])
  }
  if (remainingRecipients.length > 0) {
    const tx = await batchTransfer.getFunction("transfer").send(remainingRecipients, ethers.parseUnits(depositAmount.toString(), "ether"),
      {
        value: ethers.parseEther((remainingNum * depositAmount).toString())
      });
    await tx.wait();
    console.log("txHash:", tx.hash);
  }
}

async function getAddressList(accountsNum, interval, mnemonic) {
  const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, null, "m");
  let addressList = []
  const loopCount = Math.ceil(accountsNum / interval)
  for (let i = 0; i < loopCount; i++) {
    let sum = i * interval + Number(process.env.INITIALINDEX)
    let hdNodeNew = wallet.derivePath("m/44'/60'/0'/0/" + sum)
    addressList.push(hdNodeNew.address)
  }
  return addressList
}

async function transferWithReceipt(from, to, gasPrice, value) {
  const tx = await ethers.provider.send("eth_sendTransaction", [{
    from,
    to,
    "gas": "0xc738", //51000
    "gasPrice": gasPrice,
    "value": value,
  }])
  await getTxReceipt(ethers.provider, tx, 100)
}

async function transfer(from, to, gasPrice, value, nonce) {
  await ethers.provider.send("eth_sendTransaction", [{
    from,
    to,
    "gas": "0x5208", //21000
    "gasPrice": gasPrice,
    "value": value,
    "nonce": nonce
  }])
}

async function getTxReceipt(provider, txHash, attempts) {
  for (let i = 0; i < attempts; i++) {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (receipt !== null) {
      return receipt;
    }
    await sleep(1000);
  }
  return null;
}


async function sleep(timeOut) {
  await new Promise(r => setTimeout(r, timeOut));
}

async function getSufficientGasPrice() {
  const gasPrice = (await ethers.provider.getFeeData()).gasPrice
  console.log(`gas price: ${gasPrice} wei`)
  // Multiply by 1.2 and round
  const myGasPrice = (gasPrice * BigInt(12) + BigInt(5)) / BigInt(10)
  console.log(`my gas price: ${myGasPrice} wei`)
  return "0x" + myGasPrice.toString(16)
}

/**
 * 执行多个异步任务
 * @param {*} fnList 任务列表
 * @param {*} max 最大并发数限制
 * @param {*} taskName 任务名称
 */
async function concurrentRun(fnList = [], max = 5, taskName = "未命名") {
  if (!fnList.length) return;

  const replyList = []; // 收集任务执行结果
  const maxRetry = 3; // 设置最大重试次数

  const schedule = async (index, retryCount = 0) => {
    return new Promise(async (resolve, reject) => {
      const fn = fnList[index];
      if (!fn) return resolve();
      try {
        // 执行当前异步任务
        replyList[index] = await fn();
        // 执行完当前任务后，继续执行任务池的剩余任务
        await schedule(index + max);
        resolve();
      } catch (error) {
        if (retryCount < maxRetry) {
          console.log(`Task ${index} failed, retrying... Retry count: ${retryCount + 1}`);
          await schedule(index, retryCount + 1);
          resolve();
        } else {
          console.error(`Task ${index} failed after ${maxRetry} attempts`);
          reject(error);
        }
      }
    });
  };

  // 任务池执行程序
  const scheduleList = new Array(max)
    .fill(0)
    .map((_, index) => schedule(index));
  // 使用 Promise.all 批量执行
  await Promise.all(scheduleList);

  return replyList;
}


module.exports = {
  concurrentRun,
  getTxReceipt
};
