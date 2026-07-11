const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Test Suite for FederatedModelRegistry - Histopathology Classification
 * 
 * Model: EfficientNet-B0 + Coordinate Attention
 * Task: Binary Classification (Benign vs Malignant)
 * Input: 160×160 histopathology images
 * Framework: PyTorch
 */
describe("FederatedModelRegistry - Histopathology Classification", function () {
  let contract;
  let owner;
  let hospital1;
  let hospital2;
  let hospital3;
  let oracle;
  let nonParticipant;

  const REQUIRED_SUBMISSIONS = 3; // Minimum 3 hospitals
  const MIN_SAMPLES = 500; // Minimum 500 histopathology samples per update

  // Example CIDs and hashes for EfficientNet-B0 model
  const exampleModelCID = "QmExampleHistopathologyModel123";
  const exampleModelHash = ethers.id("histopathology_model_hash");

  beforeEach(async function () {
    // Get signers
    [owner, hospital1, hospital2, hospital3, oracle, nonParticipant] = await ethers.getSigners();

    // Deploy contract
    const FederatedModelRegistry = await ethers.getContractFactory("FederatedModelRegistry");
    contract = await FederatedModelRegistry.deploy(REQUIRED_SUBMISSIONS, MIN_SAMPLES);
    await contract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should set the required submissions", async function () {
      expect(await contract.requiredSubmissions()).to.equal(REQUIRED_SUBMISSIONS);
    });

    it("Should set the minimum samples per update", async function () {
      expect(await contract.minSamplesPerUpdate()).to.equal(MIN_SAMPLES);
    });

    it("Should start at round 0", async function () {
      expect(await contract.currentRound()).to.equal(0);
    });

    it("Should enforce minimum 3 hospitals requirement", async function () {
      const FederatedModelRegistry = await ethers.getContractFactory("FederatedModelRegistry");
      await expect(
        FederatedModelRegistry.deploy(2, MIN_SAMPLES)
      ).to.be.revertedWith("Minimum 3 hospitals required for diversity");
    });

    it("Should enforce minimum 100 samples requirement", async function () {
      const FederatedModelRegistry = await ethers.getContractFactory("FederatedModelRegistry");
      await expect(
        FederatedModelRegistry.deploy(REQUIRED_SUBMISSIONS, 50)
      ).to.be.revertedWith("Minimum 100 samples required per update");
    });
  });

  describe("Hospital Registration", function () {
    it("Should allow owner to register hospitals with metadata", async function () {
      await contract.registerParticipant(hospital1.address, "Boston Medical Center", "North America");
      expect(await contract.isParticipant(hospital1.address)).to.be.true;

      const info = await contract.getHospitalInfo(hospital1.address);
      expect(info.name).to.equal("Boston Medical Center");
      expect(info.region).to.equal("North America");
      expect(info.isActive).to.be.true;
      expect(info.totalContributions).to.equal(0);
    });

    it("Should emit ParticipantRegistered event with details", async function () {
      await expect(contract.registerParticipant(hospital1.address, "Boston Medical", "NA"))
        .to.emit(contract, "ParticipantRegistered")
        .withArgs(hospital1.address, "Boston Medical", "NA");
    });

    it("Should not allow registration without name", async function () {
      await expect(
        contract.registerParticipant(hospital1.address, "", "North America")
      ).to.be.revertedWith("Hospital name required");
    });

    it("Should not allow registration without region", async function () {
      await expect(
        contract.registerParticipant(hospital1.address, "Boston Medical", "")
      ).to.be.revertedWith("Region required");
    });

    it("Should allow owner to update hospital info", async function () {
      await contract.registerParticipant(hospital1.address, "Old Name", "Old Region");
      await contract.updateHospitalInfo(hospital1.address, "New Name", "New Region");

      const info = await contract.getHospitalInfo(hospital1.address);
      expect(info.name).to.equal("New Name");
      expect(info.region).to.equal("New Region");
    });

    it("Should allow owner to deactivate hospitals", async function () {
      await contract.registerParticipant(hospital1.address, "Hospital 1", "Region 1");
      await contract.setHospitalStatus(hospital1.address, false);

      const info = await contract.getHospitalInfo(hospital1.address);
      expect(info.isActive).to.be.false;
    });

    it("Should not allow non-owner to register hospitals", async function () {
      await expect(
        contract.connect(hospital1).registerParticipant(hospital2.address, "Hospital", "Region")
      ).to.be.reverted;
    });
  });

  describe("Model Update Submission", function () {
    beforeEach(async function () {
      // Register hospitals
      await contract.registerParticipant(hospital1.address, "Hospital 1", "Region 1");
      await contract.registerParticipant(hospital2.address, "Hospital 2", "Region 2");
      await contract.registerParticipant(hospital3.address, "Hospital 3", "Region 3");
      await contract.setOracleAddress(oracle.address);
    });

    it("Should allow registered hospital to submit histopathology model update", async function () {
      await contract.connect(hospital1).submitUpdate(
        exampleModelCID,
        exampleModelHash,
        1000,       // samples
        9378,       // 93.78% accuracy
        9650,       // 0.9650 AUC
        9400,       // 94% sensitivity
        9300,       // 93% specificity
        3600        // 1 hour
      );

      const updates = await contract.getUpdatesForRound(0);
      expect(updates.length).to.equal(1);
      expect(updates[0].contributor).to.equal(hospital1.address);
      expect(updates[0].dataSampleCount).to.equal(1000);
      expect(updates[0].localAccuracy).to.equal(9378);
      expect(updates[0].localAUC).to.equal(9650);
      expect(updates[0].localSensitivity).to.equal(9400);
      expect(updates[0].localSpecificity).to.equal(9300);
    });

    it("Should update hospital statistics after submission", async function () {
      await contract.connect(hospital1).submitUpdate(
        exampleModelCID,
        exampleModelHash,
        1000,
        9100,
        9400,
        9200,
        9000,
        3600
      );

      const info = await contract.getHospitalInfo(hospital1.address);
      expect(info.totalContributions).to.equal(1);
      expect(info.totalSamplesContributed).to.equal(1000);
    });

    it("Should emit UpdateSubmitted event with accuracy and AUC", async function () {
      await expect(
        contract.connect(hospital1).submitUpdate(
          exampleModelCID,
          exampleModelHash,
          1000,
          9100,
          9400,
          9200,
          9000,
          3600
        )
      ).to.emit(contract, "UpdateSubmitted")
        .withArgs(hospital1.address, 0, 1000, 9100, 9400);
    });

    it("Should not allow submission with insufficient histopathology samples", async function () {
      await expect(
        contract.connect(hospital1).submitUpdate(
          exampleModelCID,
          exampleModelHash,
          400, // Less than MIN_SAMPLES (500)
          9100,
          9400,
          9200,
          9000,
          3600
        )
      ).to.be.revertedWith("Insufficient histopathology samples");
    });

    it("Should not allow accuracy > 100%", async function () {
      await expect(
        contract.connect(hospital1).submitUpdate(
          exampleModelCID,
          exampleModelHash,
          1000,
          10100, // 101%
          9400,
          9200,
          9000,
          3600
        )
      ).to.be.revertedWith("Accuracy cannot exceed 100%");
    });

    it("Should not allow AUC > 1.0", async function () {
      await expect(
        contract.connect(hospital1).submitUpdate(
          exampleModelCID,
          exampleModelHash,
          1000,
          9100,
          10100, // > 1.0
          9200,
          9000,
          3600
        )
      ).to.be.revertedWith("AUC cannot exceed 1.0");
    });

    it("Should not allow sensitivity > 100%", async function () {
      await expect(
        contract.connect(hospital1).submitUpdate(
          exampleModelCID,
          exampleModelHash,
          1000,
          9100,
          9400,
          10100, // > 100%
          9000,
          3600
        )
      ).to.be.revertedWith("Sensitivity cannot exceed 100%");
    });

    it("Should not allow specificity > 100%", async function () {
      await expect(
        contract.connect(hospital1).submitUpdate(
          exampleModelCID,
          exampleModelHash,
          1000,
          9100,
          9400,
          9200,
          10100, // > 100%
          3600
        )
      ).to.be.revertedWith("Specificity cannot exceed 100%");
    });

    it("Should not allow duplicate submission in same round", async function () {
      await contract.connect(hospital1).submitUpdate(
        exampleModelCID,
        exampleModelHash,
        1000,
        9100,
        9400,
        9200,
        9000,
        3600
      );

      await expect(
        contract.connect(hospital1).submitUpdate(
          exampleModelCID,
          exampleModelHash,
          1000,
          9100,
          9400,
          9200,
          9000,
          3600
        )
      ).to.be.revertedWith("Update already submitted for this round");
    });

    it("Should not allow inactive hospital to submit", async function () {
      await contract.setHospitalStatus(hospital1.address, false);

      await expect(
        contract.connect(hospital1).submitUpdate(
          exampleModelCID,
          exampleModelHash,
          1000,
          9100,
          9400,
          9200,
          9000,
          3600
        )
      ).to.be.revertedWith("Hospital is not active");
    });

    it("Should emit AggregationRequired when threshold met", async function () {
      // Submit from 3 hospitals
      await contract.connect(hospital1).submitUpdate(
        exampleModelCID,
        exampleModelHash,
        1000,
        9100,
        9400,
        9200,
        9000,
        3600
      );

      await contract.connect(hospital2).submitUpdate(
        exampleModelCID,
        exampleModelHash,
        800,
        8900,
        9200,
        9000,
        8800,
        3000
      );

      await expect(
        contract.connect(hospital3).submitUpdate(
          exampleModelCID,
          exampleModelHash,
          1200,
          9300,
          9500,
          9400,
          9200,
          4000
        )
      ).to.emit(contract, "AggregationRequired")
        .withArgs(0, 3);
    });
  });

  describe("Global Model Publication", function () {
    beforeEach(async function () {
      // Setup
      await contract.registerParticipant(hospital1.address, "Hospital 1", "Region 1");
      await contract.registerParticipant(hospital2.address, "Hospital 2", "Region 2");
      await contract.registerParticipant(hospital3.address, "Hospital 3", "Region 3");
      await contract.setOracleAddress(oracle.address);

      // Submit updates from all hospitals
      await contract.connect(hospital1).submitUpdate(
        exampleModelCID,
        exampleModelHash,
        1500,
        9100,
        9400,
        9200,
        9000,
        3600
      );
      await contract.connect(hospital2).submitUpdate(
        exampleModelCID,
        exampleModelHash,
        600,
        8700,
        9100,
        8900,
        8500,
        2400
      );
      await contract.connect(hospital3).submitUpdate(
        exampleModelCID,
        exampleModelHash,
        2000,
        9300,
        9600,
        9500,
        9100,
        5400
      );
    });

    it("Should allow oracle to publish global histopathology model", async function () {
      const globalModelCID = "QmGlobalHistoModel123";
      const globalModelHash = ethers.id("global_histo_hash");

      await contract.connect(oracle).publishNewGlobalModel(
        globalModelCID,
        globalModelHash,
        9250,    // 92.50% accuracy
        9400,    // 0.9400 AUC
        9300,    // 93% sensitivity
        9200     // 92% specificity
      );

      const latestModel = await contract.getLatestGlobalModel();
      expect(latestModel.version).to.equal(1);
      expect(latestModel.modelWeightsCID).to.equal(globalModelCID);
      expect(latestModel.accuracy).to.equal(9250);
      expect(latestModel.aucScore).to.equal(9400);
      expect(latestModel.sensitivity).to.equal(9300);
      expect(latestModel.specificity).to.equal(9200);
      expect(latestModel.totalSamples).to.equal(4100); // 1500 + 600 + 2000
      expect(latestModel.contributorCount).to.equal(3);
    });

    it("Should emit NewGlobalModel event with accuracy and AUC", async function () {
      const globalModelCID = "QmGlobalHistoModel456";
      const globalModelHash = ethers.id("global_histo_hash_2");

      await expect(
        contract.connect(oracle).publishNewGlobalModel(
          globalModelCID,
          globalModelHash,
          9250,
          9400,
          9300,
          9200
        )
      ).to.emit(contract, "NewGlobalModel")
        .withArgs(1, globalModelCID, 9250, 9400, 3);
    });

    it("Should increment round after publication", async function () {
      expect(await contract.currentRound()).to.equal(0);

      await contract.connect(oracle).publishNewGlobalModel(
        "QmModel",
        ethers.id("hash"),
        9250,
        9400,
        9300,
        9200
      );

      expect(await contract.currentRound()).to.equal(1);
    });

    it("Should not allow non-oracle to publish", async function () {
      await expect(
        contract.connect(hospital1).publishNewGlobalModel(
          "QmModel",
          ethers.id("hash"),
          9250,
          9400,
          9300,
          9200
        )
      ).to.be.revertedWith("Only oracle can call this function");
    });
  });

  describe("Weight Metadata for EfficientNet-B0", function () {
    beforeEach(async function () {
      await contract.registerParticipant(hospital1.address, "Hospital 1", "Region 1");
      await contract.registerParticipant(hospital2.address, "Hospital 2", "Region 2");
      await contract.registerParticipant(hospital3.address, "Hospital 3", "Region 3");
      await contract.setOracleAddress(oracle.address);

      // Submit and publish
      await contract.connect(hospital1).submitUpdate(exampleModelCID, exampleModelHash, 1500, 9100, 9400, 9200, 9000, 3600);
      await contract.connect(hospital2).submitUpdate(exampleModelCID, exampleModelHash, 600, 8700, 9100, 8900, 8500, 2400);
      await contract.connect(hospital3).submitUpdate(exampleModelCID, exampleModelHash, 2000, 9300, 9600, 9500, 9100, 5400);

      await contract.connect(oracle).publishNewGlobalModel("QmGlobal", ethers.id("hash"), 9250, 9400, 9300, 9200);
    });

    it("Should store EfficientNet-B0 weight metadata", async function () {
      await contract.connect(oracle).storeWeightMetadata(
        0,                                      // version (first published model)
        5900000,                                // ~5.9M parameters
        21200000,                               // ~21.2MB model size
        160,                                    // 160×160 input size
        "PyTorch",
        "2.0.0",
        "EfficientNet-B0 + CoordinateAttention"
      );

      const metadata = await contract.getWeightMetadata(0);
      expect(metadata.totalParameters).to.equal(5900000);
      expect(metadata.modelSize).to.equal(21200000);
      expect(metadata.inputSize).to.equal(160);
      expect(metadata.framework).to.equal("PyTorch");
      expect(metadata.version).to.equal("2.0.0");
      expect(metadata.architecture).to.equal("EfficientNet-B0 + CoordinateAttention");
    });

    it("Should emit WeightMetadataStored event with architecture", async function () {
      await expect(
        contract.connect(oracle).storeWeightMetadata(
          0,
          5900000,
          21200000,
          160,
          "PyTorch",
          "2.0.0",
          "EfficientNet-B0 + CoordinateAttention"
        )
      ).to.emit(contract, "WeightMetadataStored")
        .withArgs(0, 5900000, "EfficientNet-B0 + CoordinateAttention");
    });
  });

  describe("Genesis Model Initialization", function () {
    it("Should allow owner to initialize genesis histopathology model", async function () {
      const genesisCID = "QmGenesisEfficientNetB0";
      const genesisHash = ethers.id("genesis_histo_hash");

      await contract.initializeGenesisModel(genesisCID, genesisHash);

      const genesis = await contract.getGlobalModelByVersion(0);
      expect(genesis.version).to.equal(0);
      expect(genesis.modelWeightsCID).to.equal(genesisCID);
      expect(genesis.accuracy).to.equal(0);
      expect(genesis.aucScore).to.equal(0);
      expect(genesis.sensitivity).to.equal(0);
      expect(genesis.specificity).to.equal(0);
    });

    it("Should not allow genesis initialization twice", async function () {
      await contract.initializeGenesisModel("QmGenesis", ethers.id("hash"));

      await expect(
        contract.initializeGenesisModel("QmGenesis2", ethers.id("hash2"))
      ).to.be.revertedWith("Genesis model already initialized");
    });

    it("Should not allow empty model CID", async function () {
      await expect(
        contract.initializeGenesisModel("", ethers.id("hash"))
      ).to.be.revertedWith("Empty model CID");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await contract.registerParticipant(hospital1.address, "Boston Medical", "North America");
      await contract.registerParticipant(hospital2.address, "London Trust", "Europe");
      await contract.registerParticipant(hospital3.address, "Tokyo Institute", "Asia");
      await contract.setOracleAddress(oracle.address);

      await contract.connect(hospital1).submitUpdate(exampleModelCID, exampleModelHash, 1500, 9378, 9650, 9400, 9300, 3600);
      await contract.connect(hospital2).submitUpdate(exampleModelCID, exampleModelHash, 800, 9100, 9400, 9200, 9000, 2400);
      await contract.connect(hospital3).submitUpdate(exampleModelCID, exampleModelHash, 2000, 9500, 9750, 9600, 9400, 5400);

      await contract.connect(oracle).publishNewGlobalModel("QmGlobal", ethers.id("hash"), 9350, 9600, 9400, 9233);
    });

    it("Should return correct network statistics", async function () {
      const stats = await contract.getNetworkStatistics();
      expect(stats.totalHospitals).to.equal(3);
      expect(stats.activeHospitals).to.equal(3);
      expect(stats.totalContributions).to.equal(3);
      expect(stats.totalSamples).to.equal(4300); // 1500 + 800 + 2000
      expect(stats.currentRoundNumber).to.equal(1);
      expect(stats.modelsPublished).to.equal(1);
    });

    it("Should return hospital contributions", async function () {
      const contributions = await contract.getHospitalContributions(hospital1.address);
      expect(contributions.length).to.equal(1);
      expect(contributions[0]).to.equal(0);
    });

    it("Should return updates for round", async function () {
      const updates = await contract.getUpdatesForRound(0);
      expect(updates.length).to.equal(3);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set minimum samples", async function () {
      await contract.setMinSamplesPerUpdate(1000);
      expect(await contract.minSamplesPerUpdate()).to.equal(1000);
    });

    it("Should not allow min samples below 100", async function () {
      await expect(
        contract.setMinSamplesPerUpdate(50)
      ).to.be.revertedWith("Minimum 100 samples required");
    });

    it("Should allow owner to pause contract", async function () {
      await contract.pause();
      
      await contract.registerParticipant(hospital1.address, "Hospital 1", "Region 1");
      
      await expect(
        contract.connect(hospital1).submitUpdate(
          exampleModelCID,
          exampleModelHash,
          1000,
          9100,
          9400,
          9200,
          9000,
          3600
        )
      ).to.be.reverted; // Paused
    });
  });
});
