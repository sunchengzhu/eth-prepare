#!/bin/bash
CASE=$1
NETWORK=$2

if [ -z "$CASE" ]; then
  CASE="afterDeposit"
fi
if [ -z "$NETWORK" ]; then
  NETWORK="gw_testnet_v1"
fi
processNum=4

ACCOUNTSNUMstr=$(cat .env | grep ACCOUNTSNUM)
ACCOUNTSNUM=${ACCOUNTSNUMstr#*ACCOUNTSNUM=}
COUNTstr=$(cat .env | grep COUNT=)
COUNT=${COUNTstr#*COUNT=}
taskNum=$(expr $ACCOUNTSNUM / $COUNT)
loopCount=$(expr $taskNum / $processNum)
for ((j = 0; j < $loopCount; j++)); do
  index=$(expr $j \* $processNum)
  node run.js $processNum "$index" $CASE $NETWORK
done

remainingNum=$(expr $taskNum % $processNum)
if [ $remainingNum -gt 0 ]; then
  remainingIndex=$(expr $loopCount \* $processNum)
  node run.js $remainingNum "$remainingIndex" $CASE $NETWORK
fi
