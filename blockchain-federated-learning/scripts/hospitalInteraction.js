const hre = require("hardhat");

/**
 * Enhanced Hospital Interaction Script
 * Demonstrates cross-hospital collaboration and weight management
 */

async function main() {
  console.log("🏥 Hospital Interaction Script - Enhanced Version\n");

  // Get signers (simulating different hospitals)
  const [owner, hospital1, hospital2, hospital3, oracle] = await hre.ethers.getSigners();
  
  console.log("👥 Participants:");
  console.log("   - Owner:", owner.address);
  console.log("   - Hospital 1:", hospital1.address);
  console.log("   - Hospital 2:", hospital2.address);
  console.log("   - Hospital 3:", hospital3.address);
  console.log("   - Oracle:", oracle.address);
  console.log("");

  // Replace with your deployed contract address
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "YOUR_CONTRACT_ADDRESS_HERE";
  
  if (CONTRACT_ADDRESS === "YOUR_CONTRACT_ADDRESS_HERE") {
    console.error("❌ Please set CONTRACT_ADDRESS environment variable");
    console.log("   export CONTRACT_ADDRESS=0x...");
    process.exit(1);
  }

  // Get contract instance
  const FederatedModelRegistry = await hre.ethers.getContractFactory("FederatedModelRegistry");
  const contract = FederatedModelRegistry.attach(CONTRACT_ADDRESS);

  console.log("📋 Connected to contract:", CONTRACT_ADDRESS);
  console.log("");

  // ==========================================
  // STEP 1: Register Hospitals
  // ==========================================
  console.log("🏥 STEP 1: Registering Hospitals...\n");

  try {
    const tx1 = await contract.connect(owner).registerParticipant(
      hospital1.address,
      "Boston Medical Center",
      "North America"
    );
    await tx1.wait();
    console.log("✅ Hospital 1 registered: Boston Medical Center (North America)");

    const tx2 = await contract.connect(owner).registerParticipant(
      hospital2.address,
      "London Healthcare Trust",
      "Europe"
    );
    await tx2.wait();
    console.log("✅ Hospital 2 registered: London Healthcare Trust (Europe)");

    const tx3 = await contract.connect(owner).registerParticipant(
      hospital3.address,
      "Tokyo Cancer Institute",
      "Asia"
    );
    await tx3.wait();
    console.log("✅ Hospital 3 registered: Tokyo Cancer Institute (Asia)");
    console.log("");
  } catch (error) {
    console.log("ℹ️  Hospitals already registered or error:", error.message);
    console.log("");
  }

  // ==========================================
  // STEP 2: Set Oracle
  // ==========================================
  console.log("🔮 STEP 2: Setting Oracle Address...\n");

  try {
    const txOracle = await contract.connect(owner).setOracleAddress(oracle.address);
    await txOracle.wait();
    console.log("✅ Oracle set:", oracle.address);
    console.log("");
  } catch (error) {
    console.log("ℹ️  Oracle already set or error:", error.message);
    console.log("");
  }

  // ==========================================
  // STEP 3: Initialize Genesis Model
  // ==========================================
  console.log("🌟 STEP 3: Initializing Genesis Model...\n");

  try {
    const genesisFusionCID = "QmGenesisModel123ABC"; // Example IPFS CID
    const genesisFusionHash = hre.ethers.id("genesis_fusion_hash"); // Example hash
    const genesisXrayCID = "QmXrayExtractor123";
    const genesisHistoCID = "QmHistoExtractor456";
    const genesisUltraCID = "QmUltraExtractor789";
    const genesisExtractorsHash = hre.ethers.id("genesis_extractors_hash");

    const txGenesis = await contract.connect(owner).initializeGenesisModel(
      genesisFusionCID,
      genesisFusionHash,
      genesisXrayCID,
      genesisHistoCID,
      genesisUltraCID,
      genesisExtractorsHash
    );
    await txGenesis.wait();
    console.log("✅ Genesis model initialized");
    console.log("   - Fusion Model CID:", genesisFusionCID);
    console.log("   - X-Ray Extractor CID:", genesisXrayCID);
    console.log("   - Histo Extractor CID:", genesisHistoCID);
    console.log("   - Ultra Extractor CID:", genesisUltraCID);
    console.log("");
  } catch (error) {
    console.log("ℹ️  Genesis model already initialized or error:", error.message);
    console.log("");
  }

  // ==========================================
  // STEP 4: Submit Hospital Updates (Round 0)
  // ==========================================
  console.log("📤 STEP 4: Hospitals Submit Model Updates...\n");

  // Hospital 1 submits
  try {
    const h1_fusionCID = "QmHospital1Fusion_Round0";
    const h1_fusionHash = hre.ethers.id("h1_fusion_round0");
    const h1_extractorCID = "QmHospital1Extractors_Round0";
    const h1_extractorsHash = hre.ethers.id("h1_extractors_round0");
    const h1_samples = 1500;
    const h1_accuracy = 9100; // 91.00%
    const h1_duration = 3600; // 1 hour

    const tx1 = await contract.connect(hospital1).submitUpdate(
      h1_fusionCID,
      h1_fusionHash,
      h1_extractorCID,
      h1_extractorsHash,
      h1_samples,
      h1_accuracy,
      h1_duration
    );
    await tx1.wait();
    console.log("✅ Hospital 1 (Boston) submitted update:");
    console.log("   - Samples: 1,500");
    console.log("   - Local Accuracy: 91.00%");
    console.log("   - Training Duration: 1 hour");
    console.log("");
  } catch (error) {
    console.log("❌ Hospital 1 submission failed:", error.message);
    console.log("");
  }

  // Hospital 2 submits
  try {
    const h2_fusionCID = "QmHospital2Fusion_Round0";
    const h2_fusionHash = hre.ethers.id("h2_fusion_round0");
    const h2_extractorCID = "QmHospital2Extractors_Round0";
    const h2_extractorsHash = hre.ethers.id("h2_extractors_round0");
    const h2_samples = 600;
    const h2_accuracy = 8700; // 87.00%
    const h2_duration = 2400; // 40 minutes

    const tx2 = await contract.connect(hospital2).submitUpdate(
      h2_fusionCID,
      h2_fusionHash,
      h2_extractorCID,
      h2_extractorsHash,
      h2_samples,
      h2_accuracy,
      h2_duration
    );
    await tx2.wait();
    console.log("✅ Hospital 2 (London) submitted update:");
    console.log("   - Samples: 600");
    console.log("   - Local Accuracy: 87.00%");
    console.log("   - Training Duration: 40 minutes");
    console.log("");
  } catch (error) {
    console.log("❌ Hospital 2 submission failed:", error.message);
    console.log("");
  }

  // Hospital 3 submits
  try {
    const h3_fusionCID = "QmHospital3Fusion_Round0";
    const h3_fusionHash = hre.ethers.id("h3_fusion_round0");
    const h3_extractorCID = "QmHospital3Extractors_Round0";
    const h3_extractorsHash = hre.ethers.id("h3_extractors_round0");
    const h3_samples = 2000;
    const h3_accuracy = 9300; // 93.00%
    const h3_duration = 5400; // 1.5 hours

    const tx3 = await contract.connect(hospital3).submitUpdate(
      h3_fusionCID,
      h3_fusionHash,
      h3_extractorCID,
      h3_extractorsHash,
      h3_samples,
      h3_accuracy,
      h3_duration
    );
    await tx3.wait();
    console.log("✅ Hospital 3 (Tokyo) submitted update:");
    console.log("   - Samples: 2,000");
    console.log("   - Local Accuracy: 93.00%");
    console.log("   - Training Duration: 1.5 hours");
    console.log("");
  } catch (error) {
    console.log("❌ Hospital 3 submission failed:", error.message);
    console.log("");
  }

  // ==========================================
  // STEP 5: Oracle Publishes Aggregated Model
  // ==========================================
  console.log("🔮 STEP 5: Oracle Publishes Aggregated Global Model...\n");

  try {
    const global_fusionCID = "QmGlobalModelV1_Aggregated";
    const global_fusionHash = hre.ethers.id("global_fusion_v1");
    const global_xrayCID = "QmGlobalXray_V1";
    const global_histoCID = "QmGlobalHisto_V1";
    const global_ultraCID = "QmGlobalUltra_V1";
    const global_extractorsHash = hre.ethers.id("global_extractors_v1");
    const global_accuracy = 9250; // 92.50% (weighted average)

    const txPublish = await contract.connect(oracle).publishNewGlobalModel(
      global_fusionCID,
      global_fusionHash,
      global_xrayCID,
      global_histoCID,
      global_ultraCID,
      global_extractorsHash,
      global_accuracy
    );
    await txPublish.wait();
    console.log("✅ Global Model Version 1 published!");
    console.log("   - Total Samples: 4,100 (1,500 + 600 + 2,000)");
    console.log("   - Global Accuracy: 92.50%");
    console.log("   - Contributors: 3 hospitals");
    console.log("   - Fusion Model CID:", global_fusionCID);
    console.log("");
  } catch (error) {
    console.log("❌ Global model publication failed:", error.message);
    console.log("");
  }

  // ==========================================
  // STEP 6: Store Weight Metadata
  // ==========================================
  console.log("📊 STEP 6: Storing Weight Metadata...\n");

  try {
    const txMeta = await contract.connect(oracle).storeWeightMetadata(
      1, // version
      14100000, // ~14.1M parameters
      8400000, // ~8.4MB fusion model
      48000000, // ~48MB extractors (3 × 16MB each)
      "TensorFlow",
      "2.15.0"
    );
    await txMeta.wait();
    console.log("✅ Weight metadata stored for Version 1");
    console.log("   - Total Parameters: 14.1M");
    console.log("   - Fusion Model Size: 8.4 MB");
    console.log("   - Extractors Size: 48 MB");
    console.log("   - Framework: TensorFlow 2.15.0");
    console.log("");
  } catch (error) {
    console.log("❌ Metadata storage failed:", error.message);
    console.log("");
  }

  // ==========================================
  // STEP 7: Query Contract State
  // ==========================================
  console.log("📊 STEP 7: Querying Contract State...\n");

  try {
    // Get latest model
    const latestModel = await contract.getLatestGlobalModel();
    console.log("📈 Latest Global Model:");
    console.log("   - Version:", latestModel.version.toString());
    console.log("   - Accuracy:", (Number(latestModel.accuracy) / 100).toFixed(2) + "%");
    console.log("   - Total Samples:", latestModel.totalSamples.toString());
    console.log("   - Contributors:", latestModel.contributorCount.toString());
    console.log("   - Fusion CID:", latestModel.fusionModelCID);
    console.log("");

    // Get network statistics
    const stats = await contract.getNetworkStatistics();
    console.log("🌐 Network Statistics:");
    console.log("   - Total Hospitals:", stats.totalHospitals.toString());
    console.log("   - Active Hospitals:", stats.activeHospitals.toString());
    console.log("   - Total Contributions:", stats.totalContributions.toString());
    console.log("   - Total Samples:", stats.totalSamples.toString());
    console.log("   - Current Round:", stats.currentRoundNumber.toString());
    console.log("   - Models Published:", stats.modelsPublished.toString());
    console.log("");

    // Get hospital info
    const h1Info = await contract.getHospitalInfo(hospital1.address);
    console.log("🏥 Hospital 1 (Boston Medical Center):");
    console.log("   - Name:", h1Info.name);
    console.log("   - Region:", h1Info.region);
    console.log("   - Total Contributions:", h1Info.totalContributions.toString());
    console.log("   - Total Samples:", h1Info.totalSamplesContributed.toString());
    console.log("   - Active:", h1Info.isActive);
    console.log("");

    // Get weight metadata
    const metadata = await contract.getWeightMetadata(1);
    console.log("⚙️  Model V1 Weight Metadata:");
    console.log("   - Total Parameters:", metadata.totalParameters.toString());
    console.log("   - Fusion Size:", metadata.fusionModelSize.toString(), "bytes");
    console.log("   - Extractors Size:", metadata.extractorTotalSize.toString(), "bytes");
    console.log("   - Framework:", metadata.framework, metadata.version);
    console.log("");

  } catch (error) {
    console.log("❌ Query failed:", error.message);
    console.log("");
  }

  console.log("✅ Hospital interaction script completed!");
  console.log("\n🎉 Multi-hospital federated learning cycle demonstrated!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
