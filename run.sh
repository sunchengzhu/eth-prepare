#!/bin/bash
CASE=$1
NETWORK=$2

if [ ! -n "$CASE" ]; then
  CASE="afterDeposit"
fi
if [ ! -n "$NETWORK" ]; then
  NETWORK="gw_testnet_v1"
fi

if [ $CASE = "deposit" ]; then
  npx hardhat test --grep "recharge" --network $NETWORK
fi

node run.js 4 0 $CASE $NETWORK
node run.js 4 4 $CASE $NETWORK
node run.js 4 8 $CASE $NETWORK
node run.js 4 12 $CASE $NETWORK
node run.js 4 16 $CASE $NETWORK
