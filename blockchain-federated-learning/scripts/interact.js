const hre = require("hardhat");

// Replace with your deployed contract address
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";

async function main() {
  console.log("🔗 Connecting to FederatedModelRegistry contract...\n");

  // Get the contract
  const FederatedModelRegistry = await hre.ethers.getContractFactory("FederatedModelRegistry");
  const contract = FederatedModelRegistry.attach(CONTRACT_ADDRESS);

  // Get the signer (your MetaMask account)
  const [signer] = await hre.ethers.getSigners();
  console.log("📝 Connected with account:", signer.address);
  console.log("");

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
      console.log("\n📈 Latest Global Model:");
      console.log("   - Version:", latestModel.version.toString());
      console.log("   - IPFS CID:", latestModel.modelWeightsCID);
      console.log("   - Accuracy:", (Number(latestModel.accuracy) / 100).toFixed(2) + "%");
      console.log("   - Total Samples:", latestModel.totalSamples.toString());
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
