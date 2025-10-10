#!/usr/bin/env python3
"""
Check if the Tab Agent native host is properly registered with Chrome
"""

import os
import sys
import platform
import json

def check_windows_registration():
    """Check if native host is registered on Windows"""
    try:
        import winreg
        
        # Define the registry key path
        reg_key_path = r"Software\Google\Chrome\NativeMessagingHosts\com.tabagent.host"
        
        try:
            # Open the registry key
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, reg_key_path) as key:
                # Get the default value (should be path to manifest)
                manifest_path, _ = winreg.QueryValueEx(key, '')
                
                print(f"✅ Registry entry found: {manifest_path}")
                
                # Check if manifest file exists
                if os.path.exists(manifest_path):
                    print("✅ Manifest file exists")
                    
                    # Read and validate manifest
                    with open(manifest_path, 'r') as f:
                        manifest = json.load(f)
                    
                    # Check required fields
                    required_fields = ['name', 'description', 'path', 'type', 'allowed_origins']
                    missing_fields = [field for field in required_fields if field not in manifest]
                    
                    if missing_fields:
                        print(f"❌ Missing fields in manifest: {missing_fields}")
                        return False
                    
                    print("✅ Manifest structure is valid")
                    
                    # Check extension ID
                    expected_origin = "chrome-extension://fkkeoobeahalebjpbockfedlncckobjb/"
                    if expected_origin in manifest.get('allowed_origins', []):
                        print("✅ Extension ID is correctly configured")
                    else:
                        print("❌ Extension ID is not correctly configured")
                        print(f"   Expected: {expected_origin}")
                        print(f"   Found: {manifest.get('allowed_origins', [])}")
                        return False
                    
                    # Check if executable exists
                    executable_path = manifest.get('path', '')
                    if os.path.isabs(executable_path):
                        if os.path.exists(executable_path):
                            print("✅ Native host executable exists")
                        else:
                            print("❌ Native host executable not found")
                            print(f"   Expected at: {executable_path}")
                            return False
                    else:
                        # Relative path, check relative to manifest
                        manifest_dir = os.path.dirname(manifest_path)
                        full_executable_path = os.path.join(manifest_dir, executable_path)
                        if os.path.exists(full_executable_path):
                            print("✅ Native host executable exists")
                        else:
                            print("❌ Native host executable not found")
                            print(f"   Expected at: {full_executable_path}")
                            return False
                    
                    return True
                else:
                    print("❌ Manifest file does not exist")
                    return False
                    
        except FileNotFoundError:
            print("❌ Registry entry not found")
            return False
            
    except ImportError:
        print("❌ Unable to access Windows registry (winreg module not available)")
        return False
    except Exception as e:
        print(f"❌ Error checking Windows registration: {e}")
        return False

def check_unix_registration():
    """Check if native host is registered on macOS/Linux"""
    # Determine the correct location for the manifest based on OS
    if platform.system() == "Darwin":  # macOS
        manifest_dir = os.path.expanduser("~/Library/Application Support/Google/Chrome/NativeMessagingHosts")
    else:  # Linux
        manifest_dir = os.path.expanduser("~/.config/google-chrome/NativeMessagingHosts")
    
    manifest_path = os.path.join(manifest_dir, "com.tabagent.host.json")
    
    print(f"Checking manifest at: {manifest_path}")
    
    if os.path.exists(manifest_path):
        print("✅ Manifest file exists")
        
        # Read and validate manifest
        try:
            with open(manifest_path, 'r') as f:
                manifest = json.load(f)
            
            # Check required fields
            required_fields = ['name', 'description', 'path', 'type', 'allowed_origins']
            missing_fields = [field for field in required_fields if field not in manifest]
            
            if missing_fields:
                print(f"❌ Missing fields in manifest: {missing_fields}")
                return False
            
            print("✅ Manifest structure is valid")
            
            # Check extension ID
            expected_origin = "chrome-extension://fkkeoobeahalebjpbockfedlncckobjb/"
            if expected_origin in manifest.get('allowed_origins', []):
                print("✅ Extension ID is correctly configured")
            else:
                print("❌ Extension ID is not correctly configured")
                print(f"   Expected: {expected_origin}")
                print(f"   Found: {manifest.get('allowed_origins', [])}")
                return False
            
            # Check if executable exists
            executable_path = manifest.get('path', '')
            if os.path.isabs(executable_path):
                if os.path.exists(executable_path):
                    print("✅ Native host executable exists")
                else:
                    print("❌ Native host executable not found")
                    print(f"   Expected at: {executable_path}")
                    return False
            else:
                # Relative path, check relative to manifest
                manifest_dir = os.path.dirname(manifest_path)
                full_executable_path = os.path.join(manifest_dir, executable_path)
                if os.path.exists(full_executable_path):
                    print("✅ Native host executable exists")
                else:
                    print("❌ Native host executable not found")
                    print(f"   Expected at: {full_executable_path}")
                    return False
            
            return True
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON in manifest file: {e}")
            return False
        except Exception as e:
            print(f"❌ Error reading manifest file: {e}")
            return False
    else:
        print("❌ Manifest file does not exist")
        return False

def main():
    """Main function to check native host registration"""
    print("Tab Agent Native Host Registration Check")
    print("=" * 40)
    
    system = platform.system()
    print(f"Operating System: {system}")
    
    if system == "Windows":
        success = check_windows_registration()
    elif system in ["Darwin", "Linux"]:
        success = check_unix_registration()
    else:
        print(f"❌ Unsupported operating system: {system}")
        return 1
    
    print("\n" + "=" * 40)
    if success:
        print("✅ All checks passed! Native host is properly registered.")
        return 0
    else:
        print("❌ Some checks failed. Please review the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())