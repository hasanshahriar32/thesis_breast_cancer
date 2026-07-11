/**
 * Network Initialization Script
 * 
 * This script:
 * 1. Uploads genesis model to IPFS (Pinata)
 * 2. Registers 3 hospital participants
 * 3. Sets oracle address
 * 4. Initializes genesis model on-chain
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const FormData = require("form-data");

// Load deployment info
const deploymentPath = path.join(__dirname, "../deployment-info.json");
const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

// Hospital configurations (simulated for testing)
const HOSPITALS = [
  {
    name: "Boston General Hospital",
    region: "North America",
    // Using derived addresses for demo - in production each hospital has their own wallet
  },
  {
    name: "Royal London Hospital", 
    region: "Europe",
  },
  {
    name: "Tokyo Medical Center",
    region: "Asia Pacific",
  }
];

async function uploadToIPFS(filePath) {
  console.log(`\n📤 Uploading to IPFS: ${filePath}`);
  
  const pinataJWT = process.env.PINATA_JWT;
  
  if (!pinataJWT) {
    console.log("⚠️  No Pinata JWT found, using mock CID");
    const mockCID = "Qm" + crypto.randomBytes(22).toString("hex");
    return mockCID;
  }
  
  try {
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));
    
    const metadata = JSON.stringify({
      name: "EfficientNet-B0 Histopathology Model",
      keyvalues: {
        type: "genesis_model",
        architecture: "EfficientNet-B0 + CoordinateAttention",
        task: "histopathology_classification"
      }
    });
    formData.append("pinataMetadata", metadata);
    
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        maxBodyLength: Infinity,
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${pinataJWT}`
        }
      }
    );
    
    console.log(`✅ Uploaded to IPFS: ${response.data.IpfsHash}`);
    return response.data.IpfsHash;
    
  } catch (error) {
    console.error("❌ IPFS upload failed:", error.message);
    const mockCID = "Qm" + crypto.randomBytes(22).toString("hex");
    console.log(`⚠️  Using mock CID: ${mockCID}`);
    return mockCID;
  }
}

async function main() {
  console.log("🚀 Federated Learning Network Initialization\n");
  console.log("Contract:", deploymentInfo.contractAddress);
  console.log("Network:", deploymentInfo.network);
  console.log("");
  
  // Get signers
  const [owner] = await hre.ethers.getSigners();
  console.log("Owner address:", owner.address);
  
  // Get contract instance
  const contract = await hre.ethers.getContractAt(
    "FederatedModelRegistry",
    deploymentInfo.contractAddress,
    owner
  );
  
  // ========================================
  // Step 1: Upload Genesis Model to IPFS
  // ========================================
  console.log("\n" + "=".repeat(50));
  console.log("Step 1: Upload Genesis Model to IPFS");
  console.log("=".repeat(50));
  
  const modelPath = path.join(__dirname, "../../model/best_histopathology_model.pth");
  
  let genesisCID;
  let genesisHash;
  
  if (fs.existsSync(modelPath)) {
    // Upload actual model
    genesisCID = await uploadToIPFS(modelPath);
    
    // Calculate hash
    const modelBuffer = fs.readFileSync(modelPath);
    genesisHash = "0x" + crypto.createHash("sha256").update(modelBuffer).digest("hex");
    console.log(`Model hash: ${genesisHash}`);
  } else {
    console.log("⚠️  Model file not found, using mock values");
    genesisCID = "QmGenesisEfficientNetB0HistopathologyModel";
    genesisHash = hre.ethers.id("genesis_model_hash");
  }
  
  // ========================================
  // Step 2: Register Hospital Participants
  // ========================================
  console.log("\n" + "=".repeat(50));
  console.log("Step 2: Register Hospital Participants");
  console.log("=".repeat(50));
  
  // Generate deterministic addresses for demo hospitals
  // In production, each hospital would provide their own address
  const hospitalAddresses = [];
  
  for (let i = 0; i < HOSPITALS.length; i++) {
    const hospital = HOSPITALS[i];
    
    // Generate a deterministic address for demo
    const hospitalWallet = hre.ethers.Wallet.createRandom();
    hospitalAddresses.push(hospitalWallet.address);
    
    console.log(`\nRegistering: ${hospital.name}`);
    console.log(`  Region: ${hospital.region}`);
    console.log(`  Address: ${hospitalWallet.address}`);
    
    try {
      const tx = await contract.registerParticipant(
        hospitalWallet.address,
        hospital.name,
        hospital.region
      );
      await tx.wait();
      console.log(`  ✅ Registered (tx: ${tx.hash.slice(0, 18)}...)`);
    } catch (error) {
      if (error.message.includes("already registered")) {
        console.log(`  ⚠️  Already registered`);
      } else {
        console.log(`  ❌ Failed: ${error.message}`);
      }
    }
  }
  
  // ========================================
  // Step 3: Set Oracle Address
  // ========================================
  console.log("\n" + "=".repeat(50));
  console.log("Step 3: Set Oracle Address");
  console.log("=".repeat(50));
  
  // Use owner as oracle for now
  console.log(`Setting oracle to: ${owner.address}`);
  
  try {
    const tx = await contract.setOracleAddress(owner.address);
    await tx.wait();
    console.log(`✅ Oracle set (tx: ${tx.hash.slice(0, 18)}...)`);
  } catch (error) {
    if (error.message.includes("already set")) {
      console.log("⚠️  Oracle already set");
    } else {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
  
  // ========================================
  // Step 4: Initialize Genesis Model
  // ========================================
  console.log("\n" + "=".repeat(50));
  console.log("Step 4: Initialize Genesis Model");
  console.log("=".repeat(50));
  
  console.log(`Genesis CID: ${genesisCID}`);
  console.log(`Genesis Hash: ${genesisHash.slice(0, 18)}...`);
  
  try {
    const tx = await contract.initializeGenesisModel(genesisCID, genesisHash);
    await tx.wait();
    console.log(`✅ Genesis model initialized (tx: ${tx.hash.slice(0, 18)}...)`);
  } catch (error) {
    if (error.message.includes("already initialized")) {
      console.log("⚠️  Genesis model already initialized");
    } else {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
  
  // ========================================
  // Summary
  // ========================================
  console.log("\n" + "=".repeat(50));
  console.log("Network Initialization Summary");
  console.log("=".repeat(50));
  
  try {
    const participants = await contract.getParticipants();
    const modelCount = await contract.getModelCount();
    const currentRound = await contract.currentRound();
    
    console.log(`\n📊 Network Status:`);
    console.log(`   Registered Hospitals: ${participants.length}`);
    console.log(`   Published Models: ${modelCount}`);
    console.log(`   Current Round: ${currentRound}`);
    console.log(`   Genesis CID: ${genesisCID}`);
    
    console.log(`\n📋 Registered Hospitals:`);
    for (let i = 0; i < Math.min(participants.length, 3); i++) {
      console.log(`   ${i + 1}. ${participants[i]}`);
    }
    
  } catch (error) {
    console.log("Failed to fetch summary:", error.message);
  }
  
  // Save initialization info
  const initInfo = {
    network: deploymentInfo.network,
    contractAddress: deploymentInfo.contractAddress,
    genesisCID: genesisCID,
    genesisHash: genesisHash,
    oracleAddress: owner.address,
    hospitals: hospitalAddresses.map((addr, i) => ({
      address: addr,
      name: HOSPITALS[i].name,
      region: HOSPITALS[i].region
    })),
    initializedAt: new Date().toISOString()
  };
  
  const initPath = path.join(__dirname, "../network-init-info.json");
  fs.writeFileSync(initPath, JSON.stringify(initInfo, null, 2));
  console.log(`\n💾 Saved initialization info to: ${initPath}`);
  
  console.log("\n✨ Network initialization complete!");
  console.log("\nNext steps:");
  console.log("1. Run hospital-backend to process test images");
  console.log("2. Submit model updates from each hospital");
  console.log("3. Aggregate updates and publish new global model");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
