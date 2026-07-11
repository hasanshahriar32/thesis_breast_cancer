/**
 * Complete Network Initialization
 * Run after hospitals are already registered.
 * Sets oracle and initializes genesis model.
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const deploymentPath = path.join(__dirname, "../deployment-info.json");
const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

async function main() {
  const [owner] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt(
    "FederatedModelRegistry",
    deploymentInfo.contractAddress,
    owner
  );

  console.log("Contract:", deploymentInfo.contractAddress);
  console.log("Owner:", owner.address);

  // Step 1: Set Oracle
  console.log("\n🔮 Setting oracle address...");
  try {
    const tx = await contract.setOracleAddress(owner.address);
    await tx.wait();
    console.log("✅ Oracle set to:", owner.address);
  } catch (error) {
    console.log("Oracle error:", error.message.slice(0, 100));
  }

  // Step 2: Initialize Genesis Model
  console.log("\n🌟 Initializing genesis model...");
  const modelPath = path.join(__dirname, "../../model/best_histopathology_model.pth");
  const genesisCID = "QmW4CN7kJcKniWTG5byWfCoKuwfsCN2Cti4bYbmNtruzWw";
  let genesisHash;

  if (fs.existsSync(modelPath)) {
    const modelBuffer = fs.readFileSync(modelPath);
    genesisHash = "0x" + crypto.createHash("sha256").update(modelBuffer).digest("hex");
  } else {
    genesisHash = hre.ethers.id("genesis_model_hash");
  }

  try {
    const tx = await contract.initializeGenesisModel(genesisCID, genesisHash);
    await tx.wait();
    console.log("✅ Genesis model initialized");
    console.log("   CID:", genesisCID);
  } catch (error) {
    console.log("Genesis error:", error.message.slice(0, 100));
  }

  // Step 3: Verify
  console.log("\n📊 Network Status:");
  const participants = await contract.getParticipants();
  const modelCount = await contract.getModelCount();
  const currentRound = await contract.currentRound();
  console.log("   Hospitals:", participants.length);
  console.log("   Models:", modelCount.toString());
  console.log("   Round:", currentRound.toString());
  for (const p of participants) {
    const info = await contract.getHospitalInfo(p);
    console.log(`   - ${info.name} (${info.region}): ${p}`);
  }

  // Save updated init info
  const initInfo = {
    network: deploymentInfo.network,
    contractAddress: deploymentInfo.contractAddress,
    genesisCID,
    genesisHash,
    oracleAddress: owner.address,
    hospitals: participants.map((addr, i) => ({
      address: addr,
      name: ["Boston General Hospital", "Royal London Hospital", "Tokyo Medical Center"][i],
      region: ["North America", "Europe", "Asia Pacific"][i]
    })),
    initializedAt: new Date().toISOString()
  };

  const initPath = path.join(__dirname, "../network-init-info.json");
  fs.writeFileSync(initPath, JSON.stringify(initInfo, null, 2));
  console.log("\n💾 Saved to:", initPath);
  console.log("✨ Done!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => { console.error(error); process.exit(1); });
