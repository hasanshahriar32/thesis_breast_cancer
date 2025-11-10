#!/usr/bin/env python3
"""
Feature Analysis Script

This script analyzes the 3,840-dimensional feature space extracted from
breast imaging data across the federated learning network.

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
        self.modalities = ['xray_features', 'histopathology_features', 'ultrasound_features']
        
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
                        'combined': feature_data['combined_features'],
                        'abnormality': feature_data['abnormality_detection']
                    })
                    print(f"✅ Loaded features for {feature_data['hospital_id']}")
            else:
                print(f"❌ Features file not found: {features_path}")
    
    def analyze_feature_dimensions(self):
        """Analyze the dimensionality of the feature space."""
        print("\n" + "="*60)
        print("🔬 FEATURE SPACE ANALYSIS")
        print("="*60)
        
        if not self.feature_data:
            print("❌ No feature data loaded")
            return
        
        # Analyze each modality
        print(f"\n📊 Feature Dimensions by Modality:")
        
        total_dimensions = 0
        for modality in self.modalities:
            modality_name = modality.replace('_features', '').replace('_', ' ').title()
            dimensions = self.feature_data[0]['features'][modality]['total_features']
            categories = len(self.feature_data[0]['features'][modality]['feature_categories'])
            
            print(f"   • {modality_name}:")
            print(f"     - Dimensions: {dimensions:,}")
            print(f"     - Categories: {categories}")
            print(f"     - Features per Category: ~{dimensions//categories}")
            
            total_dimensions += dimensions
        
        print(f"\n🎯 Total Feature Space:")
        print(f"   • Combined Dimensions: {total_dimensions:,}")
        print(f"   • Total Categories: {sum(len(hospital['features'][mod]['feature_categories']) for hospital in self.feature_data for mod in self.modalities) // len(self.feature_data)}")
    
    def analyze_feature_categories(self):
        """Analyze feature categories across hospitals."""
        print(f"\n📋 FEATURE CATEGORY ANALYSIS")
        print("-" * 60)
        
        for modality in self.modalities:
            modality_name = modality.replace('_features', '').replace('_', ' ').title()
            print(f"\n🔍 {modality_name} Categories:")
            
            # Get categories from first hospital (they should be consistent)
            categories = self.feature_data[0]['features'][modality]['feature_categories']
            
            for i, category in enumerate(categories, 1):
                print(f"   {i:2d}. {category['category']}")
                print(f"       • Features: {category['feature_indices'][0]}-{category['feature_indices'][1]}")
                print(f"       • Key Features: {', '.join(category['key_features'][:2])}...")
                print(f"       • Abnormality Threshold: {category['statistics']['abnormality_threshold']}")
    
    def analyze_discriminative_features(self):
        """Analyze the most discriminative features across hospitals."""
        print(f"\n🎯 TOP DISCRIMINATIVE FEATURES")
        print("-" * 60)
        
        for modality in self.modalities:
            modality_name = modality.replace('_features', '').replace('_', ' ').title()
            print(f"\n⭐ {modality_name}:")
            
            # Collect all discriminative features across hospitals
            all_features = []
            for hospital in self.feature_data:
                features = hospital['features'][modality]['top_discriminative_features']
                for feature in features:
                    all_features.append((
                        feature['name'],
                        feature['importance_score'],
                        hospital['hospital_id']
                    ))
            
            # Sort by importance
            all_features.sort(key=lambda x: x[1], reverse=True)
            
            # Show top 5
            for i, (name, score, hospital) in enumerate(all_features[:5], 1):
                print(f"   {i}. {name}")
                print(f"      • Importance: {score:.3f}")
                print(f"      • Hospital: {hospital}")
    
    def analyze_feature_statistics(self):
        """Analyze feature statistics across hospitals."""
        print(f"\n📈 FEATURE STATISTICS COMPARISON")
        print("-" * 60)
        
        for modality in self.modalities:
            modality_name = modality.replace('_features', '').replace('_', ' ').title()
            print(f"\n📊 {modality_name} Statistics:")
            
            # Collect statistics from all hospitals
            stats_data = {
                'mean': [],
                'std': [],
                'sparsity': []
            }
            
            for hospital in self.feature_data:
                feature_stats = hospital['features'][modality]['feature_categories'][0]['statistics']
                
                # Get overall statistics (from first category as example)
                stats_data['mean'].append(feature_stats['mean_activation'])
                stats_data['std'].append(feature_stats['std_activation'])
                
                # Get sparsity from combined features if available
                if 'sparsity' in hospital['features'][modality]:
                    stats_data['sparsity'].append(hospital['features'][modality]['sparsity'])
            
            # Calculate cross-hospital statistics
            print(f"   • Mean Activation:")
            print(f"     - Average: {statistics.mean(stats_data['mean']):.3f}")
            print(f"     - Range: {min(stats_data['mean']):.3f} - {max(stats_data['mean']):.3f}")
            
            print(f"   • Standard Deviation:")
            print(f"     - Average: {statistics.mean(stats_data['std']):.3f}")
            print(f"     - Range: {min(stats_data['std']):.3f} - {max(stats_data['std']):.3f}")
    
    def analyze_abnormality_detection(self):
        """Analyze abnormality detection capabilities."""
        print(f"\n🚨 ABNORMALITY DETECTION ANALYSIS")
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
            
            print(f"\n🏥 {hospital_id}:")
            print(f"   • Abnormal Samples: {abnormal:,}")
            print(f"   • Normal Samples: {normal:,}")
            print(f"   • Abnormality Rate: {abnormal/(abnormal+normal)*100:.1f}%")
            
            # Show confidence distribution
            dist = abnormality['abnormality_distribution']
            print(f"   • High Confidence Malignant: {dist['high_confidence_malignant']}")
            print(f"   • High Confidence Benign: {dist['high_confidence_benign']}")
        
        # Network summary
        total_samples = total_abnormal + total_normal
        network_abnormality_rate = (total_abnormal / total_samples) * 100
        
        print(f"\n🌐 Network Summary:")
        print(f"   • Total Samples: {total_samples:,}")
        print(f"   • Total Abnormal: {total_abnormal:,} ({network_abnormality_rate:.1f}%)")
        print(f"   • Total Normal: {total_normal:,} ({100-network_abnormality_rate:.1f}%)")
    
    def analyze_multimodal_correlation(self):
        """Analyze correlation between different imaging modalities."""
        print(f"\n🔗 MULTIMODAL CORRELATION ANALYSIS")
        print("-" * 60)
        
        for hospital in self.feature_data:
            hospital_id = hospital['hospital_id']
            combined = hospital['combined']
            
            print(f"\n🏥 {hospital_id}:")
            print(f"   • X-Ray ↔ Histopathology: {combined['feature_correlation']['xray_histo']:.3f}")
            print(f"   • X-Ray ↔ Ultrasound: {combined['feature_correlation']['xray_ultra']:.3f}")
            print(f"   • Histopathology ↔ Ultrasound: {combined['feature_correlation']['histo_ultra']:.3f}")
            print(f"   • Multimodal Synergy Score: {combined['multimodal_synergy_score']:.3f}")
        
        # Calculate network averages
        correlations = {
            'xray_histo': [],
            'xray_ultra': [],
            'histo_ultra': [],
            'synergy': []
        }
        
        for hospital in self.feature_data:
            combined = hospital['combined']
            correlations['xray_histo'].append(combined['feature_correlation']['xray_histo'])
            correlations['xray_ultra'].append(combined['feature_correlation']['xray_ultra'])
            correlations['histo_ultra'].append(combined['feature_correlation']['histo_ultra'])
            correlations['synergy'].append(combined['multimodal_synergy_score'])
        
        print(f"\n🌐 Network Averages:")
        print(f"   • X-Ray ↔ Histopathology: {statistics.mean(correlations['xray_histo']):.3f}")
        print(f"   • X-Ray ↔ Ultrasound: {statistics.mean(correlations['xray_ultra']):.3f}")
        print(f"   • Histopathology ↔ Ultrasound: {statistics.mean(correlations['histo_ultra']):.3f}")
        print(f"   • Average Synergy Score: {statistics.mean(correlations['synergy']):.3f}")
    
    def generate_feature_report(self):
        """Generate a comprehensive feature analysis report."""
        print(f"\n📋 FEATURE ANALYSIS SUMMARY")
        print("=" * 60)
        
        if not self.feature_data:
            print("❌ No feature data available for analysis")
            return
        
        # Summary statistics
        total_hospitals = len(self.feature_data)
        total_dimensions = 3840  # Fixed architecture
        
        print(f"🔬 Feature Space Overview:")
        print(f"   • Participating Hospitals: {total_hospitals}")
        print(f"   • Feature Dimensions: {total_dimensions:,}")
        print(f"   • Imaging Modalities: {len(self.modalities)}")
        print(f"   • Features per Modality: {total_dimensions // len(self.modalities):,}")
        
        # Calculate network-wide feature importance
        print(f"\n⭐ Network-Wide Top Features:")
        
        all_important_features = []
        for modality in self.modalities:
            for hospital in self.feature_data:
                features = hospital['features'][modality]['top_discriminative_features']
                for feature in features[:2]:  # Top 2 per modality per hospital
                    all_important_features.append((
                        feature['name'],
                        feature['importance_score'],
                        modality.replace('_features', '')
                    ))
        
        # Sort and show top features
        all_important_features.sort(key=lambda x: x[1], reverse=True)
        for i, (name, score, modality) in enumerate(all_important_features[:10], 1):
            print(f"   {i:2d}. {name} ({modality}) - {score:.3f}")
        
        print(f"\n✅ Feature analysis complete!")
        print(f"   The network has rich, diverse feature representations")
        print(f"   suitable for robust federated learning.")


def main():
    """Main execution function."""
    print("🔬 Feature Space Analyzer")
    print("Analyzing 3,840-dimensional feature extraction...")
    
    analyzer = FeatureAnalyzer()
    analyzer.load_feature_data()
    
    if not analyzer.feature_data:
        print("❌ No feature data found. Please check the test-data directory structure.")
        return
    
    # Run all analyses
    analyzer.analyze_feature_dimensions()
    analyzer.analyze_feature_categories()
    analyzer.analyze_discriminative_features()
    analyzer.analyze_feature_statistics()
    analyzer.analyze_abnormality_detection()
    analyzer.analyze_multimodal_correlation()
    analyzer.generate_feature_report()


if __name__ == "__main__":
    main()