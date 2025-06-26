#!/usr/bin/env bash

if [ -n "$ZSH_VERSION" ]; then
	TXFLAG=(--node $RPC --chain-id $CHAIN_ID --gas-prices 0.5$DENOM --gas auto --gas-adjustment 1.4 -y -b sync --output json --keyring-backend test)
else
	TXFLAG="--node $RPC --chain-id $CHAIN_ID --gas-prices 0.5$DENOM --gas auto --gas-adjustment 1.4 -y -b sync --output json --keyring-backend test"
fi
