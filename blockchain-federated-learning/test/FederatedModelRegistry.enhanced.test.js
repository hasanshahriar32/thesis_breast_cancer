const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FederatedModelRegistry - Enhanced Version", function () {
  let contract;
  let owner;
  let hospital1;
  let hospital2;
  let hospital3;
  let oracle;
  let nonParticipant;

  const REQUIRED_SUBMISSIONS = 3; // Minimum 3 hospitals
  const MIN_SAMPLES = 500; // Minimum 500 samples per update

  // Example CIDs and hashes
  const exampleFusionCID = "QmExampleFusion123";
  const exampleFusionHash = ethers.id("fusion_hash");
  const exampleExtractorCID = "QmExampleExtractors456";
  const exampleExtractorsHash = ethers.id("extractors_hash");
  const exampleXrayCID = "QmXray123";
  const exampleHistoCID = "QmHisto456";
  const exampleUltraCID = "QmUltra789";

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

    it("Should allow registered hospital to submit update", async function () {
      await contract.connect(hospital1).submitUpdate(
        exampleFusionCID,
        exampleFusionHash,
        exampleExtractorCID,
        exampleExtractorsHash,
        1000,
        9100, // 91%
        3600
      );

      const updates = await contract.getUpdatesForRound(0);
      expect(updates.length).to.equal(1);
      expect(updates[0].contributor).to.equal(hospital1.address);
      expect(updates[0].dataSampleCount).to.equal(1000);
      expect(updates[0].localAccuracy).to.equal(9100);
    });

    it("Should update hospital statistics after submission", async function () {
      await contract.connect(hospital1).submitUpdate(
        exampleFusionCID,
        exampleFusionHash,
        exampleExtractorCID,
        exampleExtractorsHash,
        1000,
        9100,
        3600
      );

      const info = await contract.getHospitalInfo(hospital1.address);
      expect(info.totalContributions).to.equal(1);
      expect(info.totalSamplesContributed).to.equal(1000);
    });

    it("Should emit UpdateSubmitted event with accuracy", async function () {
      await expect(
        contract.connect(hospital1).submitUpdate(
          exampleFusionCID,
          exampleFusionHash,
          exampleExtractorCID,
          exampleExtractorsHash,
          1000,
          9100,
          3600
        )
      ).to.emit(contract, "UpdateSubmitted")
        .withArgs(hospital1.address, 0, 1000, 9100);
    });

    it("Should not allow submission with insufficient samples", async function () {
      await expect(
        contract.connect(hospital1).submitUpdate(
          exampleFusionCID,
          exampleFusionHash,
          exampleExtractorCID,
          exampleExtractorsHash,
          400, // Less than MIN_SAMPLES (500)
          9100,
          3600
        )
      ).to.be.revertedWith("Insufficient samples");
    });

    it("Should not allow accuracy > 100%", async function () {
      await expect(
        contract.connect(hospital1).submitUpdate(
          exampleFusionCID,
          exampleFusionHash,
          exampleExtractorCID,
          exampleExtractorsHash,
          1000,
          10100, // 101%
          3600
        )
      ).to.be.revertedWith("Accuracy cannot exceed 100%");
    });

    it("Should not allow duplicate submission in same round", async function () {
      await contract.connect(hospital1).submitUpdate(
        exampleFusionCID,
        exampleFusionHash,
        exampleExtractorCID,
        exampleExtractorsHash,
        1000,
        9100,
        3600
      );

      await expect(
        contract.connect(hospital1).submitUpdate(
          exampleFusionCID,
          exampleFusionHash,
          exampleExtractorCID,
          exampleExtractorsHash,
          1000,
          9100,
          3600
        )
      ).to.be.revertedWith("Update already submitted for this round");
    });

    it("Should not allow inactive hospital to submit", async function () {
      await contract.setHospitalStatus(hospital1.address, false);

      await expect(
        contract.connect(hospital1).submitUpdate(
          exampleFusionCID,
          exampleFusionHash,
          exampleExtractorCID,
          exampleExtractorsHash,
          1000,
          9100,
          3600
        )
      ).to.be.revertedWith("Hospital is not active");
    });

    it("Should emit AggregationRequired when threshold met", async function () {
      // Submit from 3 hospitals
      await contract.connect(hospital1).submitUpdate(
        exampleFusionCID,
        exampleFusionHash,
        exampleExtractorCID,
        exampleExtractorsHash,
        1000,
        9100,
        3600
      );

      await contract.connect(hospital2).submitUpdate(
        exampleFusionCID,
        exampleFusionHash,
        exampleExtractorCID,
        exampleExtractorsHash,
        800,
        8900,
        3000
      );

      await expect(
        contract.connect(hospital3).submitUpdate(
          exampleFusionCID,
          exampleFusionHash,
          exampleExtractorCID,
          exampleExtractorsHash,
          1200,
          9300,
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
        exampleFusionCID,
        exampleFusionHash,
        exampleExtractorCID,
        exampleExtractorsHash,
        1500,
        9100,
        3600
      );

      await contract.connect(hospital2).submitUpdate(
        exampleFusionCID,
        exampleFusionHash,
        exampleExtractorCID,
        exampleExtractorsHash,
        600,
        8700,
        2400
      );

      await contract.connect(hospital3).submitUpdate(
        exampleFusionCID,
        exampleFusionHash,
        exampleExtractorCID,
        exampleExtractorsHash,
        2000,
        9300,
        5400
      );
    });

    it("Should allow oracle to publish global model", async function () {
      await contract.connect(oracle).publishNewGlobalModel(
        "QmGlobalFusion",
        exampleFusionHash,
        exampleXrayCID,
        exampleHistoCID,
        exampleUltraCID,
        exampleExtractorsHash,
        9250
      );

      const model = await contract.getLatestGlobalModel();
      expect(model.version).to.equal(1);
      expect(model.fusionModelCID).to.equal("QmGlobalFusion");
      expect(model.totalSamples).to.equal(4100); // 1500 + 600 + 2000
      expect(model.accuracy).to.equal(9250);
      expect(model.contributorCount).to.equal(3);
    });

    it("Should increment round after publication", async function () {
      const roundBefore = await contract.currentRound();

      await contract.connect(oracle).publishNewGlobalModel(
        "QmGlobalFusion",
        exampleFusionHash,
        exampleXrayCID,
        exampleHistoCID,
        exampleUltraCID,
        exampleExtractorsHash,
        9250
      );

      const roundAfter = await contract.currentRound();
      expect(roundAfter).to.equal(roundBefore + BigInt(1));
    });

    it("Should track model lineage", async function () {
      // Publish first global model
      await contract.connect(oracle).publishNewGlobalModel(
        "QmGlobalFusion",
        exampleFusionHash,
        exampleXrayCID,
        exampleHistoCID,
        exampleUltraCID,
        exampleExtractorsHash,
        9250
      );

      const model = await contract.getLatestGlobalModel();
      expect(model.parentVersion).to.equal(0); // Genesis is parent
    });

    it("Should not allow non-oracle to publish", async function () {
      await expect(
        contract.connect(hospital1).publishNewGlobalModel(
          "QmGlobalFusion",
          exampleFusionHash,
          exampleXrayCID,
          exampleHistoCID,
          exampleUltraCID,
          exampleExtractorsHash,
          9250
        )
      ).to.be.revertedWith("Only oracle can call this function");
    });
  });

  describe("Weight Metadata", function () {
    beforeEach(async function () {
      await contract.setOracleAddress(oracle.address);
      await contract.initializeGenesisModel(
        exampleFusionCID,
        exampleFusionHash,
        exampleXrayCID,
        exampleHistoCID,
        exampleUltraCID,
        exampleExtractorsHash
      );
    });

    it("Should allow oracle to store weight metadata", async function () {
      await contract.connect(oracle).storeWeightMetadata(
        0, // genesis version
        14100000,
        8400000,
        48000000,
        "TensorFlow",
        "2.15.0"
      );

      const metadata = await contract.getWeightMetadata(0);
      expect(metadata.totalParameters).to.equal(14100000);
      expect(metadata.fusionModelSize).to.equal(8400000);
      expect(metadata.extractorTotalSize).to.equal(48000000);
      expect(metadata.framework).to.equal("TensorFlow");
      expect(metadata.version).to.equal("2.15.0");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await contract.registerParticipant(hospital1.address, "Hospital 1", "Region 1");
      await contract.registerParticipant(hospital2.address, "Hospital 2", "Region 2");
    });

    it("Should return network statistics", async function () {
      const stats = await contract.getNetworkStatistics();
      expect(stats.totalHospitals).to.equal(2);
      expect(stats.activeHospitals).to.equal(2);
      expect(stats.currentRoundNumber).to.equal(0);
    });

    it("Should return hospital contributions", async function () {
      await contract.setOracleAddress(oracle.address);
      await contract.registerParticipant(hospital3.address, "Hospital 3", "Region 3");

      // Submit updates
      await contract.connect(hospital1).submitUpdate(
        exampleFusionCID,
        exampleFusionHash,
        exampleExtractorCID,
        exampleExtractorsHash,
        1000,
        9100,
        3600
      );

      const contributions = await contract.getHospitalContributions(hospital1.address);
      expect(contributions.length).to.equal(1);
      expect(contributions[0]).to.equal(0); // Round 0
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update minimum samples", async function () {
      await contract.setMinSamplesPerUpdate(1000);
      expect(await contract.minSamplesPerUpdate()).to.equal(1000);
    });

    it("Should enforce minimum 100 samples", async function () {
      await expect(
        contract.setMinSamplesPerUpdate(50)
      ).to.be.revertedWith("Minimum 100 samples required");
    });

    it("Should allow owner to pause and unpause", async function () {
      await contract.pause();
      
      await contract.registerParticipant(hospital1.address, "Hospital 1", "Region 1");
      
      await expect(
        contract.connect(hospital1).submitUpdate(
          exampleFusionCID,
          exampleFusionHash,
          exampleExtractorCID,
          exampleExtractorsHash,
          1000,
          9100,
          3600
        )
      ).to.be.reverted;

      await contract.unpause();
    });
  });

  describe("Genesis Model Initialization", function () {
    it("Should initialize genesis model with all extractors", async function () {
      await contract.initializeGenesisModel(
        exampleFusionCID,
        exampleFusionHash,
        exampleXrayCID,
        exampleHistoCID,
        exampleUltraCID,
        exampleExtractorsHash
      );

      const genesis = await contract.getGlobalModelByVersion(0);
      expect(genesis.version).to.equal(0);
      expect(genesis.fusionModelCID).to.equal(exampleFusionCID);
      expect(genesis.extractorXrayCID).to.equal(exampleXrayCID);
      expect(genesis.extractorHistoCID).to.equal(exampleHistoCID);
      expect(genesis.extractorUltraCID).to.equal(exampleUltraCID);
    });

    it("Should not allow duplicate genesis initialization", async function () {
      await contract.initializeGenesisModel(
        exampleFusionCID,
        exampleFusionHash,
        exampleXrayCID,
        exampleHistoCID,
        exampleUltraCID,
        exampleExtractorsHash
      );

      await expect(
        contract.initializeGenesisModel(
          exampleFusionCID,
          exampleFusionHash,
          exampleXrayCID,
          exampleHistoCID,
          exampleUltraCID,
          exampleExtractorsHash
        )
      ).to.be.revertedWith("Genesis model already initialized");
    });
  });
});
