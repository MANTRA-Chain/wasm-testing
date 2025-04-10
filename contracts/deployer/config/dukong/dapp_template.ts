export const deploymentConfig: DeploymentConfig = {
  "name": "dapp_template",
  "network": "dukong",
  "contractWasmPath": "../artifacts/dapp_template.wasm",
  "checksumsPath": "../artifacts/checksums.txt",
  "label": "My Dapp Template",
  "initMsg": {
    "count": 8
  },
  "saveDeployment": true
};

export const migrationConfig: MigrationConfig = {
  "name": "dapp_template",
  "network": "dukong",
  "contractAddress": "",
  "contractWasmPath": "../artifacts/dapp_template.wasm",
  "checksumsPath": "../artifacts/checksums.txt",
  "migrateMsg": {},
  "saveMigration": true
}