# React Three Agents Example

Ce dossier contient un exemple complet d'utilisation de la librairie React Three Agents.

## Structure

- `client/` - Application React qui utilise la librairie
- `r3f_agents_example/` - Script Python qui utilise le SDK Python
- `server.js` - Serveur WebSocket pour la communication entre le client et l'agent Python

## Installation

1. Construire la librairie React Three Agents:

```bash
cd ../packages/react-three-agents
npm install
npm run build
```

2. Installer les dépendances du client:

```bash
cd example/client
npm install
```

3. Installer le SDK Python:

```bash
cd ../../packages/sdk-python
pip install -e .
```

## Lancement de l'exemple

1. Démarrer le serveur WebSocket:

```bash
cd example
node server.js
```

2. Dans un autre terminal, démarrer l'application React:

```bash
cd example/client
npm run dev
```

3. Dans un troisième terminal, lancer l'agent Python:

```bash
cd example/r3f_agents_example
python train.py
```

Vous devriez voir l'agent apparaître dans la scène 3D et effectuer un mouvement circulaire.

## Personnalisation

- Modifiez `r3f_agents_example/train.py` pour changer le comportement de l'agent
- Modifiez `client/src/App.tsx` pour changer l'apparence de la scène 3D
