const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment of Enhanced FederatedModelRegistry...\n");

  // Get the deployer's account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Configuration parameters
  const requiredSubmissions = 3; // Minimum 3 hospitals for diversity (as per USE_CASES.md)
  const minSamplesPerUpdate = 500; // Minimum 500 samples per hospital update
  
  console.log("⚙️  Configuration:");
  console.log("   - Required submissions per round:", requiredSubmissions);
  console.log("   - Minimum samples per update:", minSamplesPerUpdate);
  console.log("");

  // Deploy the contract
  console.log("📦 Deploying FederatedModelRegistry contract...");
  const FederatedModelRegistry = await hre.ethers.getContractFactory("FederatedModelRegistry");
  const contract = await FederatedModelRegistry.deploy(requiredSubmissions, minSamplesPerUpdate);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ FederatedModelRegistry deployed to:", contractAddress);
  console.log("");

  // Display important information
  console.log("📋 Contract Details:");
  console.log("   - Network:", hre.network.name);
  console.log("   - Contract Address:", contractAddress);
  console.log("   - Owner Address:", deployer.address);
  console.log("   - Required Submissions:", requiredSubmissions);
  console.log("   - Min Samples per Update:", minSamplesPerUpdate);
  console.log("");

  // Save deployment information
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: contractAddress,
    ownerAddress: deployer.address,
    requiredSubmissions: requiredSubmissions,
    minSamplesPerUpdate: minSamplesPerUpdate,
    deploymentTime: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  console.log("💾 Deployment Info:", JSON.stringify(deploymentInfo, null, 2));
  console.log("");

  // Instructions for next steps
  console.log("📖 Next Steps:");
  console.log("   1. Save the contract address:", contractAddress);
  console.log("   2. Register participants using: registerParticipant(address)");
  console.log("   3. Set oracle address using: setOracleAddress(address)");
  console.log("   4. Initialize genesis model using: initializeGenesisModel(cid, hash)");
  console.log("");

  if (hre.network.name === "sepolia") {
    console.log("🔍 Verify on Etherscan:");
    console.log(`   https://sepolia.etherscan.io/address/${contractAddress}`);
    console.log("");
    console.log("   To verify the contract, run:");
    console.log(`   npx hardhat verify --network sepolia ${contractAddress} ${requiredSubmissions}`);
    console.log("");
  }

  console.log("✨ Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
