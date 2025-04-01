#!/usr/bin/env bash
set -e

project_root_path=$(realpath "$0" | sed 's|\(.*\)/.*|\1|' | cd ../ | pwd)
artifacts_path=$project_root_path/artifacts
source $project_root_path/.env
source scripts/set_txflag.sh
tx_delay=8

function store_artifact_on_chain() {
  if [ $# -eq 1 ]; then
    local artifact=$1
  else
    echo "store_artifact_on_chain needs the artifact path"
    exit 1
  fi

  echo -e "📦 Storing \033[1m$(basename $artifact)\033[0m on $CHAIN_ID..."
  local res=$($BINARY tx wasm store $artifact $TXFLAG --from $FROM_ACCOUNT | jq -r '.txhash')
  sleep $tx_delay
  local code_id=$($BINARY q tx $res --node $RPC -o json | jq -r '.events[] | select(.type == "store_code").attributes[] | select(.key == "code_id").value')

  # Download the wasm binary from the chain and compare it to the original one
  echo "Verifying integrity of wasm artifact on chain..."
  $BINARY query wasm code $code_id --node $RPC downloaded_wasm.wasm >/dev/null 2>&1
  # The two binaries should be identical
  diff $artifact downloaded_wasm.wasm
  rm downloaded_wasm.wasm

  echo -e "\033[0;32m\033[1m$(basename $artifact) stored with code_id: $code_id\033[0m\n"
  echo -e "--------------------------------------------------\n"
}

function store_artifacts_on_chain() {
  for artifact in $artifacts_path/*.wasm; do
    store_artifact_on_chain $artifact
  done

  echo -e "🎉 Stored artifacts on $CHAIN_ID successfully! 🎉\n"
}

function store() {
  if [ -z "$1" ]; then
    echo -e "⚠️ No argument provided. Storing all artifacts on chain. ⚠️\n"
    store_artifacts_on_chain
  else
    store_artifact_on_chain $1
  fi
}

store $1