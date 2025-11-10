# Smart Contract Design for Federated Learning Coordination

This document provides a detailed breakdown of the smart contract required for the decentralized, privacy-preserving federated learning system. The smart contract is the backbone of the system, acting as a decentralized coordinator that ensures transparency, security, and auditability.

## Recommended Technologies

* **Blockchain Platform:** **Ethereum Sepolia Testnet** - A test network for development and testing without real financial cost. Sepolia provides a realistic Ethereum environment for deploying and testing smart contracts before mainnet deployment.
* **Wallet:** **MetaMask** - Browser extension wallet for managing Ethereum accounts and signing transactions. Your MetaMask wallet address will serve as your participant identifier.
* **Smart Contract Language:** **Solidity** is the standard for Ethereum and EVM-compatible chains.
* **Development & Testing Framework:** **Hardhat** is a modern and flexible environment for testing, deploying, and debugging Solidity smart contracts. Truffle is another popular alternative.
* **Standard Libraries:** **OpenZeppelin Contracts** should be used to implement secure, community-vetted patterns for access control (`Ownable`), security (`Pausable`, `ReentrancyGuard`), and other common functionalities.
* **Decentralized Storage:** **IPFS (InterPlanetary File System)** for storing large files like model weights. The blockchain will only store the IPFS Content Identifiers (CIDs).
* **Off-Chain Computation (Oracle):** **Chainlink** is the industry standard for connecting smart contracts to off-chain resources. It can be used to trigger the secure aggregation of model updates, which is too computationally intensive to run directly on the blockchain.
* **Test ETH:** Get free Sepolia test ETH from faucets like https://sepoliafaucet.com/ to pay for gas fees during testing.

---

## Core Smart Contract Features & Keywords

The smart contract can be thought of as a `FederatedModelRegistry`. Below are its core components, including the functions and state variables it must manage.

### 1. Participant Management

The contract needs to control which entities (hospitals, research labs) can participate in the training process.

*   **State Variables:**
    *   `address private owner;`: The address that deploys and owns the contract, with administrative privileges.
    *   `mapping(address => bool) public isParticipant;`: A list that maps an address to a boolean, indicating if it's an approved participant.
    *   `address[] public participantList;`: An array to easily iterate through all registered participants.

*   **Functions:**
    *   `registerParticipant(address _participant)`: (Owner-only) Adds a new institution to the `isParticipant` mapping.
    *   `removeParticipant(address _participant)`: (Owner-only) Revokes an institution's participation rights.

### 2. Global Model Registry

This is the on-chain record of the official global model as it evolves through training rounds.

*   **State Variables:**
    *   `struct GlobalModel { uint version; string modelWeightsCID; bytes32 modelWeightsHash; uint timestamp; }`: A structure to hold all metadata for a specific version of the global model.
    *   `GlobalModel[] public globalModels;`: An array that stores the history of all global model versions. The latest model is the last element in the array.
    *   `uint public currentRound;`: The current federated learning round number.

*   **Functions:**
    *   `submitNewGlobalModel(string memory _cid, bytes32 _hash)`: (Owner-only or Oracle-only) Called to add the next version of the global model to the `globalModels` array after aggregation. This marks the end of a training round and the beginning of a new one.
    *   `getLatestGlobalModel() returns (GlobalModel memory)`: A public view function that allows anyone to retrieve the metadata for the most recent global model.

### 3. Local Model Update Submission

This feature allows registered participants to submit their contributions for a given training round.

*   **State Variables:**
    *   `struct ModelUpdate { address contributor; string encryptedUpdateCID; bytes32 updateHash; uint dataSampleCount; uint round; string extractorWeightsCID; }`: A structure to define a participant's contribution.
        * `contributor`: The MetaMask wallet address of the hospital/participant
        * `encryptedUpdateCID`: IPFS CID of the encrypted fusion model weights update
        * `updateHash`: SHA-256 hash for verification
        * `dataSampleCount`: Number of patient samples used (without revealing patient identities)
        * `round`: The training round number
        * `extractorWeightsCID`: IPFS CID pointing to the trained feature extractors (EfficientNetB0 for X-Ray, Histopathology, and Ultrasound)
    *   `mapping(uint => ModelUpdate[]) public roundUpdates;`: Maps a round number to an array of all updates submitted during that round.
    *   `mapping(uint => mapping(address => bool)) public hasSubmitted;`: A nested mapping to prevent a participant from submitting more than one update per round.

*   **Functions:**
    *   `submitUpdate(string memory _encryptedCID, bytes32 _hash, uint _sampleCount, string memory _extractorCID)`: A function for registered participants to submit their encrypted model updates. It should contain checks to ensure:
        * The sender is a registered participant (`isParticipant[msg.sender]`).
        * The participant has not already submitted for the current round (`!hasSubmitted[currentRound][msg.sender]`).
        * The `_extractorCID` contains the IPFS CID for the three feature extractors (`extractor_xray.h5`, `extractor_histo.h5`, `extractor_ultra.h5`) packaged together.
    *   `getUpdatesForRound(uint _round) returns (ModelUpdate[] memory)`: A public view function to retrieve all update submissions for a specific round. This would be called by the oracle to begin the aggregation process.

### 4. Aggregation and Round Management

This component manages the lifecycle of a training round and triggers the aggregation process.

*   **State Variables:**
    *   `uint public requiredSubmissions;`: The minimum number of updates required before aggregation can be triggered.
    *   `address public oracle;`: The address of the trusted oracle responsible for aggregation.

*   **Functions:**
    *   `setOracleAddress(address _oracle)`: (Owner-only) Sets the address of the oracle contract.
    *   `setRequiredSubmissions(uint _count)`: (Owner-only) Configures the threshold for aggregation.
    *   `triggerAggregation()`: This function is called when enough updates have been submitted. It emits an event that the off-chain oracle listens for.
        *   It checks if `roundUpdates[currentRound].length >= requiredSubmissions`.
        *   If true, it emits an event like `AggregationRequired(uint round)`.
        *   The oracle, upon seeing this event, will fetch the data using `getUpdatesForRound`, perform the off-chain aggregation, and call `submitNewGlobalModel` with the results, which also increments `currentRound`.

### 5. (Optional) Incentive Mechanism

To encourage participation, the contract can reward contributors with a native token (e.g., an ERC-20 token).

*   **State Variables:**
    *   `IERC20 public rewardToken;`: The contract address of the reward token.
    *   `mapping(uint => uint) public roundRewards;`: The total reward amount allocated for each round.

*   **Functions:**
    *   `distributeRewards()`: After a round is successfully aggregated, this function could be called to distribute tokens to the participants of that round, potentially weighted by their `dataSampleCount`.

---

## What Data is Stored for Breast Cancer Federated Learning?

### Privacy-Preserving Data Storage Strategy

**NEVER stored on blockchain:**
- Raw patient images (X-Ray, Histopathology, Ultrasound)
- Patient names, IDs, or any personally identifiable information (PII)
- Extracted feature vectors (the 1280-dimensional vectors from EfficientNetB0)

**STORED on blockchain:**
1. **Model Metadata:**
   * IPFS CID of model weights (fusion model + extractors)
   * SHA-256 hash of model files for integrity verification
   * Version/round numbers
   * Timestamps

2. **Aggregated Statistics (Non-Identifying):**
   * Total number of samples used in training (e.g., "trained on 500 samples")
   * Class distribution (e.g., "60% malignant, 40% benign")
   * Model performance metrics (accuracy, AUC, sensitivity, specificity)

3. **Participant Information:**
   * MetaMask wallet addresses (public keys, not linked to real identities in decentralized system)
   * Contribution counts per participant

**STORED on IPFS (encrypted):**
- Model weight updates (gradients or full weights)
- Feature extractor weights
- These are encrypted before uploading to IPFS, and only the aggregation oracle can decrypt them

This ensures that sensitive patient data remains completely private while still enabling collaborative model training through federated learning.

---

## Deployment Guide: Sepolia Testnet with MetaMask

### Prerequisites

1. **Install MetaMask:**
   * Add MetaMask extension to your browser (Chrome, Firefox, Brave)
   * Create a new wallet or import an existing one
   * **SAVE YOUR SEED PHRASE SECURELY** - this is your only recovery method

2. **Configure Sepolia Network in MetaMask:**
   * Open MetaMask → Networks → Add Network
   * Network Name: `Sepolia Test Network`
   * RPC URL: `https://sepolia.infura.io/v3/YOUR_INFURA_KEY` or `https://rpc.sepolia.org`
   * Chain ID: `11155111`
   * Currency Symbol: `ETH`
   * Block Explorer: `https://sepolia.etherscan.io`

3. **Get Test ETH:**
   * Visit https://sepoliafaucet.com/
   * Enter your MetaMask wallet address
   * Receive free test ETH (needed for gas fees)

4. **Setup Development Environment:**
   ```bash
   npm install --save-dev hardhat @openzeppelin/contracts
   npm install --save-dev @nomiclabs/hardhat-ethers ethers
   npm install dotenv
   ```

5. **Create `.env` file:**
   ```
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
   PRIVATE_KEY=your_metamask_private_key_here
   ```
   **WARNING:** Never commit your private key to version control!

### Deployment Steps

1. **Configure Hardhat for Sepolia:**
   Edit `hardhat.config.js`:
   ```javascript
   require("@nomiclabs/hardhat-ethers");
   require("dotenv").config();

   module.exports = {
     solidity: "0.8.17",
     networks: {
       sepolia: {
         url: process.env.SEPOLIA_RPC_URL,
         accounts: [process.env.PRIVATE_KEY],
         chainId: 11155111
       }
     }
   };
   ```

2. **Deploy Contract:**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

3. **Verify on Etherscan:**
   * Copy the deployed contract address
   * Visit https://sepolia.etherscan.io
   * Search for your contract address
   * You can now interact with your contract through MetaMask

### Interacting with the Contract via MetaMask

Participants (hospitals) will:
1. Connect their MetaMask wallet to your DApp frontend
2. Sign transactions using MetaMask to:
   * Register as a participant (if whitelisted by owner)
   * Submit model updates with their local training results
   * Query the latest global model CID from IPFS
3. All transactions are signed with their private key, ensuring authenticity

---

## Example Smart Contract Snippet (Solidity)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FederatedModelRegistry is Ownable {

    // --- Structs ---
    struct GlobalModel {
        uint version;
        string modelWeightsCID; // IPFS Content ID
        bytes32 modelWeightsHash;
        uint timestamp;
    }

    struct ModelUpdate {
        address contributor; // MetaMask wallet address
        string encryptedUpdateCID; // IPFS CID for encrypted fusion model update
        bytes32 updateHash; // SHA-256 hash for verification
        uint dataSampleCount; // Number of samples (no patient data)
        uint round; // Training round number
        string extractorWeightsCID; // IPFS CID for feature extractors
    }

    // --- State Variables ---
    mapping(address => bool) public isParticipant;
    GlobalModel[] public globalModels;
    uint public currentRound;
    mapping(uint => ModelUpdate[]) public roundUpdates;
    mapping(uint => mapping(address => bool)) public hasSubmitted;
    uint public requiredSubmissions;
    address public oracle;

    // --- Events ---
    event AggregationRequired(uint indexed round);
    event NewGlobalModel(uint indexed version, string cid);
    event UpdateSubmitted(address indexed contributor, uint indexed round);

    // ... (Constructor and functions for participant management, etc.) ...

    /**
     * @notice Called by registered participants to submit their model updates.
     * @param _encryptedCID IPFS CID of encrypted fusion model weights
     * @param _hash SHA-256 hash of the model update for verification
     * @param _sampleCount Number of patient samples used (no PII)
     * @param _extractorCID IPFS CID of feature extractor weights (xray, histo, ultra)
     */
    function submitUpdate(
        string memory _encryptedCID, 
        bytes32 _hash, 
        uint _sampleCount, 
        string memory _extractorCID
    ) external {
        require(isParticipant[msg.sender], "Not a registered participant");
        require(!hasSubmitted[currentRound][msg.sender], "Update already submitted for this round");

        roundUpdates[currentRound].push(ModelUpdate({
            contributor: msg.sender, // msg.sender is the MetaMask wallet address
            encryptedUpdateCID: _encryptedCID,
            updateHash: _hash,
            dataSampleCount: _sampleCount,
            round: currentRound,
            extractorWeightsCID: _extractorCID
        }));

        hasSubmitted[currentRound][msg.sender] = true;
        emit UpdateSubmitted(msg.sender, currentRound);

        // If submissions threshold is met, trigger aggregation
        if (roundUpdates[currentRound].length >= requiredSubmissions) {
            emit AggregationRequired(currentRound);
        }
    }

    /**
     * @notice Called by the oracle to publish the newly aggregated model.
     */
    function publishNewGlobalModel(string memory _cid, bytes32 _hash) external {
        require(msg.sender == oracle, "Only the oracle can publish a new model");
        
        globalModels.push(GlobalModel({
            version: currentRound + 1,
            modelWeightsCID: _cid,
            modelWeightsHash: _hash,
            timestamp: block.timestamp
        }));

        currentRound++; // Move to the next round
        emit NewGlobalModel(currentRound, _cid);
    }
    
    /**
     * @notice Get the participant's MetaMask address for a specific update
     */
    function getContributorAddress(uint _round, uint _index) public view returns (address) {
        require(_index < roundUpdates[_round].length, "Index out of bounds");
        return roundUpdates[_round][_index].contributor;
    }
    
    // ... (Other getter and setter functions) ...
}
```

---

## Summary: Key Data Stored for Breast Cancer Federated Learning

This smart contract design ensures that:

1. **Patient Privacy is Preserved:** No raw images, feature vectors, or patient identifiers are stored on-chain.

2. **Model Evolution is Tracked:** Every version of the global model is recorded with its IPFS CID and cryptographic hash.

3. **Contributions are Verifiable:** Each hospital's MetaMask address is associated with their contributions, enabling accountability without revealing patient data.

4. **Decentralized Coordination:** The blockchain replaces a central server, providing transparency and trust among participating institutions.

5. **Sepolia Testnet Ready:** The contract can be deployed and tested on Sepolia using MetaMask without spending real money.

This detailed guide provides a solid foundation for developing the smart contract portion of your privacy-preserving, blockchain-based federated learning system for breast cancer diagnosis.
