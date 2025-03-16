import sys
import os
sys.path.append(os.path.abspath("../../packages/sdk-python"))

import numpy as np
from r3f_agents.environment import R3FEnv

class SimpleAgent:
    def __init__(self, env):
        self.env = env
        self.step_count = 0
    
    def act(self, observation):
        # Create a circular motion
        t = self.step_count * 0.05
        self.step_count += 1
        
        # Circular motion in XZ plane
        x = np.cos(t) * 3
        z = np.sin(t) * 3
        y = np.sin(t * 0.5)  # Some up/down motion
        
        return np.array([x, y, z], dtype=np.float32)

def main():
    print("Starting R3F Agents training example...")
    
    # Create the environment with WebSocket connection
    env = R3FEnv(websocket_url="ws://localhost:8765")
    agent = SimpleAgent(env)
    
    try:
        # Training loop
        episodes = 100
        max_steps = 1000
        
        for episode in range(episodes):
            observation, _ = env.reset()
            episode_reward = 0
            
            for step in range(max_steps):
                # Get action from agent
                action = agent.act(observation)
                
                # Execute action in environment
                observation, reward, done, truncated, info = env.step(action)
                episode_reward += reward
                
                if done or truncated:
                    break
            
            print(f"Episode {episode + 1}/{episodes} - Reward: {episode_reward:.2f}")
    
    except KeyboardInterrupt:
        print("\nTraining interrupted by user")
    finally:
        env.close()
        print("Environment closed")

if __name__ == "__main__":
    main() 