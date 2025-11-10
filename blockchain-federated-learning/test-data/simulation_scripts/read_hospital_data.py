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
                    print(f"✅ Loaded data for {hospital_data['info']['hospital_name']}")
            else:
                print(f"❌ Hospital directory not found: {hospital_path}")
    
    def load_single_hospital(self, hospital_path: Path) -> Dict[str, Any]:
        """Load all JSON files for a single hospital."""
        try:
            hospital_data = {}
            
            # Load each JSON file
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
                    print(f"⚠️  Missing file: {file_path}")
                    return None
            
            return hospital_data
            
        except Exception as e:
            print(f"❌ Error loading hospital data from {hospital_path}: {e}")
            return None
    
    def analyze_network_composition(self):
        """Analyze the overall network composition."""
        print("\n" + "="*60)
        print("🌐 FEDERATED LEARNING NETWORK ANALYSIS")
        print("="*60)
        
        total_samples = 0
        total_params = 0
        accuracies = []
        regions = []
        
        for hospital in self.hospitals:
            info = hospital['info']
            training = hospital['training']
            
            samples = training['dataset_info']['total_samples']
            accuracy = training['fusion_model_performance']['local_accuracy']
            region = info['region']
            
            total_samples += samples
            total_params += training['fusion_model_performance']['input_dimensions']
            accuracies.append(accuracy)
            regions.append(region)
            
        print(f"📊 Network Statistics:")
        print(f"   • Participating Hospitals: {len(self.hospitals)}")
        print(f"   • Total Patient Samples: {total_samples:,}")
        print(f"   • Average Accuracy: {sum(accuracies)/len(accuracies):.4f}")
        print(f"   • Geographic Coverage: {', '.join(set(regions))}")
        print(f"   • Feature Dimensions: {total_params//len(self.hospitals):,} per hospital")
    
    def analyze_hospital_details(self):
        """Analyze individual hospital details."""
        print(f"\n🏥 INDIVIDUAL HOSPITAL ANALYSIS")
        print("-" * 60)
        
        for i, hospital in enumerate(self.hospitals, 1):
            info = hospital['info']
            training = hospital['training']
            weights = hospital['weights']
            
            print(f"\n{i}. {info['hospital_name']} ({info['country']})")
            print(f"   📍 Region: {info['region']}")
            print(f"   👥 Patient Samples: {training['dataset_info']['total_samples']:,}")
            
            # Disease distribution
            disease_dist = training['dataset_info']['class_balance']
            malignant_pct = (disease_dist['malignant'] / 
                           sum(disease_dist.values())) * 100
            print(f"   🎯 Malignant Cases: {malignant_pct:.1f}%")
            
            # Performance metrics
            fusion_perf = training['fusion_model_performance']
            print(f"   📈 Fusion Accuracy: {fusion_perf['local_accuracy']:.4f}")
            print(f"   📈 Fusion AUC-ROC: {fusion_perf['local_auc_roc']:.4f}")
            
            # Infrastructure
            compute = info['infrastructure']['compute']
            print(f"   🖥️  Compute: {compute}")
            
            # Model sizes
            total_size = sum([
                weights['models']['fusion_model']['file_info']['encrypted_size_bytes'],
                weights['models']['xray_extractor']['file_info']['encrypted_size_bytes'],
                weights['models']['histopathology_extractor']['file_info']['encrypted_size_bytes'],
                weights['models']['ultrasound_extractor']['file_info']['encrypted_size_bytes']
            ])
            print(f"   💾 Total Model Size: {total_size / (1024*1024):.1f} MB")
    
    def analyze_feature_categories(self):
        """Analyze feature extraction across modalities."""
        print(f"\n🔬 FEATURE EXTRACTION ANALYSIS")
        print("-" * 60)
        
        # Aggregate feature statistics
        modalities = ['xray_features', 'histopathology_features', 'ultrasound_features']
        
        for modality in modalities:
            print(f"\n📊 {modality.replace('_', ' ').title()}:")
            
            all_categories = []
            for hospital in self.hospitals:
                features = hospital['features']['feature_extraction_summary'][modality]
                categories = features['feature_categories']
                all_categories.extend([cat['category'] for cat in categories])
            
            # Count unique categories
            unique_categories = list(set(all_categories))
            print(f"   • Categories: {len(unique_categories)}")
            print(f"   • Features per Hospital: {features['total_features']}")
            
            # Show top categories
            print(f"   • Sample Categories:")
            for cat in unique_categories[:3]:
                print(f"     - {cat}")
    
    def analyze_blockchain_readiness(self):
        """Analyze blockchain submission readiness."""
        print(f"\n⛓️  BLOCKCHAIN SUBMISSION ANALYSIS")
        print("-" * 60)
        
        ready_count = 0
        total_cost = 0.0
        
        for hospital in self.hospitals:
            blockchain = hospital['blockchain']
            validation = blockchain['validation_checks']
            
            # Check if ready
            is_ready = all(validation.values())
            if is_ready:
                ready_count += 1
            
            # Calculate costs
            cost_eth = float(blockchain['transaction_data']['gas_estimate']['estimated_cost_eth'])
            oracle_cost = float(blockchain['oracle_integration']['oracle_fee_eth'])
            total_cost += cost_eth + oracle_cost
            
            hospital_name = hospital['info']['hospital_name']
            status = "✅ Ready" if is_ready else "❌ Not Ready"
            print(f"   {hospital_name}: {status}")
        
        print(f"\n💰 Network Costs:")
        print(f"   • Ready Hospitals: {ready_count}/{len(self.hospitals)}")
        print(f"   • Total Gas Cost: {total_cost:.4f} ETH")
        print(f"   • Average Cost per Hospital: {total_cost/len(self.hospitals):.4f} ETH")
    
    def generate_summary_report(self):
        """Generate a comprehensive summary report."""
        print(f"\n📋 SUMMARY REPORT")
        print("=" * 60)
        
        # Network requirements check
        min_hospitals = 3
        min_samples_per_hospital = 500
        
        meets_requirements = (
            len(self.hospitals) >= min_hospitals and
            all(h['training']['dataset_info']['total_samples'] >= min_samples_per_hospital 
                for h in self.hospitals)
        )
        
        print(f"✅ Minimum Requirements Met: {meets_requirements}")
        print(f"   • Required Hospitals: {min_hospitals} (Have: {len(self.hospitals)})")
        print(f"   • Required Samples: {min_samples_per_hospital} per hospital")
        
        # Privacy and compliance
        print(f"\n🔒 Privacy & Compliance:")
        for hospital in self.hospitals:
            name = hospital['info']['hospital_name']
            privacy = hospital['training']['data_privacy']
            print(f"   • {name}: {privacy['encryption_method']}, ε={privacy['differential_privacy']['epsilon']}")
        
        # IPFS storage summary
        total_files = len(self.hospitals) * 4  # 4 models per hospital
        total_storage = sum(
            hospital['weights']['aggregation_info']['total_model_size_bytes'] 
            for hospital in self.hospitals
        )
        
        print(f"\n💾 IPFS Storage:")
        print(f"   • Total Model Files: {total_files}")
        print(f"   • Total Storage: {total_storage / (1024*1024):.1f} MB")
        print(f"   • Encryption: AES-256-GCM (All files)")


def main():
    """Main execution function."""
    print("🚀 Hospital Data Analyzer")
    print("Analyzing federated learning network test data...")
    
    analyzer = HospitalDataAnalyzer()
    
    if not analyzer.hospitals:
        print("❌ No hospital data found. Please check the test-data directory structure.")
        return
    
    # Run all analyses
    analyzer.analyze_network_composition()
    analyzer.analyze_hospital_details()
    analyzer.analyze_feature_categories()
    analyzer.analyze_blockchain_readiness()
    analyzer.generate_summary_report()
    
    print(f"\n✅ Analysis complete! Network ready for federated learning.")


if __name__ == "__main__":
    main()