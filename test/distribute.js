const {ethers} = require("hardhat")
const BigNumber = require('bignumber.js');
const {COUNT, INITIALINDEX, MNEMONIC} = require("../hardhat.config");
const {expect} = require("chai");
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
    contractAddress = "0x5803fc561C7ED57B5b55aBCFF67726BFb086c548"
} else if (hre.network.name === "fantom_testnet") {
    contractAddress = "0xbcab4f17Cf6Ea56326c4A910b2a13CbaD9B0fc73"
}

describe("recharge", async function () {
    it("recharge", async function () {
        const gasPrice = await getSufficientGasPrice(ethers.provider)
        const signers = await ethers.getSigners()
        const addressList = await getAddressList(accountsNum, interval, MNEMONIC)
        if (addressList.length > 1) {
            for (let i = 1; i < addressList.length; i++) {
                const ethValue = ethers.utils.parseUnits((depositAmount * COUNT * 1.1).toString(), "ether")
                const balance = await ethers.provider.getBalance(addressList[i])
                const count = await ethers.provider.getTransactionCount(addressList[i])
                if (ethValue.sub(balance).lte(0)) {
                    console.log(`account${i * interval + Number(process.env.INITIALINDEX)} ${addressList[i]} has sufficient balance: ${ethers.utils.formatEther(balance)} eth >= ${ethers.utils.formatEther(ethValue)} eth,nonce: ${count}`)
                } else {
                    let valueHex = ethValue.sub(balance).toHexString();
                    let value = valueHex.startsWith("0x0") ? "0x" + valueHex.slice(3) : valueHex;
                    await transferWithReceipt(signers[0].address, addressList[i], gasPrice, value);
                    const newBalance = await ethers.provider.getBalance(addressList[i])
                    console.log(`account${i * interval + Number(process.env.INITIALINDEX)} ${addressList[i]} balance: ${ethers.utils.formatEther(newBalance)} eth,nonce: ${count}`)
                }
            }
        }
        const balance = await ethers.provider.getBalance(addressList[0])
        const count = await ethers.provider.getTransactionCount(addressList[0])
        console.log(`account0 ${addressList[0]} balance: ${ethers.utils.formatEther(balance)} eth,nonce: ${count}`)
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
        const hdNode = ethers.utils.HDNode.fromMnemonic(MNEMONIC).derivePath("m/44'/60'/0'/0/0")
        const gasPrice = await getSufficientGasPrice(ethers.provider)
        const requestFnList = signers.map((signer) => () => ethers.provider.getBalance(signer.address))
        const reply = await concurrentRun(requestFnList, 20, "查询所有账户余额")
        const requestFnList1 = signers.map((signer) => () => ethers.provider.getTransactionCount(signer.address))
        const reply1 = await concurrentRun(requestFnList1, 20, "查询所有账户nonce")
        for (let i = 0; i < COUNT; i++) {
            let value = reply[i].sub(ethers.BigNumber.from(21000).mul(gasPrice)).toHexString().replaceAll("0x0", "0x")
            if (ethers.utils.formatEther(value) > 0) {
                let nonce = ethers.BigNumber.from(reply1[i]).toHexString().replaceAll("0x0", "0x")
                await transfer(signers[i].address, hdNode.address, gasPrice, value, nonce)
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
            const balance = ethers.utils.formatEther(reply[i]);
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
            let balance = ethers.utils.formatEther(reply[i])
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
        let gasPrice = await getSufficientGasPrice(ethers.provider)
        for (let i = 0; i < signers.length; i++) {
            let balance = ethers.utils.formatEther(reply[i])
            let value = reply[i].sub(ethers.BigNumber.from(21000).mul(gasPrice)).toHexString().replaceAll("0x0", "0x")
            if (INITIALINDEX !== 0 && ethers.utils.formatEther(value) > 0) {
                console.error(`account${i + INITIALINDEX} ${signers[i].address} balance: ${balance} eth > ${ethers.utils.formatEther(ethers.BigNumber.from(21000).mul(gasPrice))} eth`)
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
        const tx = await batchTransfer.transfer(tmpRecipients, ethers.utils.parseUnits(depositAmount.toString(), "ether"),
            {
                value: ethers.utils.parseEther((recipientSize * depositAmount).toString())
            });
        await tx.wait();
    }
    const remainingNum = recipients.length % recipientSize
    const remainingRecipients = []
    for (let m = loopCount * recipientSize; m < loopCount * recipientSize + remainingNum; m++) {
        remainingRecipients.push(recipients[m])
    }
    if (remainingRecipients.length > 0) {
        const tx = await batchTransfer.transfer(remainingRecipients, ethers.utils.parseUnits(depositAmount.toString(), "ether"),
            {
                value: ethers.utils.parseEther((remainingNum * depositAmount).toString())
            });
        await tx.wait();
        console.log("txHash:", tx.hash);
    }
}

async function getAddressList(accountsNum, interval, mnemonic) {
    const hdNode = ethers.utils.HDNode.fromMnemonic(mnemonic)
    let addressList = []
    const loopCount = Math.ceil(accountsNum / interval)
    for (let i = 0; i < loopCount; i++) {
        let sum = i * interval + Number(process.env.INITIALINDEX)
        let hdNodeNew = hdNode.derivePath("m/44'/60'/0'/0/" + sum)
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

async function getTxReceipt(provider, txHash, count) {
    let response
    for (let i = 0; i < count; i++) {
        response = await provider.getTransactionReceipt(txHash)
        if (response == null) {
            await sleep(2000)
            continue
        }
        if (response.confirmations >= 1) {
            return response
        }
        await sleep(2000)
    }
    return response
}

async function sleep(timeOut) {
    await new Promise(r => setTimeout(r, timeOut));
}

async function getSufficientGasPrice(provider) {
    const gasPrice = await provider.getGasPrice()
    console.log(`gas price: ${gasPrice} wei`)
    const myGasPrice = new BigNumber(gasPrice.toNumber()).multipliedBy(1.2).decimalPlaces(0)
    console.log(`my gas price: ${myGasPrice} wei`)
    const hexPrice = ethers.BigNumber.from(myGasPrice.toNumber()).toHexString().replaceAll("0x0", "0x")
    return hexPrice
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
