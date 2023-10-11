const { ethers } = require("hardhat");
const { execSync } = require('child_process');
const fs = require("fs");

describe('uniswap', function () {
  this.timeout(120000)
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
    deployInfo.wethAddress = await (await wethContract.waitForDeployment()).getAddress()

    // deploy factory contract
    console.log('deploy factory contract')
    const factoryContractInfo = await ethers.getContractFactory("UniswapV2Factory");
    const factoryContract = await factoryContractInfo.deploy(deployInfo.wethAddress);
    await factoryContract.waitForDeployment()
    deployInfo.factoryAddress = await factoryContract.getAddress()
    console.log('deployInfo.factoryAddress :', deployInfo.factoryAddress)

    // deploy swap contract
    console.log('deploy swap')
    deployInfo.pairHash = await factoryContract.getFunction("getPairCodeHash").staticCall()
    console.log("deployInfo.pairHash:", deployInfo.pairHash)
    const pairHash = deployInfo.pairHash.replace("0x", "")
    const readData = fs.readFileSync('contracts/uniswap/UniswapV2Router02.sol')
    let t = 0
    const writeData = readData.toString().replace(/hex.*/g, match => ++t === 2 ? `hex\'${pairHash}\'` : match)
    fs.writeFileSync("contracts/uniswap/UniswapV2Router02.sol", writeData);
    const output = execSync('npx hardhat compile', { encoding: 'utf-8' })
    console.log(output)
    const UniswapV2Router02ContractInfo = await ethers.getContractFactory("UniswapV2Router02");
    const uniswapV2Router02Contract = await UniswapV2Router02ContractInfo.deploy(deployInfo.factoryAddress, deployInfo.wethAddress)
    await uniswapV2Router02Contract.waitForDeployment()
    deployInfo.uniAddress = await uniswapV2Router02Contract.getAddress()

    // deploy erc20 token contract
    console.log('deploy erc20')
    const usdtInfoContract = await ethers.getContractFactory("ERC20");
    const usdtContract = await usdtInfoContract.deploy("Usdt", "usdt", 1000000000000000000000n);
    await usdtContract.waitForDeployment()
    const usdtContractAddress = usdtContract.getAddress()
    deployInfo.otherTokenAddress = await usdtContract.getAddress()

    console.log('approve')
    // apporve
    const tx = await usdtContract.getFunction("approve").send(deployInfo.uniAddress, 1000000000000000000000n)
    await tx.wait()

    const signers = await ethers.getSigners();

    console.log('addliquity')
    // addliquity
    let rt = await uniswapV2Router02Contract.getFunction("addLiquidityETH").send(
      usdtContractAddress,
      100000000000000000n,
      1,
      1,
      signers[0].address,
      99999999999999n,
      {
        value: 1000000000,
        gasLimit: 10000000
      }
    );
    await rt.wait();

    // print
    console.log("==== deploy ======")
    console.log(deployInfo)

    //swapExactETHForTokens
    const estimatedGas = await uniswapV2Router02Contract.getFunction("swapExactETHForTokens").estimateGas(
      1,
      [deployInfo.wethAddress, deployInfo.otherTokenAddress],
      signers[1].address,
      99999999999999n,
      {
        value: 1000,
      }
    );

    const swapTx = await uniswapV2Router02Contract.getFunction("swapExactETHForTokens").send(
      1,
      [deployInfo.wethAddress, deployInfo.otherTokenAddress],
      signers[1].address,
      99999999999999n,
      {
        value: 1000,
        gasLimit: estimatedGas
      }
    )
    await swapTx.wait()
    console.log(`swapTxHash: ${swapTx.hash}`)
    console.log(`data: ${swapTx.data}`)
  })

  it('swap', async () => {
    // https://sepolia.etherscan.io/address/0xcffdb3456e959b1b9dfd70534ee94e3cd48431be#code
    const uniAddress = '0xcFFdb3456e959B1b9DFD70534EE94E3Cd48431be'
    const wethAddress = '0x7C7087d81c5f4Bd7EA30A5e13095414395DfD4F1'
    const otherTokenAddress = '0xA37614c751F37cBc54C5223254e8695024fA36c7'
    const signers = await ethers.getSigners();
    const toAddress = signers[1].address
    const UniswapV2Router02ContractInfo = await ethers.getContractFactory("UniswapV2Router02");
    const uniswapV2Router02Contract = await UniswapV2Router02ContractInfo.attach(uniAddress)
    const swapTx = await uniswapV2Router02Contract.getFunction("swapExactETHForTokens").send(
      1,
      [wethAddress, otherTokenAddress],
      toAddress,
      99999999999999n,
      { value: 1000 }
    )
    await swapTx.wait()
    console.log(`swapTxHash: ${swapTx.hash}`);
    console.log(`data: ${swapTx.data}`)
  })
});
