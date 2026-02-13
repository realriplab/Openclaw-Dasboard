#!/bin/bash
# Install Openclaw Dashboard Bridge as a launchd service

echo "=========================================="
echo "Openclaw Dashboard Bridge Installer"
echo "=========================================="
echo ""

# Check if plist file exists
PLIST_SOURCE="/Users/a66/.openclaw/workspace-coder/ai-office-saas/local-bridge/com.openclaw.dashboard.bridge.plist"
PLIST_DEST="/Users/a66/Library/LaunchAgents/com.openclaw.dashboard.bridge.plist"

if [ ! -f "$PLIST_SOURCE" ]; then
    echo "❌ Error: Plist source file not found"
    echo "   Expected: $PLIST_SOURCE"
    exit 1
fi

# Copy plist to LaunchAgents
echo "📋 Copying launchd configuration..."
cp "$PLIST_SOURCE" "$PLIST_DEST"

# Set correct permissions
echo "🔐 Setting permissions..."
chmod 644 "$PLIST_DEST"

# Load the service
echo "🚀 Loading service..."
launchctl load "$PLIST_DEST"

# Start the service
echo "▶️  Starting service..."
launchctl start com.openclaw.dashboard.bridge

# Wait a moment
sleep 2

# Check if running
if launchctl list | grep -q "com.openclaw.dashboard.bridge"; then
    echo ""
    echo "✅ Service installed and running!"
    echo ""
    echo "📊 Status:"
    launchctl list | grep "com.openclaw.dashboard.bridge"
    echo ""
    echo "📁 Logs:"
    echo "   Standard: /tmp/openclaw-bridge.log"
    echo "   Error:    /tmp/openclaw-bridge.error.log"
    echo ""
    echo "🔧 Commands:"
    echo "   Stop:    launchctl stop com.openclaw.dashboard.bridge"
    echo "   Start:   launchctl start com.openclaw.dashboard.bridge"
    echo "   Restart: launchctl stop com.openclaw.dashboard.bridge && launchctl start com.openclaw.dashboard.bridge"
    echo "   Unload:  launchctl unload $PLIST_DEST"
else
    echo ""
    echo "⚠️  Service may not be running. Check logs:"
    echo "   /tmp/openclaw-bridge.error.log"
fi

echo ""
echo "=========================================="
