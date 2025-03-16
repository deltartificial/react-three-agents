# React Three Agents

A framework for training and visualizing reinforcement learning agents in 3D environments using React Three Fiber and Python.

## Setup

1. Install Node.js dependencies:

   ```bash
   npm install
   ```

2. Create a Python virtual environment:

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install the Python SDK:

   ```bash
   cd packages/sdk-python
   pip install -e .
   cd ../..
   ```

4. Build the TypeScript library:
   ```bash
   npm run build:lib
   ```

## Running the Example

You can run all components together:

```bash
npm start
```

Or run each component separately:

1. Start the WebSocket server:

   ```bash
   npm run start:server
   ```

2. Start the React client:

   ```bash
   npm run start:client
   ```

3. Start the Python agent:
   ```bash
   npm run start:agent
   ```

## Project Structure

- `packages/react-three-agents`: TypeScript/React library
- `packages/sdk-python`: Python SDK
- `example/client`: React client example
- `example/r3f_agents_example`: Python agent example
- `example/server.js`: WebSocket server example

## Features

- Real-time 3D visualization of RL agents using React Three Fiber
- Bidirectional communication via WebSockets
- Compatible interface with standard RL libraries (PyTorch, TensorFlow, etc.)
- Easy-to-use React components for creating 3D scenes
- Support for custom agent models and environments

## Architecture

The project is structured in three main components:

1. **TypeScript/React Library** (`packages/react-three-agents`):

   - React components for 3D visualization
   - Integrated WebSocket server using ws
   - State management with Zustand

2. **Python SDK** (`packages/sdk-python`):

   - Gymnasium-compatible interface
   - WebSocket communication with the server
   - Support for discrete and continuous action spaces

3. **Examples** (`example/`):
   - React application using the library
   - Python script using the SDK
   - Standalone WebSocket server

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
      <Environment
        serverUrl="ws://localhost:8765"
        startServer={true} // Automatically starts a WebSocket server
      >
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
env = R3FEnv(websocket_url="ws://localhost:8765", agent_id="main")

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
npm run build:lib
```

3. Run the complete example (WebSocket server + React client):

```bash
npm start
```

4. Or run components separately:
   - WebSocket server: `npm run start:server`
   - React client: `npm run start:client`
   - Python agent: `npm run start:agent`

## Troubleshooting

If you encounter compilation errors:

1. Check that all dependencies are installed:

```bash
npm install
```

2. Make sure types are properly configured:

```bash
cd packages/react-three-agents
npm install
```

3. For Python errors, install the SDK in development mode:

```bash
cd packages/sdk-python
pip install -e .
```

## License

MIT
