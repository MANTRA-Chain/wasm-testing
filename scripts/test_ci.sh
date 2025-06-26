#!/bin/bash
#
# A robust script that compiles smart contracts using `just optimize`
# and then uploads the generated WASM files to your chosen network.
# This version includes proper error handling and success verification for CI.

# Usage:
#   just test-on-chain <RPC> <CHAIN_ID> <DENOM> <BINARY> <WALLET>
#   OR
#   ./test_ci.sh -r <RPC> -c <CHAIN_ID> -d <DENOM> -b <BINARY> -w <WALLET>

set -e # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
	echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
	echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
	echo -e "${RED}[ERROR]${NC} $1"
}

# Helper function to safely extract JSON from command output
extract_json() {
	local input="$1"
	local field="$2"

	# Try to parse input directly as JSON
	if echo "$input" | jq -e . >/dev/null 2>&1; then
		echo "$input" | jq -r "$field"
		return 0
	fi

	# If not valid JSON, try to find JSON part in the output
	local json_part=$(echo "$input" | grep -o '{.*}' | head -1)
	if [ -n "$json_part" ] && echo "$json_part" | jq -e . >/dev/null 2>&1; then
		echo "$json_part" | jq -r "$field"
		return 0
	fi

	# If still no valid JSON found, return empty
	echo ""
	return 1
}

# Function to wait for transaction to be included in a block
wait_for_tx() {
	local tx_hash="$1"
	local max_attempts=30
	local attempt=0
	local last_result=""
	local last_error=""

	log_info "Waiting for transaction $tx_hash to be included in block..."

	while [ $attempt -lt $max_attempts ]; do
		# Use temp files to safely capture command output
		local temp_result=$(mktemp)
		local temp_error=$(mktemp)

		log_debug "Attempt $((attempt + 1))/$max_attempts: Querying transaction $tx_hash"

		$BINARY q tx $tx_hash --node $RPC -o json >"$temp_result" 2>"$temp_error"
		local cmd_exit_code=$?

		local result=$(cat "$temp_result" 2>/dev/null || echo "")
		local error_output=$(cat "$temp_error" 2>/dev/null || echo "")

		# Store for final error reporting
		last_result="$result"
		last_error="$error_output"

		# Cleanup temp files
		rm -f "$temp_result" "$temp_error"

		log_debug "Command exit code: $cmd_exit_code"
		log_debug "Result length: ${#result} characters"
		log_debug "Error length: ${#error_output} characters"

		# Handle transaction not found errors (common when tx is still being processed)
		if [ $cmd_exit_code -ne 0 ]; then
			if echo "$error_output" | grep -q "not found\|doesn't exist\|no transaction found"; then
				if [ $attempt -lt 3 ]; then
					log_warn "Transaction not found yet (attempt $((attempt + 1)))"
				fi
				attempt=$((attempt + 1))
				sleep 2
				continue
			else
				if [ $attempt -lt 3 ]; then
					log_warn "Query failed (attempt $((attempt + 1))): $error_output"
				fi
				attempt=$((attempt + 1))
				sleep 2
				continue
			fi
		fi

		# Handle empty result
		if [ -z "$result" ]; then
			if [ $attempt -lt 3 ]; then
				log_warn "Empty result (attempt $((attempt + 1)))"
			fi
			attempt=$((attempt + 1))
			sleep 2
			continue
		fi

		# Debug logging for first few attempts
		if [ $attempt -lt 3 ]; then
			log_debug "Raw result (first 200 chars): ${result:0:200}"
		fi

		# Check if result is valid JSON
		if ! echo "$result" | jq -e . >/dev/null 2>&1; then
			if [ $attempt -lt 3 ]; then
				log_warn "Invalid JSON (attempt $((attempt + 1)))"
				log_debug "Full invalid result: $result"
			fi
			attempt=$((attempt + 1))
			sleep 2
			continue
		fi

		log_debug "Valid JSON found, checking for code field..."
		# Check if the transaction has a code field (means it's processed)
		if echo "$result" | jq -e '.code' >/dev/null 2>&1; then
			local code
			code=$(echo "$result" | jq -r '.code' 2>/dev/null)
			if [ $? -eq 0 ] && [ -n "$code" ]; then
				log_debug "Found transaction code: $code"
				if [ "$code" = "0" ]; then
					log_info "Transaction $tx_hash successful"
					echo "$result"
					return 0
				else
					local raw_log
					raw_log=$(echo "$result" | jq -r '.raw_log // "Unknown error"' 2>/dev/null)
					log_error "Transaction $tx_hash failed with code $code: $raw_log"
					return 1
				fi
			else
				log_debug "Failed to extract code field"
			fi
		else
			if [ $attempt -lt 3 ]; then
				log_warn "Transaction $tx_hash still processing (attempt $((attempt + 1)))"
			fi
		fi

		attempt=$((attempt + 1))
		sleep 2
	done

	log_error "Transaction $tx_hash timed out after $((max_attempts * 2)) seconds"
	log_error "Last query result: $last_result"
	log_error "Last error output: $last_error"
	return 1
}

# Debug logging function
log_debug() {
	if [ "${DEBUG:-}" = "1" ]; then
		echo -e "${BLUE}[DEBUG]${NC} $1"
	fi
}

# Function to execute a transaction and verify success
execute_tx() {
	msg="$1"
	amount="$2"
	should_fail="${3:-false}"

	log_info "Executing: $msg"

	if [ -n "$amount" ]; then
		amount_flag="--amount $amount"
	else
		amount_flag=""
	fi

	# Use safer JSON handling for execute commands
	temp_result=$(mktemp)
	temp_error=$(mktemp)

	$BINARY tx wasm execute $contract_address "$msg" --from $WALLET $amount_flag $TXFLAG >"$temp_result" 2>"$temp_error"
	exit_code=$?

	result=$(cat "$temp_result")
	error_output=$(cat "$temp_error")

	# Cleanup temp files
	rm -f "$temp_result" "$temp_error"

	if [ $exit_code -ne 0 ]; then
		if [ "$should_fail" = "true" ]; then
			log_info "Transaction failed as expected"
			return 0
		else
			log_error "Transaction submission failed: $result $error_output"
			return 1
		fi
	fi

	tx_hash=$(extract_json "$result" ".txhash")
	if [ -z "$tx_hash" ] || [ "$tx_hash" = "null" ]; then
		log_error "Failed to extract transaction hash from: $result"
		return 1
	fi

	log_info "Transaction submitted with hash: $tx_hash"

	if wait_for_tx "$tx_hash"; then
		if [ "$should_fail" = "true" ]; then
			log_error "Transaction $tx_hash was expected to fail but succeeded"
			return 1
		else
			log_info "Transaction completed successfully"
			return 0
		fi
	else
		if [ "$should_fail" = "true" ]; then
			log_info "Transaction failed as expected"
			return 0
		else
			log_error "Transaction failed unexpectedly"
			return 1
		fi
	fi
}

# Function to execute a transaction that should fail
execute_tx_should_fail() {
	msg="$1"
	amount="$2"

	log_info "Executing (should fail): $msg"
	execute_tx "$msg" "$amount" "true"
}

# Function to query contract and verify response
query_contract() {
	contract="$1"
	query="$2"

	log_info "Querying: $query"
	result=$($BINARY q wasm contract-state smart $contract "$query" --node $RPC 2>&1)
	exit_code=$?

	if [ $exit_code -ne 0 ]; then
		log_error "Query failed: $result"
		return 1
	fi

	# Check if result contains error
	if echo "$result" | grep -q "error\|Error\|ERROR"; then
		log_error "Query returned error: $result"
		return 1
	fi

	log_info "Query successful"
	echo "$result"
	return 0
}

# Function to query contract raw state
query_contract_raw() {
	contract="$1"
	query="$2"

	log_info "Querying raw: $query"
	result=$($BINARY q wasm contract-state raw --b64 $contract "$query" --node $RPC 2>&1)
	exit_code=$?

	if [ $exit_code -ne 0 ]; then
		log_error "Raw query failed: $result"
		return 1
	fi

	log_info "Raw query successful"
	echo "$result"
	return 0
}

# Parse command line arguments
while getopts "r:c:d:b:w:" flag; do
	case "${flag}" in
	r) RPC=${OPTARG} ;;
	c) CHAIN_ID=${OPTARG} ;;
	d) DENOM=${OPTARG} ;;
	b) BINARY=${OPTARG} ;;
	w) WALLET=${OPTARG} ;;
	*)
		echo "Usage: $0 -r <RPC> -c <CHAIN_ID> -d <DENOM> -b <BINARY> -w <WALLET>"
		exit 1
		;;
	esac
done

# Ensure all necessary parameters are provided
if [ -z "$RPC" ] || [ -z "$CHAIN_ID" ] || [ -z "$DENOM" ] || [ -z "$BINARY" ] || [ -z "$WALLET" ]; then
	log_error "Missing required parameters"
	echo "Usage: $0 -r <RPC> -c <CHAIN_ID> -d <DENOM> -b <BINARY> -w <WALLET>"
	exit 1
fi

# Source tx flags
source scripts/set_txflag.sh

log_info "Starting contract testing with parameters:"
log_info "RPC: $RPC"
log_info "Chain ID: $CHAIN_ID"
log_info "Denom: $DENOM"
log_info "Binary: $BINARY"
log_info "Wallet: $WALLET"

# Enable debug logging if DEBUG=1 is set
if [ "${DEBUG:-}" = "1" ]; then
	log_info "Debug logging enabled"
fi

# Compile contracts
log_info "Compiling smart contracts with 'just optimize'..."
if ! just optimize; then
	log_error "Compilation failed"
	exit 1
fi

CONTRACT_DIR="artifacts"
if [ ! -d "$CONTRACT_DIR" ]; then
	log_error "Directory '$CONTRACT_DIR' does not exist. Check your compile output."
	exit 1
fi

# Upload contracts
code_ids=()

for CONTRACT in "$CONTRACT_DIR"/*.wasm; do
	if [ ! -f "$CONTRACT" ]; then
		log_error "No WASM files found in $CONTRACT_DIR."
		exit 1
	fi

	log_info "Uploading contract: $CONTRACT"

	# Separate stdout and stderr to handle JSON parsing better
	temp_result=$(mktemp)
	temp_error=$(mktemp)

	$BINARY tx wasm store "$CONTRACT" \
		--from "$WALLET" \
		--instantiate-anyof-addresses "$WALLET" \
		--chain-id "$CHAIN_ID" \
		--node "$RPC" \
		--gas-prices "0.5$DENOM" \
		--gas auto \
		--gas-adjustment 1.4 \
		--broadcast-mode sync \
		--output json \
		-y >"$temp_result" 2>"$temp_error"

	exit_code=$?
	result=$(cat "$temp_result")
	error_output=$(cat "$temp_error")

	# Cleanup temp files
	rm -f "$temp_result" "$temp_error"

	if [ $exit_code -ne 0 ]; then
		log_error "Upload failed for $CONTRACT: $result $error_output"
		exit 1
	fi

	# Try to extract JSON from result, handling potential non-JSON prefixes
	tx_hash=""
	log_debug "Attempting to extract txhash from result..."
	log_debug "Result content: $result"

	if echo "$result" | jq -e . >/dev/null 2>&1; then
		# Result is valid JSON
		log_debug "Result is valid JSON, extracting txhash..."
		tx_hash=$(echo "$result" | jq -r '.txhash' 2>/dev/null)
		if [ $? -ne 0 ]; then
			log_error "jq failed to extract txhash from valid JSON"
			log_error "JSON content: $result"
			exit 1
		fi
	else
		# Result might have non-JSON prefix, try to find JSON part
		log_debug "Result is not valid JSON, attempting to extract JSON portion..."
		json_part=$(echo "$result" | grep -o '{.*}' | head -1)
		if [ -n "$json_part" ] && echo "$json_part" | jq -e . >/dev/null 2>&1; then
			log_debug "Found valid JSON portion, extracting txhash..."
			tx_hash=$(echo "$json_part" | jq -r '.txhash' 2>/dev/null)
			if [ $? -ne 0 ]; then
				log_error "jq failed to extract txhash from extracted JSON"
				log_error "Extracted JSON: $json_part"
				exit 1
			fi
		else
			log_error "Failed to parse JSON from result: $result"
			exit 1
		fi
	fi

	if [ -z "$tx_hash" ] || [ "$tx_hash" = "null" ]; then
		log_error "Failed to extract transaction hash from upload result: $result"
		exit 1
	fi

	log_info "Upload transaction submitted with hash: $tx_hash"

	tx_result=$(wait_for_tx "$tx_hash")
	if [ $? -ne 0 ]; then
		log_error "Upload transaction failed"
		exit 1
	fi

	code_id=$(echo "$tx_result" | jq -r '.events[] | select(.type == "store_code").attributes[] | select(.key == "code_id").value')
	if [ -z "$code_id" ] || [ "$code_id" == "null" ]; then
		log_error "No code_id found in transaction $tx_hash"
		exit 1
	fi

	log_info "$CONTRACT got code_id: $code_id"
	code_ids+=("$code_id")
done

log_info "All contracts uploaded successfully"
log_info "Code IDs: ${code_ids[@]}"

# Instantiate contracts
log_info "Instantiating contracts"

contract_addresses=()

if [ ${#code_ids[@]} -eq 0 ]; then
	log_error "No code_ids found"
	exit 1
fi

if [ ${#code_ids[@]} -eq 1 ]; then
	log_info "Instantiating contract with code_id ${code_ids[0]} twice"
	for i in {1..2}; do
		temp_result=$(mktemp)
		temp_error=$(mktemp)

		$BINARY tx wasm instantiate ${code_ids[0]} '{}' --label test --admin $WALLET $TXFLAG --from $WALLET >"$temp_result" 2>"$temp_error"
		exit_code=$?

		result=$(cat "$temp_result")
		error_output=$(cat "$temp_error")

		# Cleanup temp files
		rm -f "$temp_result" "$temp_error"

		if [ $exit_code -ne 0 ]; then
			log_error "Instantiation failed: $result $error_output"
			exit 1
		fi

		tx_hash=$(extract_json "$result" ".txhash")
		tx_result=$(wait_for_tx "$tx_hash")
		if [ $? -ne 0 ]; then
			log_error "Instantiation transaction failed"
			exit 1
		fi

		contract_address=$(echo "$tx_result" | jq -r '.events[] | select(.type == "instantiate").attributes[] | select(.key == "_contract_address").value')
		if [ -z "$contract_address" ] || [ "$contract_address" == "null" ]; then
			log_error "No contract address found in instantiation transaction"
			exit 1
		fi

		contract_addresses+=("$contract_address")
		log_info "Instantiated contract $i at: $contract_address"
	done
else
	log_info "Instantiating contracts with code_ids ${code_ids[@]}"
	for code_id in "${code_ids[@]}"; do
		temp_result=$(mktemp)
		temp_error=$(mktemp)

		$BINARY tx wasm instantiate $code_id '{}' --label test --admin $WALLET $TXFLAG --from $WALLET >"$temp_result" 2>"$temp_error"
		exit_code=$?

		result=$(cat "$temp_result")
		error_output=$(cat "$temp_error")

		# Cleanup temp files
		rm -f "$temp_result" "$temp_error"

		if [ $exit_code -ne 0 ]; then
			log_error "Instantiation failed for code_id $code_id: $result $error_output"
			exit 1
		fi

		tx_hash=$(extract_json "$result" ".txhash")
		tx_result=$(wait_for_tx "$tx_hash")
		if [ $? -ne 0 ]; then
			log_error "Instantiation transaction failed for code_id $code_id"
			exit 1
		fi

		contract_address=$(echo "$tx_result" | jq -r '.events[] | select(.type == "instantiate").attributes[] | select(.key == "_contract_address").value')
		if [ -z "$contract_address" ] || [ "$contract_address" == "null" ]; then
			log_error "No contract address found in instantiation transaction"
			exit 1
		fi

		contract_addresses+=("$contract_address")
		log_info "Instantiated contract at: $contract_address"
	done
fi

# Test that instantiation with wrong wallet fails
wallet2=mantra123z0enyr7xdczh63jyn764stpvd70h3v98utn9

log_info "Testing instantiation with unauthorized wallet (should fail)..."
temp_result=$(mktemp)
temp_error=$(mktemp)

$BINARY tx wasm instantiate ${code_ids[0]} '{}' --label test_fail --admin $wallet2 $TXFLAG --from $wallet2 >"$temp_result" 2>"$temp_error"
exit_code=$?

result=$(cat "$temp_result")
error_output=$(cat "$temp_error")

# Cleanup temp files
rm -f "$temp_result" "$temp_error"

if [ $exit_code -eq 0 ]; then
	tx_hash=$(extract_json "$result" ".txhash")
	if ! wait_for_tx "$tx_hash" >/dev/null 2>&1; then
		log_info "Instantiation with unauthorized wallet failed as expected"
	else
		log_error "Instantiation with unauthorized wallet should have failed but succeeded"
		exit 1
	fi
else
	log_info "Instantiation with unauthorized wallet failed at submission as expected"
fi

log_info "Instantiated contracts at: ${contract_addresses[@]}"

# Set primary contract for testing
contract_address="${contract_addresses[0]}"

if [ -z "$contract_address" ] || [ "$contract_address" == "null" ]; then
	log_error "No contract address found to interact with"
	exit 1
fi

log_info "--- Interacting with Contract: $contract_address ---"

# Execute Messages
log_info "Testing contract executions..."

execute_tx '{"modify_state":{}}'

execute_tx '{"send_funds":{"receipient":"'${contract_addresses[1]}'"}}' "10uom"

execute_tx_should_fail '{"send_funds":{"receipient":"'${contract_addresses[1]}'"}}'

execute_tx '{"call_contract":{"contract":"'${contract_addresses[1]}'","reply":true}}' "10uom"

execute_tx '{"call_contract":{"contract":"'${contract_addresses[1]}'","reply":false}}' "10uom"

execute_tx '{"delete_entry_on_map":{"key":1}}'

execute_tx '{"fill_map":{"limit":100}}'

execute_tx '{"fill_map":{"limit":1010}}'

execute_tx_should_fail '{"fill_map":{"limit":1000000000000}}'

execute_tx_should_fail '{"invalid":{}}'

# Query contract
log_info "Testing contract queries..."

query_contract $contract_address '{"get_count":{}}'

query_contract_raw $contract_address 'Y291bnQ='

query_contract $contract_address '{"iterate_over_map":{"limit":5}}'

query_contract $contract_address '{"iterate_over_map":{"limit":500}}'

query_contract $contract_address '{"get_entry_from_map":{"entry":1}}'

query_contract $contract_address '{"get_entry_from_map":{"entry":250}}'

# Test migration
log_info "Testing contract migration..."

temp_result=$(mktemp)
temp_error=$(mktemp)

$BINARY tx wasm migrate $contract_address ${code_ids[0]} '{}' --from $WALLET $TXFLAG >"$temp_result" 2>"$temp_error"
exit_code=$?

result=$(cat "$temp_result")
error_output=$(cat "$temp_error")

# Cleanup temp files
rm -f "$temp_result" "$temp_error"

if [ $exit_code -eq 0 ]; then
	tx_hash=$(extract_json "$result" ".txhash")
	if wait_for_tx "$tx_hash" >/dev/null; then
		log_info "Migration successful"
	else
		log_error "Migration transaction failed"
		exit 1
	fi
else
	log_error "Migration submission failed: $result $error_output"
	exit 1
fi

# Test migration with wrong wallet (should fail)
log_info "Testing migration with unauthorized wallet (should fail)..."
temp_result=$(mktemp)
temp_error=$(mktemp)

$BINARY tx wasm migrate $contract_address ${code_ids[0]} '{}' --from $wallet2 $TXFLAG >"$temp_result" 2>"$temp_error"
exit_code=$?

result=$(cat "$temp_result")
error_output=$(cat "$temp_error")

# Cleanup temp files
rm -f "$temp_result" "$temp_error"

if [ $exit_code -eq 0 ]; then
	tx_hash=$(extract_json "$result" ".txhash")
	if ! wait_for_tx "$tx_hash" >/dev/null 2>&1; then
		log_info "Migration with unauthorized wallet failed as expected"
	else
		log_error "Migration with unauthorized wallet should have failed but succeeded"
		exit 1
	fi
else
	log_info "Migration with unauthorized wallet failed at submission as expected"
fi

# Test second contract
contract_address="${contract_addresses[1]}"

log_info "Testing second contract: $contract_address"

query_contract $contract_address '{"get_count":{}}'

query_contract $contract_address '{"iterate_over_map":{"limit":5}}'

query_contract $contract_address '{"iterate_over_map":{"limit":500}}'

query_contract $contract_address '{"iterate_over_map":{"limit":1001}}'

query_contract $contract_address '{"get_entry_from_map":{"entry":1}}'

query_contract $contract_address '{"get_entry_from_map":{"entry":250}}'

# Test native module interop
log_info "--- Testing Native Cosmos Modules ---"

log_info "Sending native tokens..."

temp_result=$(mktemp)
temp_error=$(mktemp)

$BINARY tx bank send $WALLET $wallet2 100uom $TXFLAG --from $WALLET >"$temp_result" 2>"$temp_error"
exit_code=$?

result=$(cat "$temp_result")
error_output=$(cat "$temp_error")

# Cleanup temp files
rm -f "$temp_result" "$temp_error"

if [ $exit_code -eq 0 ]; then
	tx_hash=$(extract_json "$result" ".txhash")
	if wait_for_tx "$tx_hash" >/dev/null; then
		log_info "Native token send successful"
	else
		log_error "Native token send transaction failed"
		exit 1
	fi
else
	log_error "Native token send submission failed: $result $error_output"
	exit 1
fi

temp_result=$(mktemp)
temp_error=$(mktemp)

$BINARY tx bank send $wallet2 $WALLET 80uom $TXFLAG --from $wallet2 >"$temp_result" 2>"$temp_error"
exit_code=$?

result=$(cat "$temp_result")
error_output=$(cat "$temp_error")

# Cleanup temp files
rm -f "$temp_result" "$temp_error"

if [ $exit_code -eq 0 ]; then
	tx_hash=$(extract_json "$result" ".txhash")
	if wait_for_tx "$tx_hash" >/dev/null; then
		log_info "Return native token send successful"
	else
		log_error "Return native token send transaction failed"
		exit 1
	fi
else
	log_error "Return native token send submission failed: $result $error_output"
	exit 1
fi

log_info "--- All tests completed successfully ---"
log_info "Summary:"
log_info "- Contracts compiled: ✓"
log_info "- Contracts uploaded: ✓"
log_info "- Contracts instantiated: ✓"
log_info "- Contract executions: ✓"
log_info "- Contract queries: ✓"
log_info "- Contract migration: ✓"
log_info "- Native module interop: ✓"
log_info "- Expected failures verified: ✓"
