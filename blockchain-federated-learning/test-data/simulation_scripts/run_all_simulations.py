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
        print(f"\U0001f680 Running {script_name}")
        print(f"{'='*60}")
        
        result = subprocess.run([sys.executable, script_name], 
                              capture_output=False, 
                              text=True)
        
        if result.returncode == 0:
            print(f"\u2705 {script_name} completed successfully")
            return True
        else:
            print(f"\u274c {script_name} failed with return code {result.returncode}")
            return False
            
    except Exception as e:
        print(f"\u274c Error running {script_name}: {e}")
        return False


def main():
    """Run all simulation scripts in order."""
    print("\U0001f3af Federated Learning Test Data Simulation Suite")
    print("Running comprehensive analysis of the blockchain federated learning network...")
    
    scripts = [
        "verify_requirements.py",
        "read_hospital_data.py", 
        "analyze_features.py",
        "simulate_blockchain_submission.py"
    ]
    
    missing_scripts = []
    for script in scripts:
        if not Path(script).exists():
            missing_scripts.append(script)
    
    if missing_scripts:
        print(f"\u274c Missing simulation scripts: {missing_scripts}")
        print("Please ensure all scripts are in the current directory.")
        return False
    
    successful_runs = 0
    
    for script in scripts:
        success = run_script(script)
        if success:
            successful_runs += 1
        else:
            print(f"\n\u26a0\ufe0f  {script} failed - continuing with remaining scripts...")
    
    print(f"\n{'='*60}")
    print(f"\U0001f4cb SIMULATION SUITE SUMMARY")
    print(f"{'='*60}")
    
    print(f"\u2705 Scripts completed successfully: {successful_runs}/{len(scripts)}")
    
    if successful_runs == len(scripts):
        print(f"\U0001f389 All simulations completed successfully!")
        print(f"\U0001f4ca The federated learning network test data has been fully analyzed.")
        print(f"\U0001f680 You can now proceed with blockchain deployment and testing.")
    else:
        failed_count = len(scripts) - successful_runs
        print(f"\u26a0\ufe0f  {failed_count} script(s) failed.")
        print(f"\U0001f527 Please check the error messages above and fix any issues.")
    
    print(f"\n\U0001f4c1 Test Data Location: ../")
    print(f"\U0001f4dd Documentation: ../README.md")
    print(f"\U0001f517 Smart Contract: ../../contracts/FederatedModelRegistry.sol")
    
    return successful_runs == len(scripts)


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
