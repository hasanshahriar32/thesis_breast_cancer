#!/usr/bin/env python3
"""
Requirements Verification Script

This script verifies that all minimum requirements are met for the
federated learning network to operate according to the smart contract rules.

Usage:
    python verify_requirements.py
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any, Tuple


class RequirementsVerifier:
    """Verifies federated learning network requirements."""
    
    def __init__(self, test_data_dir: str = "../"):
        self.test_data_dir = Path(test_data_dir)
        
        # Smart contract requirements
        self.MIN_HOSPITALS = 3
        self.MIN_SAMPLES_PER_HOSPITAL = 500
        self.MAX_ACCURACY = 1.0  # 100%
        
        # Network requirements
        self.REQUIRED_MODALITIES = 3
        self.REQUIRED_MODELS = 4  # fusion + 3 extractors
        self.FEATURE_DIMENSIONS = 3840
        
        # Compliance requirements
        self.REQUIRED_ENCRYPTION = "AES-256-GCM"
        
    def load_all_hospital_data(self) -> List[Dict]:
        """Load complete data from all hospitals."""
        hospitals = []
        
        hospital_dirs = [
            "hospital1-boston",
            "hospital2-london", 
            "hospital3-tokyo"
        ]
        
        for hospital_dir in hospital_dirs:
            hospital_path = self.test_data_dir / hospital_dir
            if hospital_path.exists():
                hospital_data = self.load_hospital_complete_data(hospital_path)
                if hospital_data:
                    hospitals.append(hospital_data)
        
        return hospitals
    
    def load_hospital_complete_data(self, hospital_path: Path) -> Dict[str, Any]:
        """Load all data files for a single hospital."""
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
                    print(f"❌ Missing file: {file_path}")
                    return None
            
            return hospital_data
            
        except Exception as e:
            print(f"❌ Error loading data from {hospital_path}: {e}")
            return None
    
    def verify_minimum_hospitals(self, hospitals: List[Dict]) -> Tuple[bool, str]:
        """Verify minimum number of participating hospitals."""
        count = len(hospitals)
        
        if count >= self.MIN_HOSPITALS:
            return True, f"✅ Hospital count: {count}/{self.MIN_HOSPITALS} (PASS)"
        else:
            return False, f"❌ Hospital count: {count}/{self.MIN_HOSPITALS} (FAIL)"
    
    def verify_sample_requirements(self, hospitals: List[Dict]) -> Tuple[bool, str]:
        """Verify minimum samples per hospital."""
        results = []
        all_pass = True
        
        for hospital in hospitals:
            hospital_id = hospital['info']['hospital_id']
            samples = hospital['training']['dataset_info']['total_samples']
            
            if samples >= self.MIN_SAMPLES_PER_HOSPITAL:
                status = "PASS"
            else:
                status = "FAIL"
                all_pass = False
            
            results.append(f"   • {hospital_id}: {samples:,} samples ({status})")
        
        result_text = f"{'✅' if all_pass else '❌'} Sample Requirements:\n" + "\n".join(results)
        return all_pass, result_text
    
    def verify_accuracy_bounds(self, hospitals: List[Dict]) -> Tuple[bool, str]:
        """Verify accuracy is within valid bounds."""
        results = []
        all_pass = True
        
        for hospital in hospitals:
            hospital_id = hospital['info']['hospital_id']
            accuracy = hospital['training']['fusion_model_performance']['local_accuracy']
            
            if 0.0 <= accuracy <= self.MAX_ACCURACY:
                status = "PASS"
            else:
                status = "FAIL"
                all_pass = False
            
            results.append(f"   • {hospital_id}: {accuracy:.4f} ({status})")
        
        result_text = f"{'✅' if all_pass else '❌'} Accuracy Requirements:\n" + "\n".join(results)
        return all_pass, result_text
    
    def verify_model_completeness(self, hospitals: List[Dict]) -> Tuple[bool, str]:
        """Verify all required models are present."""
        required_models = ['fusion_model', 'xray_extractor', 'histopathology_extractor', 'ultrasound_extractor']
        results = []
        all_pass = True
        
        for hospital in hospitals:
            hospital_id = hospital['info']['hospital_id']
            models = hospital['weights']['models']
            
            missing_models = []
            for model in required_models:
                if model not in models:
                    missing_models.append(model)
            
            if not missing_models:
                status = "PASS"
                results.append(f"   • {hospital_id}: All {len(required_models)} models present ({status})")
            else:
                status = "FAIL"
                all_pass = False
                results.append(f"   • {hospital_id}: Missing {missing_models} ({status})")
        
        result_text = f"{'✅' if all_pass else '❌'} Model Completeness:\n" + "\n".join(results)
        return all_pass, result_text
    
    def verify_feature_dimensions(self, hospitals: List[Dict]) -> Tuple[bool, str]:
        """Verify feature dimensions are correct."""
        results = []
        all_pass = True
        
        for hospital in hospitals:
            hospital_id = hospital['info']['hospital_id']
            combined_features = hospital['features']['combined_features']
            total_dims = combined_features['total_dimensions']
            
            if total_dims == self.FEATURE_DIMENSIONS:
                status = "PASS"
            else:
                status = "FAIL"
                all_pass = False
            
            results.append(f"   • {hospital_id}: {total_dims} dimensions ({status})")
        
        result_text = f"{'✅' if all_pass else '❌'} Feature Dimensions:\n" + "\n".join(results)
        return all_pass, result_text
    
    def verify_encryption_standards(self, hospitals: List[Dict]) -> Tuple[bool, str]:
        """Verify encryption meets requirements."""
        results = []
        all_pass = True
        
        for hospital in hospitals:
            hospital_id = hospital['info']['hospital_id']
            
            # Check model encryption
            models = hospital['weights']['models']
            hospital_pass = True
            
            for model_name, model_data in models.items():
                encryption = model_data['encryption']['algorithm']
                if encryption != self.REQUIRED_ENCRYPTION:
                    hospital_pass = False
                    break
            
            if hospital_pass:
                status = "PASS"
            else:
                status = "FAIL"
                all_pass = False
            
            results.append(f"   • {hospital_id}: {self.REQUIRED_ENCRYPTION} ({status})")
        
        result_text = f"{'✅' if all_pass else '❌'} Encryption Standards:\n" + "\n".join(results)
        return all_pass, result_text
    
    def verify_ipfs_integration(self, hospitals: List[Dict]) -> Tuple[bool, str]:
        """Verify IPFS CIDs are present and valid format."""
        results = []
        all_pass = True
        
        for hospital in hospitals:
            hospital_id = hospital['info']['hospital_id']
            uploads = hospital['blockchain']['ipfs_uploads']
            
            valid_cids = 0
            for upload in uploads:
                cid = upload['ipfs_cid']
                # Basic CID validation (should start with Qm and be 46 chars)
                if cid.startswith('Qm') and len(cid) == 46:
                    valid_cids += 1
            
            if valid_cids == self.REQUIRED_MODELS:
                status = "PASS"
            else:
                status = "FAIL"
                all_pass = False
            
            results.append(f"   • {hospital_id}: {valid_cids}/{self.REQUIRED_MODELS} valid CIDs ({status})")
        
        result_text = f"{'✅' if all_pass else '❌'} IPFS Integration:\n" + "\n".join(results)
        return all_pass, result_text
    
    def verify_blockchain_readiness(self, hospitals: List[Dict]) -> Tuple[bool, str]:
        """Verify blockchain submission readiness."""
        results = []
        all_pass = True
        
        for hospital in hospitals:
            hospital_id = hospital['info']['hospital_id']
            validation = hospital['blockchain']['validation_checks']
            
            failed_checks = [k for k, v in validation.items() if not v]
            
            if not failed_checks:
                status = "PASS"
            else:
                status = f"FAIL ({len(failed_checks)} issues)"
                all_pass = False
            
            results.append(f"   • {hospital_id}: {status}")
        
        result_text = f"{'✅' if all_pass else '❌'} Blockchain Readiness:\n" + "\n".join(results)
        return all_pass, result_text
    
    def verify_compliance_requirements(self, hospitals: List[Dict]) -> Tuple[bool, str]:
        """Verify regulatory compliance."""
        results = []
        all_pass = True
        
        compliance_map = {
            'HOSP_001_BOSTON': 'HIPAA',
            'HOSP_002_LONDON': 'GDPR',
            'HOSP_003_TOKYO': 'JMIP'
        }
        
        for hospital in hospitals:
            hospital_id = hospital['info']['hospital_id']
            expected_compliance = compliance_map.get(hospital_id, 'Unknown')
            
            # Check privacy settings
            privacy = hospital['training']['data_privacy']
            phi_removed = privacy['phi_removed']
            differential_privacy = privacy['differential_privacy']['enabled']
            
            if phi_removed and differential_privacy:
                status = "PASS"
            else:
                status = "FAIL"
                all_pass = False
            
            results.append(f"   • {hospital_id}: {expected_compliance} compliant ({status})")
        
        result_text = f"{'✅' if all_pass else '❌'} Compliance Requirements:\n" + "\n".join(results)
        return all_pass, result_text
    
    def calculate_network_statistics(self, hospitals: List[Dict]) -> Dict[str, Any]:
        """Calculate overall network statistics."""
        total_samples = sum(h['training']['dataset_info']['total_samples'] for h in hospitals)
        accuracies = [h['training']['fusion_model_performance']['local_accuracy'] for h in hospitals]
        avg_accuracy = sum(accuracies) / len(accuracies)
        
        regions = list(set(h['info']['region'] for h in hospitals))
        countries = list(set(h['info']['country'] for h in hospitals))
        
        total_model_size = sum(
            h['weights']['aggregation_info']['total_model_size_bytes'] for h in hospitals
        )
        
        return {
            'hospitals': len(hospitals),
            'total_samples': total_samples,
            'avg_accuracy': avg_accuracy,
            'regions': regions,
            'countries': countries,
            'total_model_size_mb': total_model_size / (1024 * 1024),
            'feature_dimensions': self.FEATURE_DIMENSIONS
        }
    
    def run_comprehensive_verification(self):
        """Run all verification tests."""
        print("🔍 FEDERATED LEARNING REQUIREMENTS VERIFICATION")
        print("=" * 60)
        
        hospitals = self.load_all_hospital_data()
        
        if not hospitals:
            print("❌ No hospital data found. Cannot verify requirements.")
            return False
        
        print(f"📊 Loaded data from {len(hospitals)} hospitals\n")
        
        # Run all verification tests
        tests = [
            ("Minimum Hospitals", self.verify_minimum_hospitals),
            ("Sample Requirements", self.verify_sample_requirements),
            ("Accuracy Bounds", self.verify_accuracy_bounds),
            ("Model Completeness", self.verify_model_completeness),
            ("Feature Dimensions", self.verify_feature_dimensions),
            ("Encryption Standards", self.verify_encryption_standards),
            ("IPFS Integration", self.verify_ipfs_integration),
            ("Blockchain Readiness", self.verify_blockchain_readiness),
            ("Compliance Requirements", self.verify_compliance_requirements)
        ]
        
        all_passed = True
        results = []
        
        for test_name, test_func in tests:
            passed, message = test_func(hospitals)
            results.append((test_name, passed, message))
            
            if not passed:
                all_passed = False
        
        # Display results
        print("📋 VERIFICATION RESULTS:")
        print("-" * 40)
        
        for test_name, passed, message in results:
            print(f"\n{message}")
        
        # Network statistics
        print(f"\n📊 NETWORK STATISTICS:")
        print("-" * 40)
        
        stats = self.calculate_network_statistics(hospitals)
        print(f"✅ Participating Hospitals: {stats['hospitals']}")
        print(f"✅ Total Patient Samples: {stats['total_samples']:,}")
        print(f"✅ Average Accuracy: {stats['avg_accuracy']:.4f}")
        print(f"✅ Geographic Coverage: {', '.join(stats['regions'])}")
        print(f"✅ Countries: {', '.join(stats['countries'])}")
        print(f"✅ Total Model Storage: {stats['total_model_size_mb']:.1f} MB")
        print(f"✅ Feature Dimensions: {stats['feature_dimensions']:,}")
        
        # Final verdict
        print(f"\n🎯 FINAL VERDICT:")
        print("-" * 40)
        
        if all_passed:
            print("✅ ALL REQUIREMENTS VERIFIED!")
            print("🚀 Network is ready for federated learning operations.")
            print("📝 Smart contract deployment and model training can proceed.")
        else:
            failed_tests = [name for name, passed, _ in results if not passed]
            print("❌ VERIFICATION FAILED!")
            print(f"🔧 Failed tests: {', '.join(failed_tests)}")
            print("🛠️  Please address the issues before proceeding.")
        
        return all_passed


def main():
    """Main execution function."""
    print("🔍 Federated Learning Requirements Verifier")
    print("Checking network compliance with smart contract requirements...\n")
    
    verifier = RequirementsVerifier()
    success = verifier.run_comprehensive_verification()
    
    if success:
        print(f"\n✅ Verification complete - All requirements met!")
    else:
        print(f"\n❌ Verification failed - Please fix issues and retry.")
    
    return success


if __name__ == "__main__":
    main()