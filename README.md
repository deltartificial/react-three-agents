# React Three Agents

Un framework pour l'entraînement et la visualisation d'agents d'apprentissage par renforcement dans des environnements 3D utilisant React Three Fiber et Python.

## Architecture

Le projet est structuré en trois composants principaux:

1. **Librairie TypeScript/React** (`packages/react-three-agents`):

   - Composants React pour la visualisation 3D
   - Serveur WebSocket intégré avec uWebSockets.js
   - Gestion d'état avec Zustand

2. **SDK Python** (`packages/sdk-python`):

   - Interface compatible avec Gymnasium
   - Communication WebSocket avec le serveur
   - Support pour les espaces d'action discrets et continus

3. **Exemples** (`example/`):
   - Application React qui utilise la librairie
   - Script Python qui utilise le SDK
   - Serveur WebSocket standalone

## Fonctionnalités

- Visualisation en temps réel d'agents RL en 3D avec React Three Fiber
- Communication bidirectionnelle via WebSockets
- Interface compatible avec les bibliothèques RL standard (PyTorch, TensorFlow, etc.)
- Composants React faciles à utiliser pour créer des scènes 3D
- Support pour des modèles d'agents et des environnements personnalisés

## Installation

### Librairie TypeScript/React

```bash
npm install react-three-agents
```

### SDK Python

```bash
pip install r3f-agents
```

## Utilisation

### Composants React

```tsx
import { Environment, Agent } from "react-three-agents";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Environment
        serverUrl="ws://localhost:8765"
        startServer={true} // Démarre automatiquement un serveur WebSocket
      >
        <Agent id="main" />
      </Environment>
    </div>
  );
}
```

### SDK Python

```python
from r3f_agents.environment import R3FEnv

# Créer l'environnement
env = R3FEnv(websocket_url="ws://localhost:8765", agent_id="main")

# Utiliser avec votre bibliothèque RL préférée
observation, info = env.reset()

for _ in range(1000):
    action = env.action_space.sample()
    observation, reward, done, truncated, info = env.step(action)

    if done or truncated:
        observation, info = env.reset()

env.close()
```

## Développement

1. Installer les dépendances:

```bash
npm install
```

2. Construire la librairie:

```bash
cd packages/react-three-agents
npm run build
```

3. Exécuter l'exemple:

```bash
cd example
node server.js
```

4. Dans un autre terminal, démarrer l'application React:

```bash
cd example/client
npm install
npm run dev
```

5. Dans un troisième terminal, lancer l'agent Python:

```bash
cd example/r3f_agents_example
python train.py
```

## Licence

MIT
