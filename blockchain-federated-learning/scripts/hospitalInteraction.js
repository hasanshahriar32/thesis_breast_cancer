const hre = require("hardhat");

/**
 * Hospital Interaction Script for Histopathology Classification
 * 
 * Model: EfficientNet-B0 + Coordinate Attention
 * Task: Binary Classification (Benign vs Malignant)
 * Input: 160×160 histopathology images
 * Framework: PyTorch
 */

async function main() {
  console.log("🏥 Hospital Interaction Script - Histopathology Classification\n");
  console.log("🧬 Model: EfficientNet-B0 + Coordinate Attention");
  console.log("📊 Task: Binary Classification (Benign vs Malignant)\n");

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
  console.log("🌟 STEP 3: Initializing Genesis Histopathology Model...\n");

  try {
    const genesisModelCID = "QmGenesisEfficientNetB0_HistoModel"; // Pre-trained EfficientNet-B0
    const genesisModelHash = hre.ethers.id("genesis_histopathology_model_hash");

    const txGenesis = await contract.connect(owner).initializeGenesisModel(
      genesisModelCID,
      genesisModelHash
    );
    await txGenesis.wait();
    console.log("✅ Genesis histopathology model initialized");
    console.log("   - Model CID:", genesisModelCID);
    console.log("   - Architecture: EfficientNet-B0 + CoordinateAttention");
    console.log("   - Input Size: 160×160 RGB");
    console.log("");
  } catch (error) {
    console.log("ℹ️  Genesis model already initialized or error:", error.message);
    console.log("");
  }

  // ==========================================
  // STEP 4: Submit Hospital Updates (Round 0)
  // ==========================================
  console.log("📤 STEP 4: Hospitals Submit Histopathology Model Updates...\n");

  // Hospital 1 submits (Boston - BreaKHis dataset)
  try {
    const h1_modelCID = "QmHospital1_HistoModel_Round0";
    const h1_modelHash = hre.ethers.id("h1_histo_model_round0");
    const h1_samples = 1500;      // Histopathology samples
    const h1_accuracy = 9378;     // 93.78%
    const h1_auc = 9650;          // 0.9650
    const h1_sensitivity = 9400;  // 94% (malignant detection)
    const h1_specificity = 9300;  // 93% (benign detection)
    const h1_duration = 3600;     // 1 hour

    const tx1 = await contract.connect(hospital1).submitUpdate(
      h1_modelCID,
      h1_modelHash,
      h1_samples,
      h1_accuracy,
      h1_auc,
      h1_sensitivity,
      h1_specificity,
      h1_duration
    );
    await tx1.wait();
    console.log("✅ Hospital 1 (Boston) submitted update:");
    console.log("   - Histopathology Samples: 1,500");
    console.log("   - Local Accuracy: 93.78%");
    console.log("   - Local AUC: 0.9650");
    console.log("   - Sensitivity: 94%");
    console.log("   - Specificity: 93%");
    console.log("   - Training Duration: 1 hour");
    console.log("");
  } catch (error) {
    console.log("❌ Hospital 1 submission failed:", error.message);
    console.log("");
  }

  // Hospital 2 submits (London - Breast Cancer dataset)
  try {
    const h2_modelCID = "QmHospital2_HistoModel_Round0";
    const h2_modelHash = hre.ethers.id("h2_histo_model_round0");
    const h2_samples = 800;       // Histopathology samples
    const h2_accuracy = 9100;     // 91.00%
    const h2_auc = 9400;          // 0.9400
    const h2_sensitivity = 9200;  // 92% (malignant detection)
    const h2_specificity = 9000;  // 90% (benign detection)
    const h2_duration = 2400;     // 40 minutes

    const tx2 = await contract.connect(hospital2).submitUpdate(
      h2_modelCID,
      h2_modelHash,
      h2_samples,
      h2_accuracy,
      h2_auc,
      h2_sensitivity,
      h2_specificity,
      h2_duration
    );
    await tx2.wait();
    console.log("✅ Hospital 2 (London) submitted update:");
    console.log("   - Histopathology Samples: 800");
    console.log("   - Local Accuracy: 91.00%");
    console.log("   - Local AUC: 0.9400");
    console.log("   - Sensitivity: 92%");
    console.log("   - Specificity: 90%");
    console.log("   - Training Duration: 40 minutes");
    console.log("");
  } catch (error) {
    console.log("❌ Hospital 2 submission failed:", error.message);
    console.log("");
  }

  // Hospital 3 submits (Tokyo - Histopathological MSI dataset)
  try {
    const h3_modelCID = "QmHospital3_HistoModel_Round0";
    const h3_modelHash = hre.ethers.id("h3_histo_model_round0");
    const h3_samples = 2000;      // Histopathology samples
    const h3_accuracy = 9500;     // 95.00%
    const h3_auc = 9750;          // 0.9750
    const h3_sensitivity = 9600;  // 96% (malignant detection)
    const h3_specificity = 9400;  // 94% (benign detection)
    const h3_duration = 5400;     // 1.5 hours

    const tx3 = await contract.connect(hospital3).submitUpdate(
      h3_modelCID,
      h3_modelHash,
      h3_samples,
      h3_accuracy,
      h3_auc,
      h3_sensitivity,
      h3_specificity,
      h3_duration
    );
    await tx3.wait();
    console.log("✅ Hospital 3 (Tokyo) submitted update:");
    console.log("   - Histopathology Samples: 2,000");
    console.log("   - Local Accuracy: 95.00%");
    console.log("   - Local AUC: 0.9750");
    console.log("   - Sensitivity: 96%");
    console.log("   - Specificity: 94%");
    console.log("   - Training Duration: 1.5 hours");
    console.log("");
  } catch (error) {
    console.log("❌ Hospital 3 submission failed:", error.message);
    console.log("");
  }

  // ==========================================
  // STEP 5: Oracle Publishes Aggregated Model
  // ==========================================
  console.log("🔮 STEP 5: Oracle Publishes Aggregated Global Histopathology Model...\n");

  try {
    const global_modelCID = "QmGlobalHistoModelV1_Aggregated";
    const global_modelHash = hre.ethers.id("global_histo_v1");
    const global_accuracy = 9350;    // 93.50% (weighted average)
    const global_auc = 9600;         // 0.9600
    const global_sensitivity = 9400; // 94%
    const global_specificity = 9233; // 92.33%

    const txPublish = await contract.connect(oracle).publishNewGlobalModel(
      global_modelCID,
      global_modelHash,
      global_accuracy,
      global_auc,
      global_sensitivity,
      global_specificity
    );
    await txPublish.wait();
    console.log("✅ Global Histopathology Model Version 1 published!");
    console.log("   - Total Samples: 4,300 (1,500 + 800 + 2,000)");
    console.log("   - Global Accuracy: 93.50%");
    console.log("   - Global AUC: 0.9600");
    console.log("   - Global Sensitivity: 94%");
    console.log("   - Global Specificity: 92.33%");
    console.log("   - Contributors: 3 hospitals");
    console.log("   - Model CID:", global_modelCID);
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
      1,                                    // version
      5900000,                              // ~5.9M parameters (EfficientNet-B0)
      21200000,                             // ~21.2MB model file
      160,                                  // 160x160 input size
      "PyTorch",
      "2.0.0",
      "EfficientNet-B0 + CoordinateAttention"
    );
    await txMeta.wait();
    console.log("✅ Weight metadata stored for Version 1");
    console.log("   - Total Parameters: 5.9M");
    console.log("   - Model Size: 21.2 MB");
    console.log("   - Input Size: 160×160");
    console.log("   - Framework: PyTorch 2.0.0");
    console.log("   - Architecture: EfficientNet-B0 + CoordinateAttention");
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
    console.log("📈 Latest Global Histopathology Model:");
    console.log("   - Version:", latestModel.version.toString());
    console.log("   - Accuracy:", (Number(latestModel.accuracy) / 100).toFixed(2) + "%");
    console.log("   - AUC Score:", (Number(latestModel.aucScore) / 10000).toFixed(4));
    console.log("   - Sensitivity:", (Number(latestModel.sensitivity) / 10000 * 100).toFixed(2) + "%");
    console.log("   - Specificity:", (Number(latestModel.specificity) / 10000 * 100).toFixed(2) + "%");
    console.log("   - Total Samples:", latestModel.totalSamples.toString());
    console.log("   - Contributors:", latestModel.contributorCount.toString());
    console.log("   - Model CID:", latestModel.modelWeightsCID);
    console.log("");

    // Get network statistics
    const stats = await contract.getNetworkStatistics();
    console.log("🌐 Network Statistics:");
    console.log("   - Total Hospitals:", stats.totalHospitals.toString());
    console.log("   - Active Hospitals:", stats.activeHospitals.toString());
    console.log("   - Total Contributions:", stats.totalContributions.toString());
    console.log("   - Total Histopathology Samples:", stats.totalSamples.toString());
    console.log("   - Current Round:", stats.currentRoundNumber.toString());
    console.log("   - Models Published:", stats.modelsPublished.toString());
    console.log("");

    // Get weight metadata
    const metadata = await contract.getWeightMetadata(1);
    console.log("🔧 Model Metadata (Version 1):");
    console.log("   - Total Parameters:", metadata.totalParameters.toString());
    console.log("   - Model Size:", metadata.modelSize.toString(), "bytes");
    console.log("   - Input Size:", metadata.inputSize.toString(), "×", metadata.inputSize.toString());
    console.log("   - Framework:", metadata.framework, metadata.version);
    console.log("   - Architecture:", metadata.architecture);
    console.log("");

    // Get hospital info
    console.log("🏥 Hospital Details:");
    
    const h1Info = await contract.getHospitalInfo(hospital1.address);
    console.log("   Hospital 1 (Boston):");
    console.log("      - Name:", h1Info.name);
    console.log("      - Region:", h1Info.region);
    console.log("      - Total Contributions:", h1Info.totalContributions.toString());
    console.log("      - Total Samples:", h1Info.totalSamplesContributed.toString());

    const h2Info = await contract.getHospitalInfo(hospital2.address);
    console.log("   Hospital 2 (London):");
    console.log("      - Name:", h2Info.name);
    console.log("      - Region:", h2Info.region);
    console.log("      - Total Contributions:", h2Info.totalContributions.toString());
    console.log("      - Total Samples:", h2Info.totalSamplesContributed.toString());

    const h3Info = await contract.getHospitalInfo(hospital3.address);
    console.log("   Hospital 3 (Tokyo):");
    console.log("      - Name:", h3Info.name);
    console.log("      - Region:", h3Info.region);
    console.log("      - Total Contributions:", h3Info.totalContributions.toString());
    console.log("      - Total Samples:", h3Info.totalSamplesContributed.toString());
    console.log("");

  } catch (error) {
    console.log("❌ Query failed:", error.message);
    console.log("");
  }

  console.log("✅ Hospital interaction demo completed!");
  console.log("🧬 Federated learning for histopathology breast cancer classification ready!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
