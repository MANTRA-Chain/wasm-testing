#!/usr/bin/env bash
set -e

project_root_path=$(realpath "$0" | sed 's|\(.*\)/.*|\1|' | cd ../ | pwd)
source $project_root_path/.env
source scripts/set_txflag.sh
tx_delay=8

while getopts ":c:i:l:a:m:" opt; do
	case $opt in
	c) code_id="$OPTARG" ;;
	i) instantiate_msg="$OPTARG" ;;
	l) label="$OPTARG" ;;
	a) admin="$OPTARG" ;;
	m) amount="$OPTARG" ;;
	\?)
		echo "Invalid option -$OPTARG"
		exit 1
		;;
	esac
done

if [ -z "$code_id" ] || [ -z "$instantiate_msg" ] || [ -z "$label" ]; then
	echo "Please provide code_id, instantiate_msg, and label"
	exit 1
fi

function instantiate_contract() {
	echo -e "🚀 Instantiating contract with code_id $code_id, label $label..."
	if [ -n "$admin" ]; then
		echo -e "... and admin $admin"
	else
		echo -e "... with no admin"
	fi

	if [ -n "$amount" ]; then
		echo -e "... and amount $amount"
		if [ -n "$admin" ]; then
			local res=$($BINARY tx wasm instantiate $code_id "$instantiate_msg" --label "$label" --admin "$admin" --amount=$amount $TXFLAG --from $FROM_ACCOUNT | jq -r '.txhash')
		else
			local res=$($BINARY tx wasm instantiate $code_id "$instantiate_msg" --label "$label" --no-admin --amount=$amount $TXFLAG --from $FROM_ACCOUNT | jq -r '.txhash')
		fi

	else
		if [ -n "$admin" ]; then
			local res=$($BINARY tx wasm instantiate $code_id "$instantiate_msg" --label "$label" --admin "$admin" $TXFLAG --from $FROM_ACCOUNT | jq -r '.txhash')
		else
			local res=$($BINARY tx wasm instantiate $code_id "$instantiate_msg" --label "$label" --no-admin $TXFLAG --from $FROM_ACCOUNT | jq -r '.txhash')
		fi
	fi

	if [ -z "$res" ]; then
		echo -e "\n❌  \033[0;31mCouldn't instantiate the contract.\033[0m\n"
		exit 1
	fi

	sleep $tx_delay
	local contract_address=$($BINARY q tx $res --node $RPC -o json | jq -r '.events[] | select(.type == "instantiate").attributes[] | select(.key == "_contract_address").value')

	if [ -z "$contract_address" ]; then
		echo -e "❌ \033[0;31mError: Contract address is empty. Please check the transaction $res.\033[0m\n"
		exit 1
	fi

	echo "Tx hash: $res"
	echo -e "\n\033[0;32m\033[1mContract instantiated at address: $contract_address\033[0m\n"
}

instantiate_contract
