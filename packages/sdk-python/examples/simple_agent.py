import numpy as np
from r3f_agents.environment import R3FEnv

# Create a simple random agent that moves around in 3D space
class RandomAgent:
    def __init__(self, env):
        self.env = env
    
    def act(self, observation):
        return self.env.action_space.sample()

def main():
    # Create the environment
    env = R3FEnv(websocket_url="ws://localhost:8765")
    agent = RandomAgent(env)
    
    # Training loop
    episodes = 10
    max_steps = 100
    
    for episode in range(episodes):
        observation, _ = env.reset()
        episode_reward = 0
        
        for step in range(max_steps):
            # Agent selects an action
            action = agent.act(observation)
            
            # Environment step
            observation, reward, done, truncated, info = env.step(action)
            episode_reward += reward
            
            if done or truncated:
                break
        
        print(f"Episode {episode + 1} finished with reward: {episode_reward}")
    
    env.close()

if __name__ == "__main__":
    main() 