#!/bin/bash
# Setup GitHub repository for Openclaw-Dasboard

echo "Setting up GitHub repository..."

# Check if already in a git repo
cd /Users/a66/.openclaw/workspace-coder/ai-office-saas

# Create new repo (if gh is logged in)
# gh repo create Openclaw-Dasboard --public --description "AI Office Dashboard - Real-time agent monitoring with Cloudflare Workers"

echo ""
echo "Manual steps required:"
echo ""
echo "1. Login to GitHub CLI:"
echo "   gh auth login"
echo ""
echo "2. Create new repository:"
echo "   gh repo create Openclaw-Dasboard --public --description \"AI Office Dashboard\""
echo ""
echo "3. Update remote URL:"
echo "   git remote remove origin"
echo "   git remote add origin https://github.com/realriplab/Openclaw-Dasboard.git"
echo ""
echo "4. Push code:"
echo "   git push -u origin main"
echo ""
echo "Or run this script after 'gh auth login':"
echo "   bash setup-github.sh"
