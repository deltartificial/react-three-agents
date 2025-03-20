import json
import asyncio
import numpy as np
import gymnasium as gym
from gymnasium import spaces
from typing import Dict, Any, Optional, Tuple, List, Union
import websockets
import time
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("r3f_agents")

class R3FEnv(gym.Env):
    """
    Reinforcement Learning environment that connects to a React Three Fiber scene via WebSockets.
    Implements the Gymnasium interface for compatibility with RL libraries.
    
    This environment allows agents to interact with 3D scenes rendered using React Three Fiber.
    It handles communication with the WebSocket server, state management, and reward calculation.
    """
    metadata = {'render_modes': ['human']}
    
    def __init__(self, 
                 websocket_url: str = "ws://localhost:8765",
                 agent_id: str = "main",
                 observation_space: Optional[spaces.Space] = None,
                 action_space: Optional[spaces.Space] = None,
                 max_episode_steps: int = 1000):
        """
        Initialize the R3F environment.
        
        Args:
            websocket_url: URL of the WebSocket server
            agent_id: Unique identifier for this agent
            observation_space: Custom observation space configuration
            action_space: Custom action space configuration
            max_episode_steps: Maximum number of steps per episode
        """
        super().__init__()
        
        # Set up logger
        self.logger = logger
        
        self.websocket_url = websocket_url
        self.agent_id = agent_id
        self.websocket = None
        self.loop = None
        self.connected = False
        self.timeout = 5.0
        self.max_episode_steps = max_episode_steps
        self.current_step = 0
        
        self.action_space = action_space or spaces.Box(
            low=-1.0,
            high=1.0,
            shape=(3,),
            dtype=np.float32
        )
        
        self.observation_space = observation_space or spaces.Dict({
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
        
        self._state = {
            'position': np.zeros(3, dtype=np.float32),
            'rotation': np.zeros(3, dtype=np.float32),
            'reward': 0.0,
            'done': False
        }
        
        self.logger.info(f"R3F Environment initialized: agent_id={agent_id}, url={websocket_url}")
    
    async def _connect(self) -> None:
        """
        Establish WebSocket connection.
        
        Raises:
            ConnectionError: If connection to the WebSocket server fails
        """
        if self.websocket is None or not self.connected:
            try:
                self.logger.debug(f"Attempting to connect to {self.websocket_url}")
                self.websocket = await websockets.connect(self.websocket_url)
                self.connected = True
                self.logger.info(f"Connected to R3F environment at {self.websocket_url}")
            except Exception as e:
                self.connected = False
                self.logger.error(f"Failed to connect to R3F environment: {e}")
                raise ConnectionError(f"Could not connect to WebSocket server: {e}")
    
    async def _disconnect(self) -> None:
        """Close WebSocket connection."""
        if self.websocket:
            await self.websocket.close()
            self.websocket = None
            self.connected = False
            self.logger.info("Disconnected from R3F environment")
    
    async def _send_message(self, message: Dict[str, Any]) -> None:
        """
        Send a message to the WebSocket server.
        
        Args:
            message: The message to send to the server
        """
        await self._connect()
        message_json = json.dumps(message)
        self.logger.debug(f"Sending message: {message_json}")
        await self.websocket.send(message_json)
    
    async def _receive_state(self) -> Dict[str, Any]:
        """
        Receive state update from the WebSocket server.
        
        Returns:
            The message received from the server
            
        Raises:
            asyncio.TimeoutError: If server doesn't respond within the timeout period
            ConnectionError: If connection issues occur
        """
        if not self.websocket or not self.connected:
            await self._connect()
        
        try:
            self.logger.debug("Waiting for message from server")
            message = await asyncio.wait_for(self.websocket.recv(), timeout=self.timeout)
            data = json.loads(message)
            
            if data.get('agentId') == self.agent_id and data.get('type') == 'state':
                self.logger.debug(f"Received state update: {data}")
                return data
            else:
                self.logger.debug(f"Received non-state message, waiting for state update: {data}")
                return await self._receive_state()
                
        except asyncio.TimeoutError:
            self.logger.warning(f"Timeout waiting for response from server after {self.timeout} seconds")
            return {
                'type': 'state',
                'agentId': self.agent_id,
                'data': self._state
            }
        except Exception as e:
            self.logger.error(f"Error receiving state: {e}")
            raise
    
    def reset(self, seed: Optional[int] = None, options: Optional[Dict[str, Any]] = None) -> Tuple[Dict[str, np.ndarray], Dict[str, Any]]:
        """
        Reset the environment to an initial state.
        
        Args:
            seed: Random seed for reproducibility
            options: Additional options for resetting (unused currently)
            
        Returns:
            Initial observation and info dictionary
        """
        super().reset(seed=seed)
        
        if self.loop is None:
            self.loop = asyncio.get_event_loop()
        
        self.current_step = 0
        
        self.logger.info(f"Resetting environment. Agent: {self.agent_id}")
        
        self.loop.run_until_complete(self._send_message({
            'type': 'reset',
            'agentId': self.agent_id,
            'data': {}
        }))
        
        state = self.loop.run_until_complete(self._receive_state())
        if 'data' in state:
            self._state.update(state.get('data', {}))
        
        return self._get_obs(), {}
    
    def step(self, action: Union[np.ndarray, int]) -> Tuple[Dict[str, np.ndarray], float, bool, bool, Dict[str, Any]]:
        """
        Take a step in the environment.
        
        Args:
            action: Either a continuous action [x, y, z] or a discrete action index
            
        Returns:
            observation, reward, done, truncated, info
        """
        self.current_step += 1
        
        if isinstance(action, (int, np.integer)):
            continuous_action = np.zeros(3, dtype=np.float32)
            if action == 0:
                continuous_action[2] = -1.0
            elif action == 1:
                continuous_action[2] = 1.0
            elif action == 2:
                continuous_action[0] = -1.0
            elif action == 3:
                continuous_action[0] = 1.0
            action_data = {'position': continuous_action.tolist()}
        else:
            if not isinstance(action, np.ndarray):
                action = np.array(action, dtype=np.float32)
            action_data = {'position': action.tolist()}
        
        self.loop.run_until_complete(self._send_message({
            'type': 'action',
            'agentId': self.agent_id,
            'data': action_data
        }))
        
        state = self.loop.run_until_complete(self._receive_state())
        if 'data' in state:
            self._state.update(state.get('data', {}))
        
        done = self.current_step >= self.max_episode_steps
        self._state['done'] = done
        
        return (
            self._get_obs(),
            self._state.get('reward', 0.0),
            done,
            False,
            {}
        )
    
    def _get_obs(self) -> Dict[str, np.ndarray]:
        """
        Convert agent state to observation dictionary.
        
        Returns:
            Observation dictionary formatted according to the observation space
        """
        if isinstance(self.observation_space, spaces.Dict):
            obs = {}
            for key in self.observation_space.spaces:
                if key in self._state:
                    value = self._state[key]
                    if isinstance(value, list):
                        obs[key] = np.array(value, dtype=np.float32)
                    else:
                        obs[key] = np.array([value], dtype=np.float32)
                else:
                    shape = self.observation_space.spaces[key].shape
                    obs[key] = np.zeros(shape, dtype=np.float32)
            return obs
        else:
            return np.array(self._state.get('position', [0, 0, 0]), dtype=np.float32)
    
    def close(self) -> None:
        """Close the environment and clean up resources."""
        self.logger.info("Closing R3F environment")
        if self.loop:
            self.loop.run_until_complete(self._disconnect())
            self.loop = None
    
    def render(self) -> None:
        """
        Render the environment.
        
        Since the environment is rendered in the React Three Fiber scene,
        this method doesn't need to do anything.
        """
        pass 