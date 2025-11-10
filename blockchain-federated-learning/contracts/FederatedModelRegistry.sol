// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title FederatedModelRegistry
 * @dev Enhanced smart contract for coordinating privacy-preserving federated learning
 * for multi-modal breast cancer diagnosis across multiple hospitals
 */
contract FederatedModelRegistry is Ownable, ReentrancyGuard, Pausable {
    
    // --- Structs ---
    
    struct HospitalInfo {
        string name; // Hospital name (e.g., "Boston Medical Center")
        string region; // Geographic region (e.g., "North America", "Europe")
        uint256 registrationTime;
        uint256 totalContributions; // Total number of updates submitted
        uint256 totalSamplesContributed; // Cumulative samples across all rounds
        bool isActive; // Current participation status
    }
    
    struct GlobalModel {
        uint256 version;
        string fusionModelCID; // IPFS CID for fusion model weights
        bytes32 fusionModelHash; // SHA-256 hash for fusion model verification
        string extractorXrayCID; // IPFS CID for X-Ray extractor weights
        string extractorHistoCID; // IPFS CID for Histopathology extractor weights
        string extractorUltraCID; // IPFS CID for Ultrasound extractor weights
        bytes32 extractorsHash; // Combined hash of all extractors
        uint256 timestamp;
        uint256 totalSamples; // Total samples used across all participants
        uint256 accuracy; // Stored as percentage * 100 (e.g., 9550 = 95.50%)
        uint256 contributorCount; // Number of hospitals that contributed
        uint256 parentVersion; // Previous model version (lineage tracking)
    }
    
    struct ModelUpdate {
        address contributor; // MetaMask wallet address
        string fusionModelCID; // IPFS CID for encrypted fusion model update
        bytes32 fusionModelHash; // SHA-256 hash for fusion model verification
        string extractorWeightsCID; // IPFS CID for all three feature extractors (packaged)
        bytes32 extractorsHash; // Hash of extractor package
        uint256 dataSampleCount; // Number of samples (no patient data)
        uint256 localAccuracy; // Hospital's local model accuracy (percentage * 100)
        uint256 round; // Training round number
        uint256 submissionTime;
        uint256 trainingDuration; // Time spent training (in seconds)
    }
    
    struct WeightMetadata {
        uint256 totalParameters; // Total number of parameters in model
        uint256 fusionModelSize; // Size in bytes
        uint256 extractorTotalSize; // Combined size of all extractors
        string framework; // "TensorFlow", "PyTorch", etc.
        string version; // Framework version
    }
    
    // --- State Variables ---
    
    // Hospital Management
    mapping(address => bool) public isParticipant;
    mapping(address => HospitalInfo) public hospitalInfo;
    address[] public participantList;
    
    // Model Registry
    GlobalModel[] public globalModels;
    uint256 public currentRound;
    
    // Updates & Submissions
    mapping(uint256 => ModelUpdate[]) public roundUpdates;
    mapping(uint256 => mapping(address => bool)) public hasSubmitted;
    
    // Weight Metadata
    mapping(uint256 => WeightMetadata) public modelMetadata; // version => metadata
    
    // Contribution Tracking
    mapping(address => uint256[]) public hospitalContributions; // hospital => round numbers
    mapping(address => uint256) public hospitalTotalSamples; // cumulative samples per hospital
    
    // Configuration
    uint256 public requiredSubmissions;
    uint256 public minSamplesPerUpdate; // Minimum samples required per update
    address public oracle;
    
    // --- Events ---
    
    event ParticipantRegistered(address indexed participant, string name, string region);
    event ParticipantRemoved(address indexed participant);
    event ParticipantUpdated(address indexed participant, string name, string region);
    event AggregationRequired(uint256 indexed round, uint256 submissionCount);
    event NewGlobalModel(uint256 indexed version, string fusionCID, uint256 accuracy, uint256 contributorCount);
    event UpdateSubmitted(address indexed contributor, uint256 indexed round, uint256 sampleCount, uint256 accuracy);
    event OracleUpdated(address indexed newOracle);
    event RequiredSubmissionsUpdated(uint256 newRequired);
    event MinSamplesUpdated(uint256 newMinSamples);
    event WeightMetadataStored(uint256 indexed version, uint256 totalParameters);
    
    // --- Constructor ---
    
    constructor(uint256 _requiredSubmissions, uint256 _minSamples) Ownable(msg.sender) {
        require(_requiredSubmissions >= 3, "Minimum 3 hospitals required for diversity");
        require(_minSamples >= 100, "Minimum 100 samples required per update");
        requiredSubmissions = _requiredSubmissions;
        minSamplesPerUpdate = _minSamples;
        currentRound = 0;
    }
    
    // --- Modifiers ---
    
    modifier onlyParticipant() {
        require(isParticipant[msg.sender], "Not a registered participant");
        _;
    }
    
    modifier onlyOracle() {
        require(msg.sender == oracle, "Only oracle can call this function");
        _;
    }
    
    // --- Participant Management Functions ---
    
    /**
     * @notice Register a new participant (hospital/institution)
     * @param _participant Address to register
     * @param _name Hospital name
     * @param _region Geographic region
     */
    function registerParticipant(
        address _participant,
        string memory _name,
        string memory _region
    ) external onlyOwner {
        require(_participant != address(0), "Invalid address");
        require(!isParticipant[_participant], "Already registered");
        require(bytes(_name).length > 0, "Hospital name required");
        require(bytes(_region).length > 0, "Region required");
        
        isParticipant[_participant] = true;
        participantList.push(_participant);
        
        hospitalInfo[_participant] = HospitalInfo({
            name: _name,
            region: _region,
            registrationTime: block.timestamp,
            totalContributions: 0,
            totalSamplesContributed: 0,
            isActive: true
        });
        
        emit ParticipantRegistered(_participant, _name, _region);
    }
    
    /**
     * @notice Update hospital information
     * @param _participant Hospital address
     * @param _name New hospital name
     * @param _region New region
     */
    function updateHospitalInfo(
        address _participant,
        string memory _name,
        string memory _region
    ) external onlyOwner {
        require(isParticipant[_participant], "Not a participant");
        require(bytes(_name).length > 0, "Hospital name required");
        require(bytes(_region).length > 0, "Region required");
        
        hospitalInfo[_participant].name = _name;
        hospitalInfo[_participant].region = _region;
        
        emit ParticipantUpdated(_participant, _name, _region);
    }
    
    /**
     * @notice Remove a participant
     * @param _participant Address to remove
     */
    function removeParticipant(address _participant) external onlyOwner {
        require(isParticipant[_participant], "Not a participant");
        
        isParticipant[_participant] = false;
        
        // Remove from participantList
        for (uint256 i = 0; i < participantList.length; i++) {
            if (participantList[i] == _participant) {
                participantList[i] = participantList[participantList.length - 1];
                participantList.pop();
                break;
            }
        }
        
        emit ParticipantRemoved(_participant);
    }
    
    /**
     * @notice Get all registered participants
     */
    function getParticipants() external view returns (address[] memory) {
        return participantList;
    }
    
    // --- Model Submission Functions ---
    
    /**
     * @notice Submit local model update with enhanced weight tracking
     * @param _fusionCID IPFS CID of encrypted fusion model weights
     * @param _fusionHash SHA-256 hash of the fusion model for verification
     * @param _extractorCID IPFS CID of feature extractor weights package (xray, histo, ultra)
     * @param _extractorsHash SHA-256 hash of extractor package
     * @param _sampleCount Number of patient samples used (no PII)
     * @param _localAccuracy Hospital's local model accuracy (percentage * 100)
     * @param _trainingDuration Time spent training in seconds
     */
    function submitUpdate(
        string memory _fusionCID,
        bytes32 _fusionHash,
        string memory _extractorCID,
        bytes32 _extractorsHash,
        uint256 _sampleCount,
        uint256 _localAccuracy,
        uint256 _trainingDuration
    ) external onlyParticipant whenNotPaused nonReentrant {
        require(!hasSubmitted[currentRound][msg.sender], "Update already submitted for this round");
        require(bytes(_fusionCID).length > 0, "Empty fusion model CID");
        require(bytes(_extractorCID).length > 0, "Empty extractor CID");
        require(_sampleCount >= minSamplesPerUpdate, "Insufficient samples");
        require(_localAccuracy <= 10000, "Accuracy cannot exceed 100%");
        require(hospitalInfo[msg.sender].isActive, "Hospital is not active");
        
        roundUpdates[currentRound].push(ModelUpdate({
            contributor: msg.sender,
            fusionModelCID: _fusionCID,
            fusionModelHash: _fusionHash,
            extractorWeightsCID: _extractorCID,
            extractorsHash: _extractorsHash,
            dataSampleCount: _sampleCount,
            localAccuracy: _localAccuracy,
            round: currentRound,
            submissionTime: block.timestamp,
            trainingDuration: _trainingDuration
        }));
        
        hasSubmitted[currentRound][msg.sender] = true;
        
        // Update hospital statistics
        hospitalInfo[msg.sender].totalContributions++;
        hospitalInfo[msg.sender].totalSamplesContributed += _sampleCount;
        hospitalTotalSamples[msg.sender] += _sampleCount;
        hospitalContributions[msg.sender].push(currentRound);
        
        emit UpdateSubmitted(msg.sender, currentRound, _sampleCount, _localAccuracy);
        
        // If submissions threshold is met, trigger aggregation
        if (roundUpdates[currentRound].length >= requiredSubmissions) {
            emit AggregationRequired(currentRound, roundUpdates[currentRound].length);
        }
    }
    
    /**
     * @notice Publish the newly aggregated global model with enhanced metadata
     * @param _fusionCID IPFS CID of the aggregated fusion model
     * @param _fusionHash SHA-256 hash of the fusion model
     * @param _extractorXrayCID IPFS CID for aggregated X-Ray extractor
     * @param _extractorHistoCID IPFS CID for aggregated Histopathology extractor
     * @param _extractorUltraCID IPFS CID for aggregated Ultrasound extractor
     * @param _extractorsHash Combined hash of all three extractors
     * @param _accuracy Model accuracy (percentage * 100, e.g., 9550 = 95.50%)
     */
    function publishNewGlobalModel(
        string memory _fusionCID,
        bytes32 _fusionHash,
        string memory _extractorXrayCID,
        string memory _extractorHistoCID,
        string memory _extractorUltraCID,
        bytes32 _extractorsHash,
        uint256 _accuracy
    ) external onlyOracle whenNotPaused {
        require(bytes(_fusionCID).length > 0, "Empty fusion CID");
        require(bytes(_extractorXrayCID).length > 0, "Empty X-Ray extractor CID");
        require(bytes(_extractorHistoCID).length > 0, "Empty Histo extractor CID");
        require(bytes(_extractorUltraCID).length > 0, "Empty Ultra extractor CID");
        require(roundUpdates[currentRound].length >= requiredSubmissions, "Not enough submissions");
        require(_accuracy <= 10000, "Accuracy cannot exceed 100%");
        
        // Calculate total samples and contributor count from all participants
        uint256 totalSamples = 0;
        uint256 contributorCount = roundUpdates[currentRound].length;
        
        for (uint256 i = 0; i < contributorCount; i++) {
            totalSamples += roundUpdates[currentRound][i].dataSampleCount;
        }
        
        // Determine parent version (0 if first model after genesis, otherwise previous version)
        uint256 parentVersion = globalModels.length > 0 ? globalModels[globalModels.length - 1].version : 0;
        
        globalModels.push(GlobalModel({
            version: currentRound + 1,
            fusionModelCID: _fusionCID,
            fusionModelHash: _fusionHash,
            extractorXrayCID: _extractorXrayCID,
            extractorHistoCID: _extractorHistoCID,
            extractorUltraCID: _extractorUltraCID,
            extractorsHash: _extractorsHash,
            timestamp: block.timestamp,
            totalSamples: totalSamples,
            accuracy: _accuracy,
            contributorCount: contributorCount,
            parentVersion: parentVersion
        }));
        
        emit NewGlobalModel(currentRound + 1, _fusionCID, _accuracy, contributorCount);
        
        currentRound++; // Move to the next round
    }
    
    /**
     * @notice Store weight metadata for a model version
     * @param _version Model version
     * @param _totalParams Total number of parameters
     * @param _fusionSize Fusion model size in bytes
     * @param _extractorSize Combined extractor size in bytes
     * @param _framework ML framework used (e.g., "TensorFlow")
     * @param _frameworkVersion Framework version (e.g., "2.15.0")
     */
    function storeWeightMetadata(
        uint256 _version,
        uint256 _totalParams,
        uint256 _fusionSize,
        uint256 _extractorSize,
        string memory _framework,
        string memory _frameworkVersion
    ) external onlyOracle {
        require(_version < globalModels.length, "Invalid version");
        
        modelMetadata[_version] = WeightMetadata({
            totalParameters: _totalParams,
            fusionModelSize: _fusionSize,
            extractorTotalSize: _extractorSize,
            framework: _framework,
            version: _frameworkVersion
        });
        
        emit WeightMetadataStored(_version, _totalParams);
    }
    
    // --- Query Functions ---
    
    /**
     * @notice Get the latest global model
     */
    function getLatestGlobalModel() external view returns (GlobalModel memory) {
        require(globalModels.length > 0, "No models published yet");
        return globalModels[globalModels.length - 1];
    }
    
    /**
     * @notice Get a specific global model by version
     */
    function getGlobalModelByVersion(uint256 _version) external view returns (GlobalModel memory) {
        require(_version < globalModels.length, "Invalid version");
        return globalModels[_version];
    }
    
    /**
     * @notice Get weight metadata for a specific version
     */
    function getWeightMetadata(uint256 _version) external view returns (WeightMetadata memory) {
        require(_version < globalModels.length, "Invalid version");
        return modelMetadata[_version];
    }
    
    /**
     * @notice Get hospital information
     */
    function getHospitalInfo(address _hospital) external view returns (HospitalInfo memory) {
        require(isParticipant[_hospital], "Not a participant");
        return hospitalInfo[_hospital];
    }
    
    /**
     * @notice Get all rounds a hospital has contributed to
     */
    function getHospitalContributions(address _hospital) external view returns (uint256[] memory) {
        require(isParticipant[_hospital], "Not a participant");
        return hospitalContributions[_hospital];
    }
    
    /**
     * @notice Get all updates for a specific round
     */
    function getUpdatesForRound(uint256 _round) external view returns (ModelUpdate[] memory) {
        return roundUpdates[_round];
    }
    
    /**
     * @notice Get a specific update from a round
     */
    function getUpdateByIndex(uint256 _round, uint256 _index) external view returns (ModelUpdate memory) {
        require(_index < roundUpdates[_round].length, "Index out of bounds");
        return roundUpdates[_round][_index];
    }
    
    /**
     * @notice Get the contributor's address for a specific update
     */
    function getContributorAddress(uint256 _round, uint256 _index) external view returns (address) {
        require(_index < roundUpdates[_round].length, "Index out of bounds");
        return roundUpdates[_round][_index].contributor;
    }
    
    /**
     * @notice Get total number of global models published
     */
    function getModelCount() external view returns (uint256) {
        return globalModels.length;
    }
    
    /**
     * @notice Get number of submissions for current round
     */
    function getCurrentRoundSubmissions() external view returns (uint256) {
        return roundUpdates[currentRound].length;
    }
    
    /**
     * @notice Check if address has submitted for current round
     */
    function hasSubmittedCurrentRound(address _participant) external view returns (bool) {
        return hasSubmitted[currentRound][_participant];
    }
    
    /**
     * @notice Get model lineage (parent-child relationships)
     */
    function getModelLineage(uint256 _version) external view returns (uint256[] memory) {
        require(_version < globalModels.length, "Invalid version");
        
        // Count ancestors
        uint256 count = 0;
        uint256 currentVersion = _version;
        while (currentVersion < globalModels.length) {
            count++;
            uint256 parent = globalModels[currentVersion].parentVersion;
            if (parent == currentVersion) break; // Reached genesis
            currentVersion = parent;
        }
        
        // Build lineage array
        uint256[] memory lineage = new uint256[](count);
        currentVersion = _version;
        for (uint256 i = 0; i < count; i++) {
            lineage[i] = currentVersion;
            uint256 parent = globalModels[currentVersion].parentVersion;
            if (parent == currentVersion) break; // Reached genesis
            currentVersion = parent;
        }
        
        return lineage;
    }
    
    /**
     * @notice Get aggregated statistics across all hospitals
     */
    function getNetworkStatistics() external view returns (
        uint256 totalHospitals,
        uint256 activeHospitals,
        uint256 totalContributions,
        uint256 totalSamples,
        uint256 currentRoundNumber,
        uint256 modelsPublished
    ) {
        totalHospitals = participantList.length;
        
        for (uint256 i = 0; i < participantList.length; i++) {
            if (hospitalInfo[participantList[i]].isActive) {
                activeHospitals++;
            }
            totalContributions += hospitalInfo[participantList[i]].totalContributions;
            totalSamples += hospitalInfo[participantList[i]].totalSamplesContributed;
        }
        
        currentRoundNumber = currentRound;
        modelsPublished = globalModels.length;
    }
    
    // --- Admin Functions ---
    
    /**
     * @notice Set the oracle address
     */
    function setOracleAddress(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle address");
        oracle = _oracle;
        emit OracleUpdated(_oracle);
    }
    
    /**
     * @notice Set required number of submissions
     */
    function setRequiredSubmissions(uint256 _count) external onlyOwner {
        require(_count >= 3, "Minimum 3 hospitals required for diversity");
        requiredSubmissions = _count;
        emit RequiredSubmissionsUpdated(_count);
    }
    
    /**
     * @notice Set minimum samples per update
     */
    function setMinSamplesPerUpdate(uint256 _minSamples) external onlyOwner {
        require(_minSamples >= 100, "Minimum 100 samples required");
        minSamplesPerUpdate = _minSamples;
        emit MinSamplesUpdated(_minSamples);
    }
    
    /**
     * @notice Activate/deactivate a hospital
     */
    function setHospitalStatus(address _hospital, bool _isActive) external onlyOwner {
        require(isParticipant[_hospital], "Not a participant");
        hospitalInfo[_hospital].isActive = _isActive;
    }
    
    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Initialize the first global model (genesis) with separate extractors
     * @param _fusionCID IPFS CID of the initial fusion model
     * @param _fusionHash SHA-256 hash of the fusion model
     * @param _extractorXrayCID IPFS CID for X-Ray extractor
     * @param _extractorHistoCID IPFS CID for Histopathology extractor
     * @param _extractorUltraCID IPFS CID for Ultrasound extractor
     * @param _extractorsHash Combined hash of all extractors
     */
    function initializeGenesisModel(
        string memory _fusionCID,
        bytes32 _fusionHash,
        string memory _extractorXrayCID,
        string memory _extractorHistoCID,
        string memory _extractorUltraCID,
        bytes32 _extractorsHash
    ) external onlyOwner {
        require(globalModels.length == 0, "Genesis model already initialized");
        require(bytes(_fusionCID).length > 0, "Empty fusion CID");
        require(bytes(_extractorXrayCID).length > 0, "Empty X-Ray extractor CID");
        require(bytes(_extractorHistoCID).length > 0, "Empty Histo extractor CID");
        require(bytes(_extractorUltraCID).length > 0, "Empty Ultra extractor CID");
        
        globalModels.push(GlobalModel({
            version: 0,
            fusionModelCID: _fusionCID,
            fusionModelHash: _fusionHash,
            extractorXrayCID: _extractorXrayCID,
            extractorHistoCID: _extractorHistoCID,
            extractorUltraCID: _extractorUltraCID,
            extractorsHash: _extractorsHash,
            timestamp: block.timestamp,
            totalSamples: 0,
            accuracy: 0,
            contributorCount: 0,
            parentVersion: 0
        }));
        
        emit NewGlobalModel(0, _fusionCID, 0, 0);
    }
}
