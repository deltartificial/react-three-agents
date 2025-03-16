#!/bin/bash

# Script pour exécuter l'entraînement de l'agent RL avec l'environnement virtuel

# Chemin vers la racine du projet
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VENV_PATH="$PROJECT_ROOT/venv"
SCRIPT_PATH="$(dirname "${BASH_SOURCE[0]}")/train.py"

# Vérifier si l'environnement virtuel existe
if [ ! -d "$VENV_PATH" ]; then
    echo "L'environnement virtuel n'existe pas. Création en cours..."
    python3 -m venv "$VENV_PATH"
    
    if [ $? -ne 0 ]; then
        echo "Erreur lors de la création de l'environnement virtuel."
        exit 1
    fi
    
    echo "Installation des dépendances..."
    source "$VENV_PATH/bin/activate"
    pip install -e "$PROJECT_ROOT/packages/sdk-python"
    
    if [ $? -ne 0 ]; then
        echo "Erreur lors de l'installation des dépendances."
        exit 1
    fi
else
    # Activer l'environnement virtuel
    source "$VENV_PATH/bin/activate"
fi

# Rendre le script d'entraînement exécutable
chmod +x "$SCRIPT_PATH"

# Exécuter le script d'entraînement avec les arguments passés
echo "Exécution du script d'entraînement..."
python3 "$SCRIPT_PATH" "$@"

# Désactiver l'environnement virtuel
deactivate

echo "Terminé." 