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

