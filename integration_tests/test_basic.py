import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import pytest

from .utils import (
    DEFAULT_DENOM,
    assert_transfer,
    log_info,  # Add this import
)


def test_simple(mantra):
    """
    check number of validators
    """
    cli = mantra.cosmos_cli()
    assert len(cli.validators()) == 3
    # check vesting account
    addr = cli.address("reserve")
    account = cli.account(addr)["account"]
    assert account["type"] == "/cosmos.vesting.v1beta1.DelayedVestingAccount"
    assert account["value"]["base_vesting_account"]["original_vesting"] == [
        {"denom": DEFAULT_DENOM, "amount": "100000000000"}
    ]


def test_transfer(mantra):
    """
    check simple transfer tx success
    """
    cli = mantra.cosmos_cli()
    addr_a = cli.address("community")
    addr_b = cli.address("reserve")
    assert_transfer(cli, addr_a, addr_b)


def _test_cosmwasm(mantra, connect_mantra):
    """
    check run ci success
    """
    import subprocess
    import os
    from pathlib import Path
    
    # Set up environment variables
    env = os.environ.copy()

    # Use connect_mantra if mantra is None
    if mantra is None:
        cli = connect_mantra.cosmos_cli(os.getcwd())
        chain_obj = connect_mantra
        # For connect tests, use SEED_PHRASE directly from environment
        seed_phrase = os.getenv('SEED_PHRASE')
        if seed_phrase:
            env['SEED_PHRASE'] = seed_phrase
    else:
        cli = mantra.cosmos_cli()
        chain_obj = mantra
        # For local/ci tests, use SIGNER1_MNEMONIC
        env['SEED_PHRASE'] = os.getenv('SIGNER1_MNEMONIC')

    # Extract connection parameters
    rpc = cli.node_rpc
    chain_id = cli.chain_id
    denom = DEFAULT_DENOM
    binary = chain_obj.chain_binary  # Get binary from the appropriate object
    
    # Path to the test script
    script_path = Path(__file__).parent.parent / "scripts" / "test_ci.sh"

    # Build the command
    cmd = [
        str(script_path),
        "-r", rpc,
        "-c", chain_id,
        "-d", denom,
        "-b", binary
    ]
    
    # Add wallet parameter only if it exists
    if hasattr(chain_obj, 'wallet') and chain_obj.wallet:
        cmd.extend(["-w", chain_obj.wallet])
    
    log_info(f"Running test_ci.sh with args: {' '.join(cmd)}")
    log_info(f"RPC: {rpc}, Chain ID: {chain_id}, Denom: {denom}, Binary: {binary}")
    
    # Run the script
    result = subprocess.run(
        cmd,
        env=env,
        capture_output=True,
        text=True
    )
    
    # Print output for debugging
    if result.stdout:
        print("STDOUT:", result.stdout)
    if result.stderr:
        print("STDERR:", result.stderr)
    
    # Check if the script succeeded (return code 0)
    assert result.returncode == 0, f"test_ci.sh failed with return code {result.returncode}"


@pytest.mark.connect
def test_connect_cosmwasm(connect_mantra):
    _test_cosmwasm(None, connect_mantra)

def test_connect(mantra):
    _test_cosmwasm(mantra, None)
