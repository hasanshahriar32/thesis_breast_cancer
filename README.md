# Privacy-Preserving Federated Learning for Breast Cancer Diagnosis using Blockchain

This document outlines a system for training a multi-modal breast cancer detection model using Federated Learning (FL) and Blockchain. The goal is to allow different parties (e.g., hospitals) to collaboratively train a robust model without sharing sensitive patient data. The blockchain acts as a decentralized, auditable ledger for coordinating the training process.

## Core Concepts

1. **Multi-Modal Feature Extraction:** As demonstrated in the notebook, we use pre-trained models (like `EfficientNetB0`) to act as feature extractors for different image types (X-Ray, Histopathology, Ultrasound). These extractors convert raw images into high-level numerical vectors (features). This is the first step in anonymizing the data.

2. **Federated Learning (FL):** Instead of collecting all data in one place, the model is sent to the data's location (e.g., a hospital's local server). The model is trained locally on that private data, and only the resulting **model updates (gradients or weights)** are shared. This means the raw patient images never leave the secure local environment.

3. **Blockchain as a Decentralized Coordinator:** The blockchain replaces the traditional central server found in most FL systems. It provides a transparent and tamper-proof way to:
    * Store the global model's state.
    * Distribute the model to participating nodes (hospitals).
    * Aggregate the model updates received from participants.
    * Incentivize participation through tokens (optional).

## What to Store on the Blockchain

To maintain patient privacy, **no raw images or even extracted feature vectors should be stored on the blockchain**. Instead, the blockchain will manage the machine learning model itself.

The following data properties will be recorded on-chain:

1. **Global Model Information:**
    * **Model Weights Hash:** A cryptographic hash (e.g., SHA-256) of the current global model's weights file. This allows participants to verify they are downloading the correct model version without storing the large model file directly on-chain.
    * **Model Weights Pointer (IPFS CID):** The location of the actual model weights file, which can be stored on a decentralized file system like [IPFS](https://ipfs.tech/). The blockchain stores the IPFS Content Identifier (CID).
    * **Model Version/Epoch Number:** A counter to track the current training iteration of the global model.

2. **Local Model Updates (from each participant):**
    * **Update Weights Hash:** A hash of the model update (gradients or weights) submitted by a participant.
    * **Update Weights Pointer (IPFS CID):** The IPFS CID pointing to the encrypted model update file. Updates should be encrypted to prevent direct inspection by other participants before aggregation.
    * **Participant ID:** The blockchain address of the participating node (e.g., hospital).
    * **Data Sample Count:** The number of data samples used for the local training round. This is crucial for the aggregation algorithm (e.g., Federated Averaging).

3. **Aggregated Model Update:**
    * After a sufficient number of local updates are submitted, a smart contract can trigger an aggregation process. The result is a single, new global model update.
    * **Aggregated Update Hash & Pointer:** The hash and IPFS CID for the newly computed global model weights. This becomes the new "Global Model" for the next training round.

## System Workflow

Here is a step-by-step guide to how the system would function:

### Phase 1: Initialization

1. **Train Base Models:** Train the feature extractors (`extractor_xray.h5`, `extractor_histo.h5`, `extractor_ultra.h5`) and an initial fusion model (`fusion_model.h5`) as done in the notebook. This serves as the "genesis" or version 1 of the global model.
2. **Deploy Smart Contract:** Deploy a smart contract to a blockchain (e.g., Ethereum). This contract will manage the model registry, participant registration, and the aggregation logic.
3. **Store Initial Model:**
    * Upload the initial `fusion_model.h5` to IPFS to get a CID.
    * Call the smart contract to register the first global model, storing the model's hash and its IPFS CID.

### Phase 2: Federated Training Round (Iterative)

1. **Model Distribution:** A participating hospital (Node A) queries the smart contract to get the IPFS CID of the latest global model. It downloads and loads the model.

2. **Local Training (Off-Chain):**
    * Node A uses its private, local dataset of breast cancer images.
    * For each patient's multi-modal data, it uses the pre-trained extractors to get feature vectors.
    * It trains the downloaded global fusion model on these local features for a few epochs.
    * The result is a set of **updated weights** (or gradients) for the fusion model. **The patient data never leaves Node A's server.**

3. **Submit Update (On-Chain):**
    * Node A encrypts its model update.
    * It uploads the encrypted update to IPFS to get a new CID.
    * Node A calls the smart contract, submitting a transaction that includes:
        * The IPFS CID of its encrypted update.
        * A hash of the update for verification.
        * The number of data samples it used for training.

4. **Aggregation (On-Chain or Off-Chain Oracle):**
    * The smart contract waits until a predefined number of participants have submitted their updates for the current round.
    * Once the threshold is met, the aggregation process begins. This can be done in two ways:
        * **On-Chain (Computationally Expensive):** The smart contract itself could download the (decrypted) updates, perform the Federated Averaging calculation, and compute the new global model. This is often too costly for public blockchains.
        * **Off-Chain Oracle:** A trusted oracle (or a decentralized oracle network like Chainlink) is triggered by the smart contract. The oracle fetches the updates from IPFS, performs the aggregation securely, and submits the new global model weights back to the smart contract.
    * The smart contract updates its registry with the hash and IPFS CID of the new, improved global model. The training round number is incremented.

5. **Repeat:** The cycle repeats, with each round producing a more accurate global model without any central party ever seeing the source data.

## Security and Privacy Enhancements

* **Homomorphic Encryption:** Participants can encrypt their model updates. The aggregation server (or smart contract) can then perform calculations on the encrypted data without decrypting it, providing a very high level of privacy.
* **Differential Privacy:** Before submitting, participants can add a small amount of statistical "noise" to their model updates. This makes it mathematically difficult for anyone to reverse-engineer the updates to infer information about the underlying training data.
* **Zero-Knowledge Proofs:** Participants can generate a proof that they performed the training correctly according to the protocol, without revealing their actual model update.

This architecture provides a robust framework for collaborative medical research, leveraging the strengths of your multi-modal model while respecting the critical need for patient data privacy.
