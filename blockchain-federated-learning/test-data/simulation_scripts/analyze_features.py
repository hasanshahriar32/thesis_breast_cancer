#!/usr/bin/env python3
"""
Feature Analysis Script

This script analyzes the 1,280-dimensional feature space extracted from
histopathology imaging data across the federated learning network.

Usage:
    python analyze_features.py
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any
import statistics


class FeatureAnalyzer:
    """Analyzes feature extraction across the federated learning network."""
    
    def __init__(self, test_data_dir: str = "../"):
        self.test_data_dir = Path(test_data_dir)
        self.feature_data = []
        
    def load_feature_data(self):
        """Load feature data from all hospitals."""
        hospital_dirs = [
            "hospital1-boston",
            "hospital2-london", 
            "hospital3-tokyo"
        ]
        
        for hospital_dir in hospital_dirs:
            features_path = self.test_data_dir / hospital_dir / "features_summary.json"
            if features_path.exists():
                with open(features_path, 'r') as f:
                    feature_data = json.load(f)
                    self.feature_data.append({
                        'hospital_id': feature_data['hospital_id'],
                        'features': feature_data['feature_extraction_summary'],
                        'feature_space': feature_data['feature_space'],
                        'abnormality': feature_data['abnormality_detection']
                    })
                    print(f"\u2705 Loaded features for {feature_data['hospital_id']}")
            else:
                print(f"\u274c Features file not found: {features_path}")
    
    def analyze_feature_dimensions(self):
        """Analyze the dimensionality of the feature space."""
        print("\n" + "="*60)
        print("\U0001f52c FEATURE SPACE ANALYSIS")
        print("="*60)
        
        if not self.feature_data:
            print("\u274c No feature data loaded")
            return
        
        histo = self.feature_data[0]['features']['histopathology_features']
        dimensions = histo['total_features']
        categories = len(histo['feature_categories'])
        
        print(f"\n\U0001f4ca Feature Dimensions:")
        print(f"   \u2022 Modality: Histopathology (H&E Staining)")
        print(f"   \u2022 Extraction Model: {histo.get('extraction_model', 'EfficientNet-B0 + Coordinate Attention')}")
        print(f"   \u2022 Framework: {histo.get('framework', 'PyTorch')}")
        print(f"   \u2022 Dimensions: {dimensions:,}")
        print(f"   \u2022 Feature Categories: {categories}")
        print(f"   \u2022 Features per Category: ~{dimensions//categories}")
    
    def analyze_feature_categories(self):
        """Analyze feature categories across hospitals."""
        print(f"\n\U0001f4cb FEATURE CATEGORY ANALYSIS")
        print("-" * 60)
        
        print(f"\n\U0001f50d Histopathology Feature Categories:")
        
        categories = self.feature_data[0]['features']['histopathology_features']['feature_categories']
        
        for i, category in enumerate(categories, 1):
            print(f"   {i:2d}. {category['category']}")
            print(f"       \u2022 Features: {category['feature_indices'][0]}-{category['feature_indices'][1]}")
            print(f"       \u2022 Key Features: {', '.join(category['key_features'][:2])}...")
            print(f"       \u2022 Abnormality Threshold: {category['statistics']['abnormality_threshold']}")
    
    def analyze_discriminative_features(self):
        """Analyze the most discriminative features across hospitals."""
        print(f"\n\U0001f3af TOP DISCRIMINATIVE FEATURES")
        print("-" * 60)
        
        all_features = []
        for hospital in self.feature_data:
            features = hospital['features']['histopathology_features']['top_discriminative_features']
            for feature in features:
                all_features.append((
                    feature['name'],
                    feature['importance_score'],
                    hospital['hospital_id']
                ))
        
        all_features.sort(key=lambda x: x[1], reverse=True)
        
        print(f"\n\u2b50 Top Histopathology Features (across all hospitals):")
        for i, (name, score, hospital) in enumerate(all_features[:10], 1):
            print(f"   {i}. {name}")
            print(f"      \u2022 Importance: {score:.3f}")
            print(f"      \u2022 Hospital: {hospital}")
    
    def analyze_feature_statistics(self):
        """Analyze feature statistics across hospitals."""
        print(f"\n\U0001f4c8 FEATURE STATISTICS COMPARISON")
        print("-" * 60)
        
        print(f"\n\U0001f4ca Histopathology Feature Statistics:")
        
        stats_data = {
            'mean': [],
            'std': []
        }
        
        for hospital in self.feature_data:
            feature_stats = hospital['features']['histopathology_features']['feature_categories'][0]['statistics']
            stats_data['mean'].append(feature_stats['mean_activation'])
            stats_data['std'].append(feature_stats['std_activation'])
        
        print(f"   \u2022 Mean Activation:")
        print(f"     - Average: {statistics.mean(stats_data['mean']):.3f}")
        print(f"     - Range: {min(stats_data['mean']):.3f} - {max(stats_data['mean']):.3f}")
        
        print(f"   \u2022 Standard Deviation:")
        print(f"     - Average: {statistics.mean(stats_data['std']):.3f}")
        print(f"     - Range: {min(stats_data['std']):.3f} - {max(stats_data['std']):.3f}")
    
    def analyze_abnormality_detection(self):
        """Analyze abnormality detection capabilities."""
        print(f"\n\U0001f6a8 ABNORMALITY DETECTION ANALYSIS")
        print("-" * 60)
        
        total_abnormal = 0
        total_normal = 0
        
        for hospital in self.feature_data:
            abnormality = hospital['abnormality']
            hospital_id = hospital['hospital_id']
            
            abnormal = abnormality['total_abnormal_samples']
            normal = abnormality['total_normal_samples']
            
            total_abnormal += abnormal
            total_normal += normal
            
            print(f"\n\U0001f3e5 {hospital_id}:")
            print(f"   \u2022 Abnormal Samples: {abnormal:,}")
            print(f"   \u2022 Normal Samples: {normal:,}")
            print(f"   \u2022 Abnormality Rate: {abnormal/(abnormal+normal)*100:.1f}%")
            
            dist = abnormality['abnormality_distribution']
            print(f"   \u2022 High Confidence Malignant: {dist['high_confidence_malignant']}")
            print(f"   \u2022 High Confidence Benign: {dist['high_confidence_benign']}")
        
        total_samples = total_abnormal + total_normal
        network_abnormality_rate = (total_abnormal / total_samples) * 100
        
        print(f"\n\U0001f310 Network Summary:")
        print(f"   \u2022 Total Samples: {total_samples:,}")
        print(f"   \u2022 Total Abnormal: {total_abnormal:,} ({network_abnormality_rate:.1f}%)")
        print(f"   \u2022 Total Normal: {total_normal:,} ({100-network_abnormality_rate:.1f}%)")
    
    def generate_feature_report(self):
        """Generate a comprehensive feature analysis report."""
        print(f"\n\U0001f4cb FEATURE ANALYSIS SUMMARY")
        print("=" * 60)
        
        if not self.feature_data:
            print("\u274c No feature data available for analysis")
            return
        
        total_hospitals = len(self.feature_data)
        total_dimensions = 1280
        
        print(f"\U0001f52c Feature Space Overview:")
        print(f"   \u2022 Participating Hospitals: {total_hospitals}")
        print(f"   \u2022 Feature Dimensions: {total_dimensions:,}")
        print(f"   \u2022 Imaging Modality: Histopathology (single-modality)")
        print(f"   \u2022 Extraction Model: EfficientNet-B0 + Coordinate Attention")
        print(f"   \u2022 Framework: PyTorch")
        print(f"   \u2022 Feature Categories: 12")
        
        print(f"\n\u2b50 Network-Wide Top Features:")
        
        all_important_features = []
        for hospital in self.feature_data:
            features = hospital['features']['histopathology_features']['top_discriminative_features']
            for feature in features[:3]:
                all_important_features.append((
                    feature['name'],
                    feature['importance_score']
                ))
        
        all_important_features.sort(key=lambda x: x[1], reverse=True)
        seen = set()
        rank = 0
        for name, score in all_important_features:
            if name not in seen:
                seen.add(name)
                rank += 1
                print(f"   {rank:2d}. {name} - {score:.3f}")
                if rank >= 5:
                    break
        
        print(f"\n\u2705 Feature analysis complete!")
        print(f"   The network has rich histopathology feature representations")
        print(f"   suitable for robust federated learning.")


def main():
    """Main execution function."""
    print("\U0001f52c Feature Space Analyzer")
    print("Analyzing 1,280-dimensional histopathology feature extraction...")
    
    analyzer = FeatureAnalyzer()
    analyzer.load_feature_data()
    
    if not analyzer.feature_data:
        print("\u274c No feature data found. Please check the test-data directory structure.")
        return
    
    analyzer.analyze_feature_dimensions()
    analyzer.analyze_feature_categories()
    analyzer.analyze_discriminative_features()
    analyzer.analyze_feature_statistics()
    analyzer.analyze_abnormality_detection()
    analyzer.generate_feature_report()


if __name__ == "__main__":
    main()
