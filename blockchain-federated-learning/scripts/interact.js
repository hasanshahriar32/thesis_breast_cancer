const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Interact with FederatedModelRegistry for Histopathology Classification
 * Model: EfficientNet-B0 + Coordinate Attention
 * Task: Binary Classification (Benign vs Malignant)
 */
async function main() {
  console.log("🔗 Connecting to FederatedModelRegistry (Histopathology)...\n");

  // Load contract address from deployment info
  const deploymentPath = path.join(__dirname, "../deployment-info.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ deployment-info.json not found. Please deploy the contract first.");
    console.error("   Run: npx hardhat run scripts/deploy.js --network sepolia");
    process.exit(1);
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const CONTRACT_ADDRESS = deploymentInfo.contractAddress;
  console.log("📍 Contract Address:", CONTRACT_ADDRESS);

  // Get the signer (your MetaMask account)
  const [signer] = await hre.ethers.getSigners();
  console.log("📝 Connected with account:", signer.address);
  console.log("");

  // Get the contract instance
  const contract = await hre.ethers.getContractAt("FederatedModelRegistry", CONTRACT_ADDRESS, signer);

  // Example operations
  try {
    // 1. Get current round
    const currentRound = await contract.currentRound();
    console.log("📊 Current Round:", currentRound.toString());

    // 2. Get model count
    const modelCount = await contract.getModelCount();
    console.log("📦 Total Models Published:", modelCount.toString());

    // 3. Check if you're a participant
    const isParticipant = await contract.isParticipant(signer.address);
    console.log("👤 Are you a participant?", isParticipant);

    // 4. Get all participants
    const participants = await contract.getParticipants();
    console.log("👥 Total Participants:", participants.length);

    // 5. Get current round submissions
    const submissions = await contract.getCurrentRoundSubmissions();
    console.log("📝 Current Round Submissions:", submissions.toString());

    // 6. Get latest model (if any)
    if (modelCount > 0n) {
      const latestModel = await contract.getLatestGlobalModel();
      console.log("\n📈 Latest Global Histopathology Model:");
      console.log("   - Version:", latestModel.version.toString());
      console.log("   - IPFS CID:", latestModel.modelWeightsCID);
      console.log("   - Accuracy:", (Number(latestModel.accuracy) / 100).toFixed(2) + "%");
      console.log("   - AUC Score:", (Number(latestModel.aucScore) / 10000).toFixed(4));
      console.log("   - Sensitivity:", (Number(latestModel.sensitivity) / 10000 * 100).toFixed(2) + "%");
      console.log("   - Specificity:", (Number(latestModel.specificity) / 10000 * 100).toFixed(2) + "%");
      console.log("   - Total Samples:", latestModel.totalSamples.toString());
      console.log("   - Contributors:", latestModel.contributorCount.toString());
    }

    console.log("\n✅ Contract interaction completed successfully!");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
