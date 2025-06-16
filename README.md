# Wasm Testing

This repo contains a simple cosmwasm contract to test multiple wasm functionalities on chain.

## How to use

Run `just test-on-chain RPC CHAIN_ID DENOM BINARY WALLET` and the script `test.sh` will take care of itself.

The script will:
- Compile a cosmwasm contract
- Upload the contract to the specified chain
- Instantiate two instances of the contract
- Execute all the `ExecuteMsg` messages of the contract
- Query the contract
- Migrate the contract

## Requirements

- Docker
- just (https://github.com/casey/just)
- jq
- mantrachaind
