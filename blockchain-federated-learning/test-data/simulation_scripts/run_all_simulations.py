#!/usr/bin/env python3
"""
Simulation Scripts Runner

This script provides a convenient way to run all simulation scripts
and generate a comprehensive analysis of the test data.

Usage:
    python run_all_simulations.py
"""

import subprocess
import sys
from pathlib import Path


def run_script(script_name: str) -> bool:
    """Run a simulation script and return success status."""
    try:
        print(f"\n{'='*60}")
        print(f"🚀 Running {script_name}")
        print(f"{'='*60}")
        
        result = subprocess.run([sys.executable, script_name], 
                              capture_output=False, 
                              text=True)
        
        if result.returncode == 0:
            print(f"✅ {script_name} completed successfully")
            return True
        else:
            print(f"❌ {script_name} failed with return code {result.returncode}")
            return False
            
    except Exception as e:
        print(f"❌ Error running {script_name}: {e}")
        return False


def main():
    """Run all simulation scripts in order."""
    print("🎯 Federated Learning Test Data Simulation Suite")
    print("Running comprehensive analysis of the blockchain federated learning network...")
    
    # List of scripts to run in order
    scripts = [
        "verify_requirements.py",
        "read_hospital_data.py", 
        "analyze_features.py",
        "simulate_blockchain_submission.py"
    ]
    
    # Check that all scripts exist
    missing_scripts = []
    for script in scripts:
        if not Path(script).exists():
            missing_scripts.append(script)
    
    if missing_scripts:
        print(f"❌ Missing simulation scripts: {missing_scripts}")
        print("Please ensure all scripts are in the current directory.")
        return False
    
    # Run all scripts
    successful_runs = 0
    
    for script in scripts:
        success = run_script(script)
        if success:
            successful_runs += 1
        else:
            print(f"\n⚠️  {script} failed - continuing with remaining scripts...")
    
    # Final summary
    print(f"\n{'='*60}")
    print(f"📋 SIMULATION SUITE SUMMARY")
    print(f"{'='*60}")
    
    print(f"✅ Scripts completed successfully: {successful_runs}/{len(scripts)}")
    
    if successful_runs == len(scripts):
        print(f"🎉 All simulations completed successfully!")
        print(f"📊 The federated learning network test data has been fully analyzed.")
        print(f"🚀 You can now proceed with blockchain deployment and testing.")
    else:
        failed_count = len(scripts) - successful_runs
        print(f"⚠️  {failed_count} script(s) failed.")
        print(f"🔧 Please check the error messages above and fix any issues.")
    
    print(f"\n📁 Test Data Location: ../")
    print(f"📝 Documentation: ../README.md")
    print(f"🔗 Smart Contract: ../../contracts/FederatedModelRegistry.sol")
    
    return successful_runs == len(scripts)


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)