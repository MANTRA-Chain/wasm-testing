#!/usr/bin/env bash

if [ -n "$ZSH_VERSION" ]; then
  TXFLAG=(--node $RPC --chain-id $CHAIN_ID --gas-prices 0.3$DENOM --gas auto --gas-adjustment 1.2 -y -b sync --output json)
else
  TXFLAG="--node $RPC --chain-id $CHAIN_ID --gas-prices 0.3$DENOM --gas auto --gas-adjustment 1.2 -y -b sync --output json"
fi
