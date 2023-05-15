const {ethers} = require("hardhat");
const {execSync} = require('child_process');
const fs = require("fs");
const {MNEMONIC} = require("../hardhat.config");

describe('uniswap', function () {
    this.timeout(100000)
    it('deployAndSwap', async () => {
        let deployInfo = {
            wethAddress: "",
            otherTokenAddress: "",
            factoryAddress: "",
            uniAddress: "",
            pairHash: "",
        }
        // deploy weth9
        const ethContractInfo = await ethers.getContractFactory("WETH9");
        const wethContract = await ethContractInfo.deploy()
        deployInfo.wethAddress = (await wethContract.deployed()).address

        // deploy factory contract
        console.log('deploy factory contract ')
        const factoryContractInfo = await ethers.getContractFactory("UniswapV2Factory");
        const factoryContract = await factoryContractInfo.deploy(deployInfo.wethAddress);
        await factoryContract.deployed()
        deployInfo.factoryAddress = factoryContract.address
        console.log('deployInfo.factoryAddress :', deployInfo.factoryAddress)

        // deploy swap contract
        console.log('deploy swap ')
        deployInfo.pairHash = await factoryContract.getPairCodeHash()
        console.log("deployInfo.pairHash:", deployInfo.pairHash)
        const pairHash = deployInfo.pairHash.replace("0x", "")
        const readData = fs.readFileSync('contracts/uniswap/UniswapV2Router02.sol')
        let t = 0
        const writeData = readData.toString().replace(/hex.*/g, match => ++t === 2 ? `hex\'${pairHash}\'` : match)
        fs.writeFileSync("contracts/uniswap/UniswapV2Router02.sol", writeData);
        const output = execSync('npx hardhat compile', {encoding: 'utf-8'})
        console.log(output)
        const UniswapV2Router02ContractInfo = await ethers.getContractFactory("UniswapV2Router02");
        const uniswapV2Router02Contract = await UniswapV2Router02ContractInfo.deploy(deployInfo.factoryAddress, deployInfo.wethAddress)
        await uniswapV2Router02Contract.deployed()
        deployInfo.uniAddress = uniswapV2Router02Contract.address

        // deploy erc20 token contract
        console.log('deploy erc20')
        const usdtInfoContract = await ethers.getContractFactory("ERC20");
        const usdtContract = await usdtInfoContract.deploy("Usdt", "usdt", 1000000000000000000000n);
        await usdtContract.deployed()
        deployInfo.otherTokenAddress = usdtContract.address

        console.log('approve')
        // apporve
        const tx = await usdtContract.approve(uniswapV2Router02Contract.address, 1000000000000000000000n)
        await tx.wait()

        console.log('addliquity ')
        // addliquity
        let rt = await uniswapV2Router02Contract.addLiquidityETH(
            usdtContract.address,
            100000000000000000n,
            1,
            1,
            uniswapV2Router02Contract.signer.address,
            99999999999999n,
            {value: 1000000000}
        );
        await rt.wait();

        // print
        console.log("==== deploy ======")
        console.log(deployInfo)

        //swapExactETHForTokens
        const hdNode = ethers.utils.HDNode.fromMnemonic(MNEMONIC).derivePath("m/44'/60'/0'/0/0")
        const swapTx = await uniswapV2Router02Contract.swapExactETHForTokens(
            1,
            [deployInfo.wethAddress, deployInfo.otherTokenAddress],
            hdNode.address,
            99999999999999n,
            {value: 1000}
        )
        await swapTx.wait()
        console.log(`data: ${swapTx.data}`)
    })
});
