# distributeETH

从助记词生成的第一个账户分发ETH到助记词生成的n个账户

## 使用步骤

### 前置步骤

1. 在项目根目录下新建.env文件，配置环境变量，可以参考如下配置：

```dotenv
MNEMONIC='test test test test test test test test test test test junk'
COUNT=500
ACCOUNTSNUM=10000
DEPOSITAMOUNT=0.1
MINAMOUNT=0.05
```

2. 给第一批账户转入足额ETH

```shell
#指定$NETWORK，如gw_alphanet_v1
npx hardhat test --grep "recharge" --network $NETWORK
```

### 多进程分发ETH并检查

1. 第一批账户在中通过批量转账合约BatchTransfer.sol向其他`COUNT`个账户转入`DEPOSITAMOUNT`个ETH

```shell
bash run.sh deposit $NETWORK
```

2. 检查所有`ACCOUNTSNUM`个账户是否有`DEPOSITAMOUNT`个ETH

```shell
bash run.sh afterDeposit $NETWORK
```

### GitHub Actions上配置定时检查并转账ETH

设置每日执行`checkAndDeposit`，保证所有账户的余额大于`MINAMOUNT`个ETH

## 其他

### 多进程回滚分发并检查

如果想要更换助记词生成全新的一批账户而环境中的ETH有限，可以执行下面的case将老助记词生成的n个账户的余额转到第一个账户，再自己将老助记词的第一个账户的余额转给新助记词第一个账户.

```shell
bash run.sh withdraw $NETWORK
```

bash run.sh afterWithdraw $NETWORK

```shell
bash run.sh withdraw $NETWORK
```

### 启用rpc日志功能

可以启用rpc日志功能帮助定位问题

```shell
npm run addRpcLog
#若需要关闭rpc日志功能，则执行以下命令
rm -rf node_modules/hardhat && npm install hardhat && chmod +x node_modules/.bin/hardhat
```
### 调整进程数
可以修改run.sh中的`processNum`调整进程数
