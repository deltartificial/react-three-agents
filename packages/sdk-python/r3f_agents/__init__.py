"""
R3F Agents - Python SDK for React Three Fiber Agents

This package provides a Python interface to interact with 3D environments
built with React Three Fiber (R3F). It allows reinforcement learning agents
to be trained in 3D environments rendered in the browser.

Example:
    ```python
    import gymnasium as gym
    from r3f_agents import R3FEnv

    env = R3FEnv(
        websocket_url="ws://localhost:8765",
        agent_id="my_agent"
    )

    obs, info = env.reset()
    for _ in range(1000):
        action = env.action_space.sample()
        obs, reward, done, truncated, info = env.step(action)
        if done:
            obs, info = env.reset()
    env.close()
    ```
"""

__version__ = "0.2.0"
__author__ = "delartificial"

from .environment import R3FEnv

__all__ = ["R3FEnv"] 