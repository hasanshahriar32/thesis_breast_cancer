// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title FederatedModelRegistry
 * @dev Smart contract for coordinating privacy-preserving federated learning
 * for histopathology-based breast cancer classification across multiple hospitals
 * 
 * Model Architecture: EfficientNet-B0 with Coordinate Attention
 * Task: Binary Classification (Benign vs Malignant)
 * Framework: PyTorch
 * Input: 160x160 histopathology images
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
        string modelWeightsCID; // IPFS CID for EfficientNet-B0 + CoordAttention model weights
        bytes32 modelHash; // SHA-256 hash for model verification
        uint256 timestamp;
        uint256 totalSamples; // Total samples used across all participants
        uint256 accuracy; // Stored as percentage * 100 (e.g., 9550 = 95.50%)
        uint256 aucScore; // AUC-ROC score * 10000 (e.g., 9800 = 0.9800)
        uint256 sensitivity; // Sensitivity/Recall * 10000
        uint256 specificity; // Specificity * 10000
        uint256 contributorCount; // Number of hospitals that contributed
        uint256 parentVersion; // Previous model version (lineage tracking)
    }
    
    struct ModelUpdate {
        address contributor; // MetaMask wallet address
        string modelWeightsCID; // IPFS CID for encrypted model weights
        bytes32 modelHash; // SHA-256 hash for model verification
        uint256 dataSampleCount; // Number of histopathology samples (no patient data)
        uint256 localAccuracy; // Hospital's local model accuracy (percentage * 100)
        uint256 localAUC; // Hospital's local AUC score * 10000
        uint256 localSensitivity; // Sensitivity for malignant detection * 10000
        uint256 localSpecificity; // Specificity for benign detection * 10000
        uint256 round; // Training round number
        uint256 submissionTime;
        uint256 trainingDuration; // Time spent training (in seconds)
    }
    
    struct WeightMetadata {
        uint256 totalParameters; // Total number of parameters (~5.9M for EfficientNet-B0)
        uint256 modelSize; // Model file size in bytes
        uint256 inputSize; // Input image size (160 for 160x160)
        string framework; // "PyTorch"
        string version; // Framework version (e.g., "2.0.0")
        string architecture; // "EfficientNet-B0 + CoordinateAttention"
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
    uint256 public minSamplesPerUpdate; // Minimum histopathology samples required per update
    address public oracle;
    
    // --- Events ---
    
    event ParticipantRegistered(address indexed participant, string name, string region);
    event ParticipantRemoved(address indexed participant);
    event ParticipantUpdated(address indexed participant, string name, string region);
    event AggregationRequired(uint256 indexed round, uint256 submissionCount);
    event NewGlobalModel(uint256 indexed version, string modelCID, uint256 accuracy, uint256 aucScore, uint256 contributorCount);
    event UpdateSubmitted(address indexed contributor, uint256 indexed round, uint256 sampleCount, uint256 accuracy, uint256 auc);
    event OracleUpdated(address indexed newOracle);
    event RequiredSubmissionsUpdated(uint256 newRequired);
    event MinSamplesUpdated(uint256 newMinSamples);
    event WeightMetadataStored(uint256 indexed version, uint256 totalParameters, string architecture);
    
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
     * @notice Submit local model update for histopathology classification
     * @param _modelCID IPFS CID of encrypted EfficientNet-B0 model weights
     * @param _modelHash SHA-256 hash of the model for verification
     * @param _sampleCount Number of histopathology samples used (no PII)
     * @param _localAccuracy Hospital's local model accuracy (percentage * 100)
     * @param _localAUC Hospital's local AUC-ROC score (* 10000)
     * @param _localSensitivity Sensitivity for malignant detection (* 10000)
     * @param _localSpecificity Specificity for benign detection (* 10000)
     * @param _trainingDuration Time spent training in seconds
     */
    function submitUpdate(
        string memory _modelCID,
        bytes32 _modelHash,
        uint256 _sampleCount,
        uint256 _localAccuracy,
        uint256 _localAUC,
        uint256 _localSensitivity,
        uint256 _localSpecificity,
        uint256 _trainingDuration
    ) external onlyParticipant whenNotPaused nonReentrant {
        require(!hasSubmitted[currentRound][msg.sender], "Update already submitted for this round");
        require(bytes(_modelCID).length > 0, "Empty model CID");
        require(_sampleCount >= minSamplesPerUpdate, "Insufficient histopathology samples");
        require(_localAccuracy <= 10000, "Accuracy cannot exceed 100%");
        require(_localAUC <= 10000, "AUC cannot exceed 1.0");
        require(_localSensitivity <= 10000, "Sensitivity cannot exceed 100%");
        require(_localSpecificity <= 10000, "Specificity cannot exceed 100%");
        require(hospitalInfo[msg.sender].isActive, "Hospital is not active");
        
        roundUpdates[currentRound].push(ModelUpdate({
            contributor: msg.sender,
            modelWeightsCID: _modelCID,
            modelHash: _modelHash,
            dataSampleCount: _sampleCount,
            localAccuracy: _localAccuracy,
            localAUC: _localAUC,
            localSensitivity: _localSensitivity,
            localSpecificity: _localSpecificity,
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
        
        emit UpdateSubmitted(msg.sender, currentRound, _sampleCount, _localAccuracy, _localAUC);
        
        // If submissions threshold is met, trigger aggregation
        if (roundUpdates[currentRound].length >= requiredSubmissions) {
            emit AggregationRequired(currentRound, roundUpdates[currentRound].length);
        }
    }
    
    /**
     * @notice Publish the newly aggregated global histopathology model
     * @param _modelCID IPFS CID of the aggregated EfficientNet-B0 model
     * @param _modelHash SHA-256 hash of the model
     * @param _accuracy Model accuracy (percentage * 100, e.g., 9550 = 95.50%)
     * @param _aucScore AUC-ROC score (* 10000, e.g., 9800 = 0.9800)
     * @param _sensitivity Sensitivity for malignant detection (* 10000)
     * @param _specificity Specificity for benign detection (* 10000)
     */
    function publishNewGlobalModel(
        string memory _modelCID,
        bytes32 _modelHash,
        uint256 _accuracy,
        uint256 _aucScore,
        uint256 _sensitivity,
        uint256 _specificity
    ) external onlyOracle whenNotPaused {
        require(bytes(_modelCID).length > 0, "Empty model CID");
        require(roundUpdates[currentRound].length >= requiredSubmissions, "Not enough submissions");
        require(_accuracy <= 10000, "Accuracy cannot exceed 100%");
        require(_aucScore <= 10000, "AUC cannot exceed 1.0");
        require(_sensitivity <= 10000, "Sensitivity cannot exceed 100%");
        require(_specificity <= 10000, "Specificity cannot exceed 100%");
        
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
            modelWeightsCID: _modelCID,
            modelHash: _modelHash,
            timestamp: block.timestamp,
            totalSamples: totalSamples,
            accuracy: _accuracy,
            aucScore: _aucScore,
            sensitivity: _sensitivity,
            specificity: _specificity,
            contributorCount: contributorCount,
            parentVersion: parentVersion
        }));
        
        emit NewGlobalModel(currentRound + 1, _modelCID, _accuracy, _aucScore, contributorCount);
        
        currentRound++; // Move to the next round
    }
    
    /**
     * @notice Store weight metadata for histopathology model version
     * @param _version Model version
     * @param _totalParams Total number of parameters (~5.9M for EfficientNet-B0)
     * @param _modelSize Model file size in bytes
     * @param _inputSize Input image size (160 for 160x160)
     * @param _framework ML framework used (e.g., "PyTorch")
     * @param _frameworkVersion Framework version (e.g., "2.0.0")
     * @param _architecture Model architecture (e.g., "EfficientNet-B0 + CoordinateAttention")
     */
    function storeWeightMetadata(
        uint256 _version,
        uint256 _totalParams,
        uint256 _modelSize,
        uint256 _inputSize,
        string memory _framework,
        string memory _frameworkVersion,
        string memory _architecture
    ) external onlyOracle {
        require(_version < globalModels.length, "Invalid version");
        
        modelMetadata[_version] = WeightMetadata({
            totalParameters: _totalParams,
            modelSize: _modelSize,
            inputSize: _inputSize,
            framework: _framework,
            version: _frameworkVersion,
            architecture: _architecture
        });
        
        emit WeightMetadataStored(_version, _totalParams, _architecture);
    }
    
    // --- Query Functions ---
    
    /**
     * @notice Get the latest global histopathology model
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
     * @notice Update the genesis model CID (emergency admin function)
     * @dev Only use this to fix incorrect IPFS uploads, not for normal updates
     * @param _modelCID New IPFS CID for the genesis model
     * @param _modelHash New SHA-256 hash of the model
     */
    function updateGenesisModelCID(
        string memory _modelCID,
        bytes32 _modelHash
    ) external onlyOwner {
        require(globalModels.length > 0, "Genesis model not initialized");
        require(bytes(_modelCID).length > 0, "Empty model CID");
        
        globalModels[0].modelWeightsCID = _modelCID;
        globalModels[0].modelHash = _modelHash;
        
        emit NewGlobalModel(0, _modelCID, 0, 0, 0);
    }
    
    /**
     * @notice Initialize the first global histopathology model (genesis)
     * @param _modelCID IPFS CID of the initial EfficientNet-B0 model
     * @param _modelHash SHA-256 hash of the model
     */
    function initializeGenesisModel(
        string memory _modelCID,
        bytes32 _modelHash
    ) external onlyOwner {
        require(globalModels.length == 0, "Genesis model already initialized");
        require(bytes(_modelCID).length > 0, "Empty model CID");
        
        globalModels.push(GlobalModel({
            version: 0,
            modelWeightsCID: _modelCID,
            modelHash: _modelHash,
            timestamp: block.timestamp,
            totalSamples: 0,
            accuracy: 0,
            aucScore: 0,
            sensitivity: 0,
            specificity: 0,
            contributorCount: 0,
            parentVersion: 0
        }));
        
        emit NewGlobalModel(0, _modelCID, 0, 0, 0);
    }
}
