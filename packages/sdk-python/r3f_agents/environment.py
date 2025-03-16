import json
import asyncio
import numpy as np
import gymnasium as gym
from gymnasium import spaces
from typing import Dict, Any, Optional, Tuple, List, Union
import websockets
import time

class R3FEnv(gym.Env):
    """
    Reinforcement Learning environment that connects to a React Three Fiber scene via WebSockets.
    Implements the Gymnasium interface for compatibility with RL libraries.
    """
    metadata = {'render_modes': ['human']}
    
    def __init__(self, 
                 websocket_url: str = "ws://localhost:8765",
                 agent_id: str = "main",
                 observation_space_config: Optional[Dict] = None,
                 action_space_config: Optional[Dict] = None):
        """
        Initialize the R3F environment.
        
        Args:
            websocket_url: URL of the WebSocket server
            agent_id: Unique identifier for this agent
            observation_space_config: Custom observation space configuration
            action_space_config: Custom action space configuration
        """
        super().__init__()
        
        self.websocket_url = websocket_url
        self.agent_id = agent_id
        self.websocket = None
        self.loop = None
        self.connected = False
        self.last_message_time = 0
        self.timeout = 5.0  # seconds
        
        # Configure action space
        if action_space_config and action_space_config.get('type') == 'discrete':
            self.action_space = spaces.Discrete(action_space_config.get('n', 4))
            self.action_type = 'discrete'
        else:
            # Default to continuous actions (x, y, z movement)
            self.action_space = spaces.Box(
                low=-1.0,
                high=1.0,
                shape=(3,),  # [x, y, z] movement
                dtype=np.float32
            )
            self.action_type = 'continuous'
        
        # Configure observation space
        if observation_space_config:
            self.observation_space = self._create_custom_observation_space(observation_space_config)
        else:
            # Default observation space
            self.observation_space = spaces.Dict({
                'position': spaces.Box(
                    low=-np.inf,
                    high=np.inf,
                    shape=(3,),
                    dtype=np.float32
                ),
                'rotation': spaces.Box(
                    low=-np.pi,
                    high=np.pi,
                    shape=(3,),
                    dtype=np.float32
                )
            })
        
        # Initialize agent state
        self._agent_state = {
            'position': np.zeros(3, dtype=np.float32),
            'rotation': np.zeros(3, dtype=np.float32),
            'reward': 0.0,
            'done': False,
            'action': ''
        }
    
    def _create_custom_observation_space(self, config: Dict) -> spaces.Space:
        """Create a custom observation space based on configuration."""
        if config.get('type') == 'dict':
            space_dict = {}
            for key, space_config in config.get('spaces', {}).items():
                if space_config['type'] == 'box':
                    space_dict[key] = spaces.Box(
                        low=np.array(space_config.get('low', -np.inf), dtype=np.float32),
                        high=np.array(space_config.get('high', np.inf), dtype=np.float32),
                        shape=tuple(space_config.get('shape', (1,))),
                        dtype=np.float32
                    )
            return spaces.Dict(space_dict)
        elif config.get('type') == 'box':
            return spaces.Box(
                low=np.array(config.get('low', -np.inf), dtype=np.float32),
                high=np.array(config.get('high', np.inf), dtype=np.float32),
                shape=tuple(config.get('shape', (1,))),
                dtype=np.float32
            )
        else:
            # Default to position and rotation
            return spaces.Dict({
                'position': spaces.Box(
                    low=-np.inf, high=np.inf, shape=(3,), dtype=np.float32
                ),
                'rotation': spaces.Box(
                    low=-np.pi, high=np.pi, shape=(3,), dtype=np.float32
                )
            })
    
    async def _connect(self):
        """Establish WebSocket connection."""
        if self.websocket is None or not self.connected:
            try:
                self.websocket = await websockets.connect(self.websocket_url)
                self.connected = True
                print(f"Connected to R3F environment at {self.websocket_url}")
            except Exception as e:
                self.connected = False
                print(f"Failed to connect to R3F environment: {e}")
                raise ConnectionError(f"Could not connect to WebSocket server: {e}")
    
    async def _disconnect(self):
        """Close WebSocket connection."""
        if self.websocket:
            await self.websocket.close()
            self.websocket = None
            self.connected = False
            print("Disconnected from R3F environment")
    
    async def _send_message(self, message: Dict[str, Any]):
        """Send a message to the WebSocket server."""
        await self._connect()
        message_json = json.dumps(message)
        await self.websocket.send(message_json)
        self.last_message_time = time.time()
    
    async def _receive_state(self) -> Dict[str, Any]:
        """Receive state update from the WebSocket server."""
        if not self.websocket or not self.connected:
            await self._connect()
        
        try:
            # Set a timeout for receiving messages
            message = await asyncio.wait_for(self.websocket.recv(), timeout=self.timeout)
            data = json.loads(message)
            
            # Only process messages for this agent
            if data.get('agentId') == self.agent_id and data.get('type') == 'state':
                return data
            else:
                # If message is not for this agent, try again
                return await self._receive_state()
                
        except asyncio.TimeoutError:
            print(f"Timeout waiting for response from server after {self.timeout} seconds")
            # Return the last known state
            return {
                'type': 'state',
                'agentId': self.agent_id,
                'data': self._agent_state
            }
        except Exception as e:
            print(f"Error receiving state: {e}")
            raise
    
    def reset(self, seed: Optional[int] = None, options: Optional[Dict] = None) -> Tuple[Dict[str, np.ndarray], Dict]:
        """Reset the environment to an initial state."""
        super().reset(seed=seed)
        
        if self.loop is None:
            self.loop = asyncio.get_event_loop()
        
        # Send reset message
        self.loop.run_until_complete(self._send_message({
            'type': 'reset',
            'agentId': self.agent_id,
            'data': {}
        }))
        
        # Receive initial state
        state = self.loop.run_until_complete(self._receive_state())
        if 'data' in state:
            self._agent_state.update(state.get('data', {}))
        
        return self._get_obs(), {}
    
    def step(self, action: Union[np.ndarray, int]) -> Tuple[Dict[str, np.ndarray], float, bool, bool, Dict]:
        """
        Take a step in the environment.
        
        Args:
            action: Either a continuous action [x, y, z] or a discrete action index
            
        Returns:
            observation, reward, done, truncated, info
        """
        # Convert discrete action to continuous if needed
        if self.action_type == 'discrete' and isinstance(action, (int, np.integer)):
            # Map discrete actions to movements
            # 0: forward, 1: backward, 2: left, 3: right
            continuous_action = np.zeros(3, dtype=np.float32)
            if action == 0:  # forward
                continuous_action[2] = -1.0
            elif action == 1:  # backward
                continuous_action[2] = 1.0
            elif action == 2:  # left
                continuous_action[0] = -1.0
            elif action == 3:  # right
                continuous_action[0] = 1.0
            action_data = {'position': continuous_action.tolist()}
        else:
            # Use continuous action directly
            action_data = {'position': action.tolist()}
        
        # Send action
        self.loop.run_until_complete(self._send_message({
            'type': 'action',
            'agentId': self.agent_id,
            'data': action_data
        }))
        
        # Receive new state
        state = self.loop.run_until_complete(self._receive_state())
        if 'data' in state:
            self._agent_state.update(state.get('data', {}))
        
        return (
            self._get_obs(),
            self._agent_state.get('reward', 0.0),
            self._agent_state.get('done', False),
            False,  # truncated
            {}  # info
        )
    
    def _get_obs(self) -> Dict[str, np.ndarray]:
        """Convert agent state to observation."""
        if isinstance(self.observation_space, spaces.Dict):
            obs = {}
            for key in self.observation_space.spaces:
                if key in self._agent_state:
                    value = self._agent_state[key]
                    if isinstance(value, list):
                        obs[key] = np.array(value, dtype=np.float32)
                    else:
                        obs[key] = np.array([value], dtype=np.float32)
                else:
                    # Default to zeros if the key is not in agent state
                    shape = self.observation_space.spaces[key].shape
                    obs[key] = np.zeros(shape, dtype=np.float32)
            return obs
        else:
            # For Box observation space, default to position
            return np.array(self._agent_state.get('position', [0, 0, 0]), dtype=np.float32)
    
    def close(self):
        """Close the environment and clean up resources."""
        if self.loop:
            self.loop.run_until_complete(self._disconnect())
            self.loop = None
    
    def render(self):
        """
        Render the environment.
        
        Since the environment is rendered in the React Three Fiber scene,
        this method doesn't need to do anything.
        """
        pass 