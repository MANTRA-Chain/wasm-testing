declare interface DeploymentConfig {
  name: string;
  network: 'dukong' | 'mainnet';
  contractWasmPath: string;
  checksumsPath: string;
  initMsg: Record<string, any>;
  saveDeployment: boolean;
}

declare interface DeploymentConfigImport {
  deploymentConfig: DeploymentConfig;
}