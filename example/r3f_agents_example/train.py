import sys
import os
import time
import numpy as np
from pathlib import Path

# Add the SDK to the Python path
sdk_path = Path(__file__).parent.parent.parent / "packages" / "sdk-python"
sys.path.append(str(sdk_path.absolute()))

from r3f_agents.environment import R3FEnv

class CircularMotionAgent:
    """
    Agent that moves in a circular pattern in the 3D environment.
    This is a simple demonstration agent that doesn't use RL algorithms.
    """
    def __init__(self, env):
        self.env = env
        self.step_count = 0
        self.radius = 3.0
        self.height_amplitude = 1.0
        self.speed = 0.05
    
    def act(self, observation):
        """Generate a circular motion with some vertical oscillation."""
        t = self.step_count * self.speed
        self.step_count += 1
        
        # Circular motion in XZ plane
        x = np.cos(t) * self.radius
        z = np.sin(t) * self.radius
        y = np.sin(t * 0.5) * self.height_amplitude  # Vertical oscillation
        
        return np.array([x, y, z], dtype=np.float32)

def main():
    print("Starting R3F Agents training example...")
    print("This example will connect to the WebSocket server and move an agent in a circular pattern.")
    
    # Create the environment with WebSocket connection
    env = R3FEnv(
        websocket_url="ws://localhost:8765",
        agent_id="main"
    )
    
    # Create a simple agent that moves in a circular pattern
    agent = CircularMotionAgent(env)
    
    try:
        # Training loop
        episodes = 5
        max_steps = 1000
        
        for episode in range(episodes):
            print(f"\nStarting episode {episode + 1}/{episodes}")
            observation, _ = env.reset()
            episode_reward = 0
            
            for step in range(max_steps):
                # Get action from agent
                action = agent.act(observation)
                
                # Execute action in environment
                observation, reward, done, truncated, info = env.step(action)
                episode_reward += reward
                
                # Print progress every 100 steps
                if step % 100 == 0:
                    position = observation['position'] if isinstance(observation, dict) else observation
                    print(f"Step {step}: Position = {position}")
                
                # Small delay to make the motion visible
                time.sleep(0.01)
                
                if done or truncated:
                    print(f"Episode ended early at step {step}")
                    break
            
            print(f"Episode {episode + 1}/{episodes} completed - Total reward: {episode_reward:.2f}")
    
    except KeyboardInterrupt:
        print("\nTraining interrupted by user")
    except Exception as e:
        print(f"\nError during training: {e}")
    finally:
        env.close()
        print("Environment closed")

if __name__ == "__main__":
    main() 