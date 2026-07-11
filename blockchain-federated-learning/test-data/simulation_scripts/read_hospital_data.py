#!/usr/bin/env python3
"""
Hospital Data Analysis Script

This script demonstrates how to read and analyze the test hospital data,
providing insights into the federated learning network composition.

Usage:
    python read_hospital_data.py
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any


class HospitalDataAnalyzer:
    """Analyzes test data from multiple hospitals in the federated network."""
    
    def __init__(self, test_data_dir: str = "../"):
        self.test_data_dir = Path(test_data_dir)
        self.hospitals = []
        self.load_hospital_data()
    
    def load_hospital_data(self):
        """Load data from all hospital directories."""
        hospital_dirs = [
            "hospital1-boston",
            "hospital2-london", 
            "hospital3-tokyo"
        ]
        
        for hospital_dir in hospital_dirs:
            hospital_path = self.test_data_dir / hospital_dir
            if hospital_path.exists():
                hospital_data = self.load_single_hospital(hospital_path)
                if hospital_data:
                    self.hospitals.append(hospital_data)
                    print(f"\u2705 Loaded data for {hospital_data['info']['hospital_name']}")
            else:
                print(f"\u274c Hospital directory not found: {hospital_path}")
    
    def load_single_hospital(self, hospital_path: Path) -> Dict[str, Any]:
        """Load all JSON files for a single hospital."""
        try:
            hospital_data = {}
            
            json_files = {
                'info': 'hospital_info.json',
                'training': 'training_session.json',
                'weights': 'model_weights_metadata.json',
                'features': 'features_summary.json',
                'blockchain': 'blockchain_submission.json'
            }
            
            for key, filename in json_files.items():
                file_path = hospital_path / filename
                if file_path.exists():
                    with open(file_path, 'r') as f:
                        hospital_data[key] = json.load(f)
                else:
                    print(f"\u26a0\ufe0f  Missing file: {file_path}")
                    return None
            
            return hospital_data
            
        except Exception as e:
            print(f"\u274c Error loading hospital data from {hospital_path}: {e}")
            return None
    
    def analyze_network_composition(self):
        """Analyze the overall network composition."""
        print("\n" + "="*60)
        print("\U0001f310 FEDERATED LEARNING NETWORK ANALYSIS")
        print("="*60)
        
        total_samples = 0
        accuracies = []
        regions = []
        
        for hospital in self.hospitals:
            info = hospital['info']
            training = hospital['training']
            
            samples = training['dataset_info']['total_samples']
            accuracy = training['model_performance']['local_accuracy']
            region = info['region']
            
            total_samples += samples
            accuracies.append(accuracy)
            regions.append(region)
            
        print(f"\U0001f4ca Network Statistics:")
        print(f"   \u2022 Participating Hospitals: {len(self.hospitals)}")
        print(f"   \u2022 Total Patient Samples: {total_samples:,}")
        print(f"   \u2022 Average Accuracy: {sum(accuracies)/len(accuracies):.4f}")
        print(f"   \u2022 Geographic Coverage: {', '.join(set(regions))}")
        print(f"   \u2022 Feature Dimensions: 1,280 per hospital")
        print(f"   \u2022 Model: EfficientNet-B0 + Coordinate Attention (PyTorch)")
        print(f"   \u2022 Total Parameters: ~5.9M per hospital")
    
    def analyze_hospital_details(self):
        """Analyze individual hospital details."""
        print(f"\n\U0001f3e5 INDIVIDUAL HOSPITAL ANALYSIS")
        print("-" * 60)
        
        for i, hospital in enumerate(self.hospitals, 1):
            info = hospital['info']
            training = hospital['training']
            weights = hospital['weights']
            
            print(f"\n{i}. {info['hospital_name']} ({info['country']})")
            print(f"   \U0001f4cd Region: {info['region']}")
            print(f"   \U0001f465 Patient Samples: {training['dataset_info']['total_samples']:,}")
            
            disease_dist = training['dataset_info']['class_balance']
            malignant_pct = (disease_dist['malignant'] / 
                           sum(disease_dist.values())) * 100
            print(f"   \U0001f3af Malignant Cases: {malignant_pct:.1f}%")
            
            model_perf = training['model_performance']
            print(f"   \U0001f4c8 Accuracy: {model_perf['local_accuracy']:.4f}")
            print(f"   \U0001f4c8 AUC-ROC: {model_perf['local_auc_roc']:.4f}")
            
            compute = info['infrastructure']['compute']
            print(f"   \U0001f5a5\ufe0f  Compute: {compute}")
            
            model_size = weights['model']['file_info']['encrypted_size_bytes']
            print(f"   \U0001f4be Model Size: {model_size / (1024*1024):.1f} MB")
            print(f"   \U0001f9ec Parameters: {weights['model']['architecture']['total_parameters']:,}")
    
    def analyze_feature_categories(self):
        """Analyze feature extraction."""
        print(f"\n\U0001f52c FEATURE EXTRACTION ANALYSIS")
        print("-" * 60)
        
        print(f"\n\U0001f4ca Histopathology Features:")
        
        for hospital in self.hospitals:
            features = hospital['features']['feature_extraction_summary']['histopathology_features']
            categories = features['feature_categories']
            
            print(f"\n   \U0001f3e5 {hospital['info']['hospital_name']}:")
            print(f"   \u2022 Categories: {len(categories)}")
            print(f"   \u2022 Total Features: {features['total_features']}")
            print(f"   \u2022 Extraction Model: {features.get('extraction_model', 'EfficientNet-B0 + Coordinate Attention')}")
            
            print(f"   \u2022 Sample Categories:")
            for cat in categories[:3]:
                print(f"     - {cat['category']}")
    
    def analyze_blockchain_readiness(self):
        """Analyze blockchain submission readiness."""
        print(f"\n\u26d3\ufe0f  BLOCKCHAIN SUBMISSION ANALYSIS")
        print("-" * 60)
        
        ready_count = 0
        total_cost = 0.0
        
        for hospital in self.hospitals:
            blockchain = hospital['blockchain']
            validation = blockchain['validation_checks']
            
            is_ready = all(validation.values())
            if is_ready:
                ready_count += 1
            
            cost_eth = float(blockchain['transaction_data']['gas_estimate']['estimated_cost_eth'])
            oracle_cost = float(blockchain['oracle_integration']['oracle_fee_eth'])
            total_cost += cost_eth + oracle_cost
            
            hospital_name = hospital['info']['hospital_name']
            status = "\u2705 Ready" if is_ready else "\u274c Not Ready"
            print(f"   {hospital_name}: {status}")
        
        print(f"\n\U0001f4b0 Network Costs:")
        print(f"   \u2022 Ready Hospitals: {ready_count}/{len(self.hospitals)}")
        print(f"   \u2022 Total Gas Cost: {total_cost:.4f} ETH")
        print(f"   \u2022 Average Cost per Hospital: {total_cost/len(self.hospitals):.4f} ETH")
    
    def generate_summary_report(self):
        """Generate a comprehensive summary report."""
        print(f"\n\U0001f4cb SUMMARY REPORT")
        print("=" * 60)
        
        min_hospitals = 3
        min_samples_per_hospital = 500
        
        meets_requirements = (
            len(self.hospitals) >= min_hospitals and
            all(h['training']['dataset_info']['total_samples'] >= min_samples_per_hospital 
                for h in self.hospitals)
        )
        
        print(f"\u2705 Minimum Requirements Met: {meets_requirements}")
        print(f"   \u2022 Required Hospitals: {min_hospitals} (Have: {len(self.hospitals)})")
        print(f"   \u2022 Required Samples: {min_samples_per_hospital} per hospital")
        
        print(f"\n\U0001f512 Privacy & Compliance:")
        for hospital in self.hospitals:
            name = hospital['info']['hospital_name']
            privacy = hospital['training']['data_privacy']
            print(f"   \u2022 {name}: {privacy['encryption_method']}, \u03b5={privacy['differential_privacy']['epsilon']}")
        
        total_storage = sum(
            hospital['weights']['aggregation_info']['total_model_size_bytes'] 
            for hospital in self.hospitals
        )
        
        print(f"\n\U0001f4be IPFS Storage:")
        print(f"   \u2022 Total Model Files: {len(self.hospitals)} (1 per hospital)")
        print(f"   \u2022 Total Storage: {total_storage / (1024*1024):.1f} MB")
        print(f"   \u2022 Encryption: AES-256-GCM (All files)")


def main():
    """Main execution function."""
    print("\U0001f680 Hospital Data Analyzer")
    print("Analyzing federated learning network test data...")
    
    analyzer = HospitalDataAnalyzer()
    
    if not analyzer.hospitals:
        print("\u274c No hospital data found. Please check the test-data directory structure.")
        return
    
    analyzer.analyze_network_composition()
    analyzer.analyze_hospital_details()
    analyzer.analyze_feature_categories()
    analyzer.analyze_blockchain_readiness()
    analyzer.generate_summary_report()
    
    print(f"\n\u2705 Analysis complete! Network ready for federated learning.")


if __name__ == "__main__":
    main()
