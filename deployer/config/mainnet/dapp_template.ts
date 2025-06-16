export const deploymentConfig: DeploymentConfig = {
  "name": "dapp_template",
  "network": "mainnet",
  "contractWasmPath": "../artifacts/dapp_template.wasm",
  "checksumsPath": "../artifacts/checksums.txt",
  "label": "My Dapp Template",
  "initMsg": {
    "count": 0
  },
  "saveDeployment": true
}