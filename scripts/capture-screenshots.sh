#!/bin/bash
# Astraea Screenshot Capture Script
# Captures screenshots of all 4 main pages for documentation
# Usage: ./scripts/capture-screenshots.sh

set -e

SCREENSHOT_DIR="screenshots"
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:8000"

echo "Astraea Screenshot Capture"
echo "=========================="
echo ""

# Check if frontend is running
if ! curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    echo "Error: Frontend not running at $FRONTEND_URL"
    echo "Please start the frontend with: npm run dev"
    exit 1
fi

# Check if backend is running
if ! curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo "Warning: Backend not running at $BACKEND_URL"
    echo "Some screenshots may show offline states"
fi

# Create screenshot directory
mkdir -p "$SCREENSHOT_DIR"

echo "Capturing screenshots..."
echo ""

# Screenshot 1: Homepage
echo "1. Capturing homepage..."
npx playwright screenshot \
    --browser chromium \
    --viewport-size "1920,1080" \
    --full-page \
    "$FRONTEND_URL" \
    "$SCREENSHOT_DIR/01-home-proof-console.png" 2>/dev/null || echo "  Failed to capture homepage"

# Screenshot 2: Engine page
echo "2. Capturing engine page..."
npx playwright screenshot \
    --browser chromium \
    --viewport-size "1920,1080" \
    --full-page \
    "$FRONTEND_URL/engine" \
    "$SCREENSHOT_DIR/02-engine-replay.png" 2>/dev/null || echo "  Failed to capture engine page"

# Screenshot 3: Evaluation page
echo "3. Capturing evaluation page..."
npx playwright screenshot \
    --browser chromium \
    --viewport-size "1920,1080" \
    --full-page \
    "$FRONTEND_URL/evaluation" \
    "$SCREENSHOT_DIR/03-evaluation-proof-room.png" 2>/dev/null || echo "  Failed to capture evaluation page"

# Screenshot 4: Architecture page
echo "4. Capturing architecture page..."
npx playwright screenshot \
    --browser chromium \
    --viewport-size "1920,1080" \
    --full-page \
    "$FRONTEND_URL/architecture" \
    "$SCREENSHOT_DIR/04-architecture-topology.png" 2>/dev/null || echo "  Failed to capture architecture page"

echo ""
echo "Screenshot capture complete!"
echo ""
echo "Screenshots saved to: $SCREENSHOT_DIR/"
ls -la "$SCREENSHOT_DIR"/*.png 2>/dev/null || echo "No screenshots captured"
