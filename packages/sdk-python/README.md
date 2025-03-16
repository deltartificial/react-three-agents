# R3F Agents Python SDK

A Python SDK for connecting reinforcement learning agents to React Three Fiber environments.

## Installation

```bash
pip install r3f-agents
```

## Usage

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

## Features

- Gymnasium-compatible interface
- WebSocket communication with the React Three Fiber environment
- Support for discrete and continuous action spaces
