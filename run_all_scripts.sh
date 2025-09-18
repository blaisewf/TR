#!/bin/bash

echo "Running all Python scripts in the scripts folder..."
echo

cd "$(dirname "$0")"

for script in scripts/*.py scripts/evals/*.py; do
    if [ -f "$script" ]; then
        echo "Running $script..."
        python3 "$script"
        if [ $? -ne 0 ]; then
            echo "Error running $script"
            exit 1
        fi
        echo "$script completed successfully."
        echo
    fi
done

echo "All scripts completed successfully!"
