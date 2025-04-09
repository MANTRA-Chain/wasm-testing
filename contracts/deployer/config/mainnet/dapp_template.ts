export const deploymentConfig: DeploymentConfig = {
  "name": "dapp_template",
  "network": "mainnet",
  "contractWasmPath": "../artifacts/dapp_template.wasm",
  "initMsg": {
    "count": 8
  },
  "saveDeployment": true
}