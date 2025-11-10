const hre = require("hardhat");
const crypto = require("crypto");

// Replace with your deployed contract address
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";

/**
 * Example script to submit a model update
 * This simulates a hospital submitting their local training results
 */
async function main() {
  console.log("📤 Submitting Model Update to FederatedModelRegistry...\n");

  // Get the contract
  const FederatedModelRegistry = await hre.ethers.getContractFactory("FederatedModelRegistry");
  const contract = FederatedModelRegistry.attach(CONTRACT_ADDRESS);

  // Get the signer (your MetaMask account)
  const [signer] = await hre.ethers.getSigners();
  console.log("📝 Submitting from account:", signer.address);

  // Check if you're registered
  const isParticipant = await contract.isParticipant(signer.address);
  if (!isParticipant) {
    console.error("❌ Error: You are not a registered participant!");
    console.log("   Ask the contract owner to register your address first.");
    return;
  }

  // Check if already submitted for current round
  const hasSubmitted = await contract.hasSubmittedCurrentRound(signer.address);
  if (hasSubmitted) {
    console.error("❌ Error: You have already submitted for this round!");
    return;
  }

  // Simulate model update data
  // In real scenario, these would be actual IPFS CIDs from uploading your model
  const encryptedUpdateCID = "QmExampleFusionModelCID123456789"; // IPFS CID of encrypted fusion model
  const extractorCID = "QmExampleExtractorsCID987654321"; // IPFS CID of extractors
  const sampleCount = 500; // Number of patient samples you trained on (no PII)

  // Calculate hash (in real scenario, this would be SHA-256 of your actual model file)
  const hash = "0x" + crypto.randomBytes(32).toString("hex");

  console.log("\n📦 Update Details:");
  console.log("   - Encrypted Update CID:", encryptedUpdateCID);
  console.log("   - Extractor Weights CID:", extractorCID);
  console.log("   - Sample Count:", sampleCount);
  console.log("   - Hash:", hash);
  console.log("");

  try {
    console.log("⏳ Submitting transaction...");
    
    const tx = await contract.submitUpdate(
      encryptedUpdateCID,
      hash,
      sampleCount,
      extractorCID
    );

    console.log("📡 Transaction sent:", tx.hash);
    console.log("⏳ Waiting for confirmation...");

    const receipt = await tx.wait();
    
    console.log("✅ Update submitted successfully!");
    console.log("   - Block Number:", receipt.blockNumber);
    console.log("   - Gas Used:", receipt.gasUsed.toString());

    // Check current round status
    const currentRound = await contract.currentRound();
    const submissions = await contract.getCurrentRoundSubmissions();
    const requiredSubmissions = await contract.requiredSubmissions();

    console.log("\n📊 Current Round Status:");
    console.log("   - Round:", currentRound.toString());
    console.log("   - Submissions:", submissions.toString() + "/" + requiredSubmissions.toString());

    if (submissions >= requiredSubmissions) {
      console.log("\n🎉 Threshold reached! Aggregation can now be triggered by the oracle.");
    }

  } catch (error) {
    console.error("❌ Error submitting update:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
