import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { GasPrice } from "@cosmjs/stargate";
import dotenv from "dotenv";
import fs from "fs";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { NetworkConfig } from "./network";
import { getChecksum, getCodeIdFromChecksum } from "./utils";

dayjs.extend(utc)

dotenv.config();

const mnemonic = process.env.MNEMONIC; // Replace with your mnemonic

async function deploy() {
  if (!mnemonic) {
    console.error("env.MNEMONIC is required");
    return;
  }

  const configPath = process.argv[2];

  if (!configPath) {
    console.error("Please provide the path to the config file.");
    console.error("e.g. yarn deploy ./config/dukong/dapp_template.json");
    return;
  }

  // Step 0: Read config file
  const { deploymentConfig }: ConfigImport = await import(configPath);
  if (!deploymentConfig) {
    console.error("deploymentConfig is required");
    return;
  }
  const networkConfig = NetworkConfig[deploymentConfig.network];
  const {
    rpcEndpoint,
    mintScanUrl
  } = networkConfig;

  // Step 1: Set up wallet and client
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: "mantra", // Replace with the correct prefix for your chain
  });
  const [account] = await wallet.getAccounts();

  console.log(`Deployment Config: ${JSON.stringify(deploymentConfig, null, 2)}`);
  console.log(`Network Config: ${JSON.stringify(networkConfig, null, 2)}`);
  console.log(`Deployer: ${account.address}`);

  // Step 2: Connect to the blockchain
  const client = await SigningCosmWasmClient.connectWithSigner(
    rpcEndpoint,
    wallet,
    { gasPrice: GasPrice.fromString("0.01uom") }
  );

  const {
    name: deploymentName,
    network,
    contractWasmPath,
    checksumsPath,
    label,
    initMsg,
    memo,
    funds = [],
    admin = account.address,
    saveDeployment,
  } = deploymentConfig;

  console.log("Connected to blockchain");

  // Step 3: Upload contract
  const checksum = getChecksum(contractWasmPath, checksumsPath);
  const codeId = await (async () => {
    const existingCodeId = getCodeIdFromChecksum(deploymentConfig);
    if (existingCodeId) {
      console.log(`Existing Code ID found: ${existingCodeId} for checksum: ${checksum}`);
      return existingCodeId;
    }

    const wasmCode = fs.readFileSync(contractWasmPath);
    const uploadReceipt = await client.upload(
      account.address,
      wasmCode,
      "auto",
    );
    const codeId = uploadReceipt.codeId;
    console.log(`Contract uploaded with Code ID: ${codeId}`);
    console.log(`Checksum: ${checksum}`);
    return codeId;
  })();

  // Step 4: Instantiate contract
  const instantiateReceipt = await client.instantiate(
    account.address,
    codeId,
    initMsg,
    label,
    "auto",
    {
      memo,
      admin,
      funds,
    }
  );
  const { contractAddress, transactionHash } = instantiateReceipt;
  const transactionUrl = `${mintScanUrl}${transactionHash}`;
  console.log(`Contract instantiated at address: ${contractAddress}`);
  console.log(`TransactionHash: ${transactionHash}`);
  console.log(`View transaction: ${transactionUrl}`);

  // Step 5: Save deployment info
  if (saveDeployment) {
    const deploymentInfo = {
      deployer: account.address,
      network,
      rpcEndpoint: networkConfig.rpcEndpoint,
      codeId,
      checksum,
      contractAddress,
      initMsg,
      transactionHash,
      transactionUrl,
    };
    // create directory if not exists
    const deploymentDir = `deployment/${network}`;
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }
    // save deployment info to file
    // time string in YYYY_MM_DD_HH_MM_SS format using dayjs, in UTC time
    const timeString = dayjs.utc().format("YYYY_MM_DD_HH_mm_ss");
    const deploymentFilePath = `deployment/${network}/${deploymentName}_${timeString}.json`;
    fs.writeFileSync(deploymentFilePath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`Deployment info saved to ${deploymentFilePath}`);
  }
}

deploy().catch(console.error);
