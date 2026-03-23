#!/bin/bash

set -e

BASE_DIR="/Users/apinzon/Desktop/Active Projects"
ASTRAEA="$BASE_DIR/Astraea/backend"
RAW="$BASE_DIR/Astraea/raw_all"

echo "==== CLEAN ASTRAEA EXTRACTION START ===="

rm -rf "$RAW"
mkdir -p "$RAW"

#########################################
# TARGET PROJECTS ONLY
#########################################

PROJECTS=(
  "ForgeMesh"
  "ForgeMesh-1"
  "Perplexica"
  "Rift"
  "YieldOps"
  "Cellguard"
  "HARPY"
  "fabgitops"
  "k8s-resilience-pilot"
  "factoryops-console"
)

#########################################
# FILTER FUNCTION
#########################################

is_valid() {
  file="$1"

  if [[ "$file" =~ \.(py|ts|tsx|js)$ ]]; then
    if [[ "$file" =~ node_modules|\.next|dist|build|coverage|\.git|__pycache__|\.venv ]]; then
      return 1
    fi
    return 0
  fi

  return 1
}

#########################################
# CATEGORIZATION
#########################################

categorize() {
  file="$1"

  if [[ "$file" =~ postprocess|ranking|score ]]; then
    echo "decision"
  elif [[ "$file" =~ context|feature|aggregate|pipeline ]]; then
    echo "pipeline"
  elif [[ "$file" =~ swarm|executor|sandbox|tool|orchestrat ]]; then
    echo "execution"
  elif [[ "$file" =~ routing|model|inference|embed ]]; then
    echo "ml"
  elif [[ "$file" =~ ingest|loader|parser|normalize ]]; then
    echo "ingestion"
  elif [[ "$file" =~ retry|fail|guard|resilience|circuit ]]; then
    echo "runtime"
  elif [[ "$file" =~ audit|log|trace|record|event ]]; then
    echo "audit"
  else
    echo "shared"
  fi
}

#########################################
# EXTRACTION LOOP
#########################################

for project in "${PROJECTS[@]}"; do
  if [ -d "$BASE_DIR/$project" ]; then
    echo ">>> Extracting from $project..."

    find "$BASE_DIR/$project" -type f 2>/dev/null | while read file; do
      if is_valid "$file"; then
        category=$(categorize "$file")
        filename=$(basename "$file")
        ext="${filename##*.}"

        dest="$ASTRAEA/$category/${project}_${filename}_raw"
        raw_dest="$RAW/${project}_${filename}_raw"

        cp "$file" "$dest" 2>/dev/null || true
        cp "$file" "$raw_dest" 2>/dev/null || true

        echo "  $category/${project}_${filename}_raw"
      fi
    done
  else
    echo "!!! Project $project not found, skipping"
  fi
done

#########################################
# TAG FILES
#########################################

echo ""
echo "Tagging files..."

find "$ASTRAEA" -type f -name "*_raw" 2>/dev/null | while read file; do
  echo "// ASTRAEA_RAW_EXTRACT - MUST REWRITE" | cat - "$file" > temp && mv temp "$file"
done

echo ""
echo "==== CLEAN EXTRACTION COMPLETE ===="
echo ""
echo "Extracted files organized in:"
ls -la "$ASTRAEA"