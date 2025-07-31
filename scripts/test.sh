#!/bin/bash
#
# A script that compiles smart contracts using `just optimize`
# and then uploads the generated WASM files to your chosen network.

# Usage:
#   just test-on-chain <RPC> <CHAIN_ID> <DENOM> <BINARY> <WALLET> <WALLET2>
#   OR
#   ./test.sh -r <RPC> -c <CHAIN_ID> -d <DENOM> -b <BINARY> -w <WALLET> -W <WALLET2>
#

execute_tx() {
	local msg="$1"
	local amount="$2"

	if [ -n "$amount" ]; then
		amount_flag="--amount $amount"
	else
		amount_flag=""
	fi

	$BINARY tx wasm execute $contract_address "$msg" --from $WALLET $amount_flag $TXFLAG

	sleep 10
}

query_contract() {
	local contract="$1"
	local query="$2"
	$BINARY q wasm contract-state smart $contract "$query" --node $RPC
}

query_contract_raw() {
	local contract="$1"
	local query="$2"
	$BINARY q wasm contract-state raw --b64 $contract "$query" --node $RPC
}

while getopts "r:c:d:b:w:W:" flag; do
	case "${flag}" in
	r) RPC=${OPTARG} ;;
	c) CHAIN_ID=${OPTARG} ;;
	d) DENOM=${OPTARG} ;;
	b) BINARY=${OPTARG} ;;
	w) WALLET=${OPTARG} ;;
	W) WALLET2=${OPTARG} ;;
	*)
		echo "Usage: $0 -r <RPC> -c <CHAIN_ID> -d <DENOM> -b <BINARY> -w <WALLET> -W <WALLET2>"
		exit 1
		;;
	esac
done

# Ensure all necessary parameters are provided
if [ -z "$RPC" ] || [ -z "$CHAIN_ID" ] || [ -z "$DENOM" ] || [ -z "$BINARY" ] || [ -z "$WALLET" ] || [ -z "$WALLET2" ]; then
	echo "Usage: $0 -r <RPC> -c <CHAIN_ID> -d <DENOM> -b <BINARY> -w <WALLET> -W <WALLET2>"
	exit 1
fi

source scripts/set_txflag.sh

echo "Compiling smart contracts with 'just optimize'..."
if ! just optimize; then
	echo "Compilation failed. Exiting."
	exit 1
fi

CONTRACT_DIR="artifacts"
if [ ! -d "$CONTRACT_DIR" ]; then
	echo "Directory '$CONTRACT_DIR' does not exist. Check your compile output."
	exit 1
fi

code_ids=()

for CONTRACT in "$CONTRACT_DIR"/*.wasm; do
	if [ ! -f "$CONTRACT" ]; then
		echo "No WASM files found in $CONTRACT_DIR."
		exit 1
	fi

	echo -e "\nUploading contract: $CONTRACT"

	tx_hash=$($BINARY tx wasm store "$CONTRACT" \
		--from "$WALLET" \
		--instantiate-anyof-addresses "$WALLET" \
		--chain-id "$CHAIN_ID" \
		--node "$RPC" \
		--gas-prices "0.5$DENOM" \
		--gas auto \
		--gas-adjustment 1.4 \
		--broadcast-mode sync \
		--output json \
		-y | jq -r '.txhash')

	if [ $? -ne 0 ]; then
		echo "Upload failed for $CONTRACT. Exiting."
		exit 1
	fi

	sleep 10

	code_id=$($BINARY q tx $tx_hash --node $RPC -o json | jq -r '.events[] | select(.type == "store_code").attributes[] | select(.key == "code_id").value')
	if [ -z "$code_id" ] || [ "$code_id" == "null" ]; then
		echo "No code_id found in transaction $tx_hash."
	else
		echo "$CONTRACT got code_id: $code_id"
		code_ids+=("$code_id")
	fi
done

echo "All contracts have been uploaded successfully."
echo "All extracted code_ids: ${code_ids[@]}"

## instantiate the contract
echo "Instantiating contracts"

contract_addresses=()
# if there's only 1 item in  ${code_ids[@]}, instantiate it twice with just instantiate
if [ ${#code_ids[@]} -eq 0 ]; then
	echo "No code_ids found. Exiting."
	exit 1
fi

if [ ${#code_ids[@]} -eq 1 ]; then
	echo "Instantiating contract with code_id ${code_ids[0]}"
	for i in {1..2}; do
		res=$($BINARY tx wasm instantiate ${code_ids[0]} '{}' --label test --admin $WALLET $TXFLAG --from $WALLET | jq -r '.txhash')
		sleep 10
		contract_address=$($BINARY q tx $res --node $RPC -o json | jq -r '.events[] | select(.type == "instantiate").attributes[] | select(.key == "_contract_address").value')
		contract_addresses+=("$contract_address")
	done
else
	echo "Instantiating contracts with code_ids ${code_ids[@]}"
	for code_id in "${code_ids[@]}"; do
		res=$($BINARY tx wasm instantiate $code_id '{}' --label test --admin $WALLET $TXFLAG --from $WALLET | jq -r '.txhash')
		sleep 10
		contract_address=$($BINARY q tx $res --node $RPC -o json | jq -r '.events[] | select(.type == "instantiate").attributes[] | select(.key == "_contract_address").value')
		contract_addresses+=("$contract_address")
	done
fi

wallet2=mantra1xnx2vcf5s9446sfat6x4ecghhw705gn9nfwxh3

echo -e "\nTrying to instantiate a contract with $WALLET2 should fail..."
$BINARY tx wasm instantiate ${code_ids[0]} '{}' --label test_fail --admin $WALLET2 $TXFLAG --from $WALLET2

echo -e "\nInstantiated contracts at : ${contract_addresses[@]}"

contract_address="${contract_addresses[0]}"

if [ -z "$contract_address" ] || [ "$contract_address" == "null" ] || [ "$contract_address" == "" ]; then
	echo "No contract address found to interact with. Exiting."
	exit 1
fi

echo -e "\n--- Interacting with Contract: $contract_address ---\n"

# --- Execute Messages ---
echo -e "\nExecuting ModifyState..."
execute_tx '{"modify_state":{}}'

echo -e "\nExecuting SendFunds with funds..."
execute_tx '{"send_funds":{"receipient":"'${contract_addresses[1]}'"}}' "10uom"

echo -e "\nExecuting SendFunds without funds, should fail..."
execute_tx '{"send_funds":{"receipient":"'${contract_addresses[1]}'"}}'

echo -e "\nExecuting CallContract with reply..."
execute_tx '{"call_contract":{"contract":"'${contract_addresses[1]}'","reply":true}}' "10uom"

echo -e "\nExecuting CallContract without reply..."
execute_tx '{"call_contract":{"contract":"'${contract_addresses[1]}'","reply":false}}' "10uom"

echo -e "\nExecuting DeleteEntryOnMap..."
execute_tx '{"delete_entry_on_map":{"key":1}}'

echo -e "\nExecuting FillMap with 100 entries..."
execute_tx '{"fill_map":{"limit":100}}'

echo -e "\nExecuting FillMap with 1010 entries..."
execute_tx '{"fill_map":{"limit":1010}}'

echo -e "\nExecuting FillMap with 1000000000000 entries, should gas out..."
execute_tx '{"fill_map":{"limit":1000000000000}}'

echo -e "\nExecuting with invalid msg, should fail..."
execute_tx '{"invalid":{}'

echo -e "\nQuerying contract $contract_address"

echo -e "\nQuerying GetCount..."
query_contract $contract_address '{"get_count":{}}'

echo -e "\nQuerying GetCount (raw)..."
query_contract_raw $contract_address 'Y291bnQ='

echo -e "\nQuerying IterateOverMap with 5 items..."
query_contract $contract_address '{"iterate_over_map":{"limit":5}}'

echo -e "\nQuerying IterateOverMap with 500 items..."
query_contract $contract_address '{"iterate_over_map":{"limit":500}}'

echo -e "\nQuerying GetEntryFromMap with key 1"
query_contract $contract_address '{"get_entry_from_map":{"entry":1}}'

echo -e "\nQuerying GetEntryFromMap with key 250"
query_contract $contract_address '{"get_entry_from_map":{"entry":250}}'

echo -e "\Migrating contract..."
$BINARY tx wasm migrate $contract_address ${code_ids[@]} '{}' --from $WALLET $TXFLAG

echo -e "\Migrating contract with wrong wallet, should fail..."
$BINARY tx wasm migrate $contract_address ${code_ids[@]} '{}' --from $WALLET2 $TXFLAG

contract_address="${contract_addresses[1]}"

echo -e "\nQuerying contract $contract_address"

echo -e "\nQuerying GetCount..."
query_contract $contract_address '{"get_count":{}}'

echo -e "\nQuerying IterateOverMap with 5 items..."
query_contract $contract_address '{"iterate_over_map":{"limit":5}}'

echo -e "\nQuerying IterateOverMap with 500 items..."
query_contract $contract_address '{"iterate_over_map":{"limit":500}}'

echo -e "\nQuerying IterateOverMap with 1001 items..."
query_contract $contract_address '{"iterate_over_map":{"limit":1001}}'

echo -e "\nQuerying GetEntryFromMap with key 1"
query_contract $contract_address '{"get_entry_from_map":{"entry":1}}'

echo -e "\nQuerying GetEntryFromMap with key 250"
query_contract $contract_address '{"get_entry_from_map":{"entry":250}}'

echo -e "\n--- All contract interactions complete ---"

echo -e "\n--- Interop with Native Cosmos Modules ---"

echo -e "\nSending native tokens..."
$BINARY tx bank send $WALLET $WALLET2 100uom $TXFLAG --from $WALLET
sleep 8
$BINARY tx bank send $WALLET2 $WALLET 80uom $TXFLAG --from $WALLET2
sleep 8
