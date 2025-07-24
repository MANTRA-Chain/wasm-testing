import configparser
import hashlib
import json
import os
import re
import socket
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from itertools import takewhile
from pathlib import Path
from urllib.parse import urlparse

import requests
from dateutil.parser import isoparse
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / "scripts/.env")

DEFAULT_DENOM = "uom"
CHAIN_ID = "mantra-canary-net-1"
# the default initial base fee used by integration tests
DEFAULT_GAS_AMT = 0.01
DEFAULT_GAS_PRICE = f"{DEFAULT_GAS_AMT}{DEFAULT_DENOM}"
DEFAULT_GAS = 200000
DEFAULT_FEE = int(DEFAULT_GAS_AMT * DEFAULT_GAS)
WEI_PER_ETH = 10**18  # 10^18 wei == 1 ether
UOM_PER_OM = 10**6  # 10^6 uom == 1 om
WEI_PER_UOM = 10**12  # 10^12 wei == 1 uom
ADDRESS_PREFIX = "mantra"

def wait_for_fn(name, fn, *, timeout=240, interval=1):
    for i in range(int(timeout / interval)):
        result = fn()
        if result:
            return result
        time.sleep(interval)
    else:
        raise TimeoutError(f"wait for {name} timeout")


def wait_for_block_time(cli, t):
    print("wait for block time", t)
    while True:
        now = isoparse(get_sync_info(cli.status())["latest_block_time"])
        print("block time now:", now)
        if now >= t:
            break
        time.sleep(0.5)


def w3_wait_for_block(w3, height, timeout=240):
    for _ in range(timeout * 2):
        try:
            current_height = w3.eth.block_number
        except Exception as e:
            print(f"get json-rpc block number failed: {e}", file=sys.stderr)
        else:
            if current_height >= height:
                break
            print("current block height", current_height)
        time.sleep(0.5)
    else:
        raise TimeoutError(f"wait for block {height} timeout")


def get_sync_info(s):
    return s.get("SyncInfo") or s.get("sync_info")


def wait_for_new_blocks(cli, n, sleep=0.5, timeout=240):
    cur_height = begin_height = int(get_sync_info(cli.status())["latest_block_height"])
    start_time = time.time()
    while cur_height - begin_height < n:
        time.sleep(sleep)
        cur_height = int(get_sync_info(cli.status())["latest_block_height"])
        if time.time() - start_time > timeout:
            raise TimeoutError(f"wait for block {begin_height + n} timeout")
    return cur_height


def wait_for_block(cli, height, timeout=240):
    for i in range(timeout * 2):
        try:
            status = cli.status()
        except AssertionError as e:
            print(f"get sync status failed: {e}", file=sys.stderr)
        else:
            current_height = int(get_sync_info(status)["latest_block_height"])
            print("current block height", current_height)
            if current_height >= height:
                break
        time.sleep(0.5)
    else:
        raise TimeoutError(f"wait for block {height} timeout")


def wait_for_port(port, host="127.0.0.1", timeout=40.0):
    print("wait for port", port, "to be available")
    start_time = time.perf_counter()
    while True:
        try:
            with socket.create_connection((host, port), timeout=timeout):
                break
        except OSError as ex:
            time.sleep(0.1)
            if time.perf_counter() - start_time >= timeout:
                raise TimeoutError(
                    "Waited too long for the port {} on host {} to start accepting "
                    "connections.".format(port, host)
                ) from ex


def wait_for_url(url, timeout=40.0):
    print("wait for url", url, "to be available")
    start_time = time.perf_counter()
    while True:
        try:
            parsed = urlparse(url)
            host = parsed.hostname
            port = parsed.port
            with socket.create_connection((host, int(port or 80)), timeout=timeout):
                break
        except OSError as ex:
            time.sleep(0.1)
            if time.perf_counter() - start_time >= timeout:
                raise TimeoutError(
                    "Waited too long for the port {} on host {} to start accepting "
                    "connections.".format(port, host)
                ) from ex


def supervisorctl(inipath, *args):
    return subprocess.check_output(
        (sys.executable, "-msupervisor.supervisorctl", "-c", inipath, *args),
    ).decode()


def find_log_event_attrs(events, ev_type, cond=None):
    for ev in events:
        if ev["type"] == ev_type:
            attrs = {attr["key"]: attr["value"] for attr in ev["attributes"]}
            if cond is None or cond(attrs):
                return attrs
    return None


def send_raw_transactions(w3, raw_transactions):
    with ThreadPoolExecutor(len(raw_transactions)) as exec:
        tasks = [
            exec.submit(w3.eth.send_raw_transaction, raw) for raw in raw_transactions
        ]
        sended_hash_set = {future.result() for future in as_completed(tasks)}
    return sended_hash_set



def get_balance(cli, name):
    try:
        addr = cli.address(name)
    except Exception as e:
        if "key not found" not in str(e):
            raise
        addr = name
    uom = cli.balance(addr)
    return uom


def assert_balance(cli, w3, name, evm=False):
    try:
        addr = cli.address(name)
    except Exception as e:
        if "key not found" not in str(e):
            raise
        addr = name
    uom = get_balance(cli, name)
    wei = w3.eth.get_balance(bech32_to_eth(addr))
    assert uom == wei // WEI_PER_UOM
    print(
        f"{name} contains uom: {uom}, om: {uom // UOM_PER_OM},",
        f"wei: {wei}, ether: {wei // WEI_PER_ETH}.",
    )
    return wei if evm else uom


def assert_transfer(cli, addr_a, addr_b, amt=1):
    balance_a = cli.balance(addr_a)
    balance_b = cli.balance(addr_b)
    rsp = cli.transfer(addr_a, addr_b, f"{amt}{DEFAULT_DENOM}")
    assert rsp["code"] == 0, rsp["raw_log"]
    res = find_log_event_attrs(rsp["events"], "tx", lambda attrs: "fee" in attrs)
    fee = int("".join(takewhile(lambda s: s.isdigit() or s == ".", res["fee"])))
    assert cli.balance(addr_a) == balance_a - amt - fee
    assert cli.balance(addr_b) == balance_b + amt


def recover_community(cli, tmp_path):
    return cli.create_account(
        "community",
        mnemonic=os.getenv("COMMUNITY_MNEMONIC"),
        home=tmp_path,
        coin_type=60,
    )["address"]


def transfer_via_cosmos(cli, from_addr, to_addr, amount):
    tx = cli.transfer(
        from_addr,
        to_addr,
        f"{amount}{DEFAULT_DENOM}",
        generate_only=True,
        chain_id=cli.chain_id,
    )
    tx_json = cli.sign_tx_json(
        tx, from_addr, home=cli.data_dir, node=cli.node_rpc, chain_id=cli.chain_id
    )
    rsp = cli.broadcast_tx_json(tx_json, home=cli.data_dir)
    assert rsp["code"] == 0, rsp["raw_log"]
    attrs = find_log_event_attrs(rsp["events"], "tx", lambda attrs: "fee" in attrs)
    return int("".join(takewhile(lambda s: s.isdigit() or s == ".", attrs["fee"])))


def edit_ini_sections(chain_id, ini_path, callback):
    ini = configparser.RawConfigParser()
    ini.read(ini_path)
    reg = re.compile(rf"^program:{chain_id}-node(\d+)")
    for section in ini.sections():
        m = reg.match(section)
        if m:
            i = m.group(1)
            old = ini[section]
            ini[section].update(callback(i, old))
    with ini_path.open("w") as fp:
        ini.write(fp)


def log_info(message):
    """Simple logging function for consistency with shell script output"""
    print(f"[INFO] {message}")
