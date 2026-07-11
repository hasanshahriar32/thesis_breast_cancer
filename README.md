# Privacy-Preserving Federated Learning for Breast Cancer Diagnosis using Blockchain

A decentralized federated learning system for histopathology-based breast cancer classification using blockchain coordination and IPFS storage.

## Project Overview

This project implements a privacy-preserving machine learning system that enables multiple hospitals to collaboratively train a breast cancer classification model without sharing sensitive patient data.

### Key Features

- **Single-Modality Histopathology Classification**: Binary classification (Benign vs Malignant)
- **EfficientNet-B0 + Coordinate Attention**: State-of-the-art deep learning architecture
- **Federated Learning**: Decentralized training across multiple hospitals
- **FedProx Aggregation**: Proximal regularization for robust non-IID data handling
- **Blockchain Coordination**: Ethereum-based smart contract for transparent model aggregation
- **IPFS Storage**: Decentralized storage for model weights

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Federated Learning Network                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                  │
│  │ Hospital │    │ Hospital │    │ Hospital │                  │
│  │  Boston  │    │  London  │    │  Tokyo   │                  │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘                  │
│       │               │               │                         │
│       │   Local Training (EfficientNet-B0)                     │
│       │               │               │                         │
│       ▼               ▼               ▼                         │
│  ┌─────────────────────────────────────────┐                   │
│  │           IPFS (Model Weights)          │                   │
│  └─────────────────────────────────────────┘                   │
│                       │                                         │
│                       ▼                                         │
│  ┌─────────────────────────────────────────┐                   │
│  │    Ethereum Smart Contract (Sepolia)    │                   │
│  │    FederatedModelRegistry               │                   │
│  └─────────────────────────────────────────┘                   │
│                       │                                         │
│                       ▼                                         │
│  ┌─────────────────────────────────────────┐                   │
│  │   Oracle (FedProx Server-Side Aggregation)  │                   │
│  └─────────────────────────────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Model Specifications

| Property | Value |
|----------|-------|
| **Architecture** | EfficientNet-B0 + Coordinate Attention |
| **Task** | Binary Classification (Benign vs Malignant) |
| **Input Size** | 160×160 RGB |
| **Parameters** | ~5.9M |
| **Framework** | PyTorch 2.0+ |

## Project Structure

```
thesis/
├── README.md                      # This file
├── requirements.txt               # Python dependencies
├── docs/                          # Project documentation
├── tasks/                         # Task tracking
├── model/                         # ML model code and weights
│   ├── model_code.ipynb          # Training notebook
│   └── best_histopathology_model.pth
├── blockchain-federated-learning/ # Smart contract & scripts
│   ├── contracts/                 # Solidity contracts
│   ├── scripts/                   # Deployment & interaction
│   ├── test/                      # Contract tests
│   └── docs/                      # Blockchain-specific docs
└── hospital-backend/              # Hospital node backend
    ├── src/                       # Express.js server
    └── docs/                      # Backend documentation
```

## Quick Start

### 1. Smart Contract (Sepolia Testnet)

```bash
cd blockchain-federated-learning
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

### 2. Interact with Contract

```bash
npx hardhat run scripts/interact.js --network sepolia
```

### 3. Hospital Backend

```bash
cd hospital-backend
npm install
npm start
```

## Current Deployment

| Property | Value |
|----------|-------|
| **Network** | Sepolia Testnet |
| **Contract Address** | `0x1BE44922c9505E492eA93cfA4a673CE8ea106Ea1` |
| **Block Number** | 9808044 |
| **Deployment Date** | December 10, 2025 |

## Documentation

- [Blockchain Setup Guide](./blockchain-federated-learning/SETUP_GUIDE.md)
- [Smart Contract API](./blockchain-federated-learning/docs/ENHANCED_CONTRACT_GUIDE.md)
- [Task List](./tasks/TASKS.md)
- [Completed Work](./docs/COMPLETED_WORK.md)

## Technologies

- **Blockchain**: Solidity 0.8.20, Hardhat, OpenZeppelin
- **ML Framework**: PyTorch 2.0+
- **Backend**: Node.js, Express.js
- **Storage**: IPFS
- **Network**: Ethereum Sepolia Testnet

## License

This project is part of a thesis research work.
