import fs from "fs";

export const getChecksum = (
  contractWasmPath: string, 
  checksumsPath: string
): string => {
  const wasmFileName = contractWasmPath.split("/").pop();
  const checksumsFile = fs.readFileSync(checksumsPath);
  if (!checksumsFile) {
    console.error("checksumsFile is missing");
    return;
  }
  const checksums = checksumsFile.toString().split("\n").map((line) => ({ 
    filename: line.split("  ")[1], 
    checksum: line.split("  ")[0] 
  }));
  const checksum = checksums.find((c) => c.filename === wasmFileName)?.checksum;
  if (!checksum) {
    console.error(`Checksum for ${wasmFileName} not found in ${checksumsPath}`);
    return;
  }
  return checksum;
}

export const getCodeIdFromChecksum = (config: MigrationConfig | DeploymentConfig): number | null => {
  const {
    network,
    name,
    contractWasmPath,
    checksumsPath,
  } = config;
  const wasmFileName = contractWasmPath.split("/").pop();
  const deploymentFolder = `./deployment/${network}`;
  
  if (!fs.existsSync(deploymentFolder)) {
    // if the deployment folder does not exist
    return null
  }
  
  const checksum = getChecksum(contractWasmPath, checksumsPath);
  const filenames = fs.readdirSync(deploymentFolder).filter((filename) => {
    return filename.startsWith(name);
  });
  const existingDeployment = filenames.map((filename) => {
    const filePath = `${deploymentFolder}/${filename}`;
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileContent);
  }).find((deployment) => {
    return deployment.checksum === checksum;
  });

  const codeId = existingDeployment?.codeId;
  if (!codeId) {
    return null;
  }
  return codeId;
}