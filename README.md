# React Three Agents

A framework for training and visualizing reinforcement learning agents in 3D environments using React Three Fiber and Python.

## Features

- Real-time 3D visualization of RL agents using React Three Fiber
- WebSocket-based communication between Python agents and the 3D environment
- Gymnasium-compatible environment interface
- Easy-to-use React components for creating 3D scenes
- Support for custom agent models and environments

## Installation

### TypeScript/React Library

```bash
npm install react-three-agents
```

### Python SDK

```bash
pip install r3f-agents
```

## Usage

### React Components

```tsx
import { Environment, Agent } from "react-three-agents";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Environment serverUrl="ws://localhost:8765">
        <Agent id="main" />
      </Environment>
    </div>
  );
}
```

### Python SDK

```python
from r3f_agents.environment import R3FEnv

# Create the environment
env = R3FEnv(websocket_url="ws://localhost:8765")

# Use with your favorite RL library
observation, info = env.reset()

for _ in range(1000):
    action = env.action_space.sample()
    observation, reward, done, truncated, info = env.step(action)

    if done or truncated:
        observation, info = env.reset()

env.close()
```

## Development

1. Install dependencies:

```bash
npm install
```

2. Build the library:

```bash
npm run build
```

3. Run the example:

```bash
cd example
npm install
npm start
```

4. In another terminal, run the Python example:

```bash
cd packages/sdk-python
pip install -e .
python examples/simple_agent.py
```

## License

MIT
