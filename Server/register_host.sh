#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST_MANIFEST="$SCRIPT_DIR/com.tabagent.host.json"

# Check if manifest exists
if [ ! -f "$HOST_MANIFEST" ]; then
    echo "Error: Native messaging manifest not found at $HOST_MANIFEST"
    exit 1
fi

# Use the known extension ID
echo "Using extension ID: fkkeoobeahalebjpbockfedlncckobjb"
EXT_ID="fkkeoobeahalebjpbockfedlncckobjb"

# Update the manifest with the actual extension ID
echo "Updating manifest with extension ID..."
sed -i.bak "s/YOUR_EXTENSION_ID_HERE/$EXT_ID/g" "$HOST_MANIFEST"

# Determine the correct location for the manifest based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    MANIFEST_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
else
    echo "Unsupported OS: $OSTYPE"
    exit 1
fi

# Create the directory if it doesn't exist
mkdir -p "$MANIFEST_DIR"

# Copy the manifest to the appropriate location
cp "$HOST_MANIFEST" "$MANIFEST_DIR/"

if [ $? -eq 0 ]; then
    echo "Native messaging host registered successfully!"
    echo
    echo "Host manifest: $MANIFEST_DIR/com.tabagent.host.json"
    echo
    echo "Note: You may need to update the 'path' field in the manifest"
    echo "to point to the actual executable location."
else
    echo "Error: Failed to register native messaging host"
    exit 1
fi