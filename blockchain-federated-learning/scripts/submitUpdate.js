const hre = require("hardhat");
const crypto = require("crypto");

// Replace with your deployed contract address
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";

/**
 * Example script to submit a histopathology model update
 * This simulates a hospital submitting their local EfficientNet-B0 training results
 * 
 * Model: EfficientNet-B0 + Coordinate Attention
 * Task: Binary Classification (Benign vs Malignant)
 * Input: 160×160 histopathology images
 */
async function main() {
  console.log("📤 Submitting Histopathology Model Update to FederatedModelRegistry...\n");

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

  // Simulate model update data for EfficientNet-B0 histopathology model
  // In real scenario, these would be actual IPFS CIDs from uploading your model
  const modelCID = "QmExampleHistopathologyModelCID123456789"; // IPFS CID of encrypted model weights
  const sampleCount = 1500; // Number of histopathology samples trained on (no PII)
  const localAccuracy = 9378; // 93.78% accuracy
  const localAUC = 9650; // 0.9650 AUC score
  const localSensitivity = 9400; // 94% sensitivity (malignant detection)
  const localSpecificity = 9300; // 93% specificity (benign detection)
  const trainingDuration = 3600; // 1 hour training time

  // Calculate hash (in real scenario, this would be SHA-256 of your actual .pth file)
  const hash = "0x" + crypto.randomBytes(32).toString("hex");

  console.log("\n📦 Update Details:");
  console.log("   - Model CID:", modelCID);
  console.log("   - Histopathology Samples:", sampleCount);
  console.log("   - Local Accuracy:", (localAccuracy / 100).toFixed(2) + "%");
  console.log("   - Local AUC:", (localAUC / 10000).toFixed(4));
  console.log("   - Local Sensitivity:", (localSensitivity / 10000 * 100).toFixed(2) + "%");
  console.log("   - Local Specificity:", (localSpecificity / 10000 * 100).toFixed(2) + "%");
  console.log("   - Training Duration:", trainingDuration + " seconds");
  console.log("   - Hash:", hash);
  console.log("");

  try {
    console.log("⏳ Submitting transaction...");
    
    const tx = await contract.submitUpdate(
      modelCID,
      hash,
      sampleCount,
      localAccuracy,
      localAUC,
      localSensitivity,
      localSpecificity,
      trainingDuration
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
