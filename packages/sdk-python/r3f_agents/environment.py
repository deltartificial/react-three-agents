import json
import asyncio
import numpy as np
import gymnasium as gym
from gymnasium import spaces
from typing import Dict, Any, Optional, Tuple
import websockets

class R3FEnv(gym.Env):
    metadata = {'render_modes': ['human']}
    
    def __init__(self, websocket_url: str = "ws://localhost:8765"):
        super().__init__()
        
        self.websocket_url = websocket_url
        self.websocket = None
        self.loop = None
        
        # Default action and observation spaces
        # Can be overridden by subclasses
        self.action_space = spaces.Box(
            low=-1.0,
            high=1.0,
            shape=(3,),  # [x, y, z] movement
            dtype=np.float32
        )
        
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
        
        self._agent_state = {
            'position': np.zeros(3),
            'rotation': np.zeros(3),
            'reward': 0.0,
            'done': False
        }
    
    async def _connect(self):
        if self.websocket is None:
            self.websocket = await websockets.connect(self.websocket_url)
    
    async def _disconnect(self):
        if self.websocket:
            await self.websocket.close()
            self.websocket = None
    
    async def _send_message(self, message: Dict[str, Any]):
        await self._connect()
        await self.websocket.send(json.dumps(message))
    
    async def _receive_state(self) -> Dict[str, Any]:
        if not self.websocket:
            await self._connect()
        message = await self.websocket.recv()
        return json.loads(message)
    
    def reset(self, seed: Optional[int] = None, options: Optional[Dict] = None) -> Tuple[Dict[str, np.ndarray], Dict]:
        super().reset(seed=seed)
        
        if self.loop is None:
            self.loop = asyncio.get_event_loop()
        
        # Send reset message
        self.loop.run_until_complete(self._send_message({
            'type': 'reset',
            'agentId': 'main',
            'data': {}
        }))
        
        # Receive initial state
        state = self.loop.run_until_complete(self._receive_state())
        self._agent_state.update(state.get('data', {}))
        
        return self._get_obs(), {}
    
    def step(self, action: np.ndarray) -> Tuple[Dict[str, np.ndarray], float, bool, bool, Dict]:
        # Send action
        self.loop.run_until_complete(self._send_message({
            'type': 'action',
            'agentId': 'main',
            'data': {
                'position': action.tolist()
            }
        }))
        
        # Receive new state
        state = self.loop.run_until_complete(self._receive_state())
        self._agent_state.update(state.get('data', {}))
        
        return (
            self._get_obs(),
            self._agent_state['reward'],
            self._agent_state['done'],
            False,  # truncated
            {}  # info
        )
    
    def _get_obs(self) -> Dict[str, np.ndarray]:
        return {
            'position': np.array(self._agent_state['position'], dtype=np.float32),
            'rotation': np.array(self._agent_state['rotation'], dtype=np.float32)
        }
    
    def close(self):
        if self.loop:
            self.loop.run_until_complete(self._disconnect())
            self.loop = None 