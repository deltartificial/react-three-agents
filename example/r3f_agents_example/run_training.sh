#!/bin/bash

# Script to run RL agent training with virtual environment

# Path to project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VENV_PATH="$PROJECT_ROOT/venv"
SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")/train.py"

# Check if virtual environment exists
if [ ! -d "$VENV_PATH" ]; then
    echo "Virtual environment does not exist. Creating..."
    python3 -m venv "$VENV_PATH"
    
    if [ $? -ne 0 ]; then
        echo "Error creating virtual environment."
        exit 1
    fi
    
    echo "Installing dependencies..."
    source "$VENV_PATH/bin/activate"
    pip install -e "$PROJECT_ROOT/packages/sdk-python"
    pip install tensorboard
    
    if [ $? -ne 0 ]; then
        echo "Error installing dependencies."
        exit 1
    fi
else
    # Check if tensorboard is installed
    source "$VENV_PATH/bin/activate"
    if ! pip show tensorboard > /dev/null 2>&1; then
        echo "Installing TensorBoard..."
        pip install tensorboard
    fi
fi

# Make training script executable
chmod +x "$SCRIPT_PATH"

# Run training script with passed arguments
echo "Running training script..."
python3 "$SCRIPT_PATH" "$@"

# Deactivate virtual environment
deactivate

echo "Finished." 