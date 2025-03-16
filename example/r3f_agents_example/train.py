#!/usr/bin/env python3
"""
R3F Agents Training Script

This script trains a reinforcement learning agent to navigate in a 3D environment
using the R3F Agents framework.

Usage:
    python train.py --algo ppo --timesteps 100000
    python train.py --eval --model-path ./models/best_model
"""

import sys
import os
import time
import numpy as np
from pathlib import Path
import argparse
import traceback

# Add the SDK to the Python path
sdk_path = Path(__file__).parent.parent.parent / "packages" / "sdk-python"
sys.path.append(str(sdk_path.absolute()))

# Check if we're in a virtual environment
in_venv = sys.prefix != sys.base_prefix
if not in_venv:
    print("Warning: Not running in a virtual environment.")
    print("It's recommended to run this script in the virtual environment created in the project root.")
    print("You can activate it with: source ../../venv/bin/activate")
    print("Continuing anyway...\n")

try:
    # Import R3F environment
    from r3f_agents.environment import R3FEnv

    # Import Stable Baselines3
    from stable_baselines3 import PPO, A2C, SAC
    from stable_baselines3.common.vec_env import DummyVecEnv
    from stable_baselines3.common.evaluation import evaluate_policy
    from stable_baselines3.common.callbacks import EvalCallback, CheckpointCallback
    from stable_baselines3.common.monitor import Monitor
    from stable_baselines3.common.env_checker import check_env
except ImportError as e:
    print(f"Error importing required libraries: {e}")
    print("\nPlease make sure you have installed all dependencies:")
    print("  1. Create a virtual environment: python3 -m venv ../../venv")
    print("  2. Activate it: source ../../venv/bin/activate")
    print("  3. Install the SDK: pip install -e ../../packages/sdk-python")
    sys.exit(1)

# Check for TensorBoard
TENSORBOARD_AVAILABLE = True
try:
    import tensorboard
except ImportError:
    TENSORBOARD_AVAILABLE = False
    print("TensorBoard not found. Training will continue without TensorBoard logging.")
    print("To enable TensorBoard logging, install it with: pip install tensorboard")

def parse_args():
    parser = argparse.ArgumentParser(description="Train an RL agent in the R3F environment")
    parser.add_argument("--algo", type=str, default="ppo", choices=["ppo", "a2c", "sac"], 
                        help="RL algorithm to use")
    parser.add_argument("--timesteps", type=int, default=100000, 
                        help="Number of timesteps to train for")
    parser.add_argument("--start", type=float, nargs=3, default=[0.0, 0.0, 0.0], 
                        help="Start position (x, y, z)")
    parser.add_argument("--target", type=float, nargs=3, default=[10.0, 0.0, 10.0], 
                        help="Target position (x, y, z)")
    parser.add_argument("--eval", action="store_true", 
                        help="Evaluate a trained model instead of training")
    parser.add_argument("--model-path", type=str, default="./models/best_model", 
                        help="Path to save/load the model")
    parser.add_argument("--no-tensorboard", action="store_true",
                        help="Disable TensorBoard logging even if available")
    return parser.parse_args()

def make_env(websocket_url, agent_id, start_position, target_position):
    """Create and wrap the environment."""
    def _init():
        env = R3FEnv(
            websocket_url=websocket_url,
            agent_id=agent_id,
            start_position=start_position,
            target_position=target_position,
            max_episode_steps=500
        )
        # Wrap the environment with Monitor for logging
        env = Monitor(env)
        return env
    return _init

def train_agent(args):
    """Train an RL agent to navigate from start to target."""
    print("Starting R3F Agents RL training...")
    print(f"Training agent to navigate from {args.start} to {args.target}")
    
    # Create the environment
    env_fn = make_env("ws://localhost:8765", "main", args.start, args.target)
    env = DummyVecEnv([env_fn])
    
    # Create log and model directories
    log_dir = "./logs"
    model_dir = "./models"
    os.makedirs(log_dir, exist_ok=True)
    os.makedirs(model_dir, exist_ok=True)
    
    # Set up callbacks
    eval_callback = EvalCallback(
        env,
        best_model_save_path=model_dir,
        log_path=log_dir,
        eval_freq=1000,
        deterministic=True,
        render=False
    )
    
    checkpoint_callback = CheckpointCallback(
        save_freq=5000,
        save_path=model_dir,
        name_prefix="rl_model"
    )
    
    # Determine whether to use TensorBoard
    use_tensorboard = TENSORBOARD_AVAILABLE and not args.no_tensorboard
    tensorboard_log = log_dir if use_tensorboard else None
    
    # Create the RL agent based on the selected algorithm
    if args.algo.lower() == "ppo":
        model = PPO("MultiInputPolicy", env, verbose=1, tensorboard_log=tensorboard_log)
    elif args.algo.lower() == "a2c":
        model = A2C("MultiInputPolicy", env, verbose=1, tensorboard_log=tensorboard_log)
    elif args.algo.lower() == "sac":
        model = SAC("MultiInputPolicy", env, verbose=1, tensorboard_log=tensorboard_log)
    else:
        raise ValueError(f"Unsupported algorithm: {args.algo}")
    
    # Train the agent
    print(f"Training {args.algo.upper()} agent for {args.timesteps} timesteps...")
    try:
        model.learn(
            total_timesteps=args.timesteps,
            callback=[eval_callback, checkpoint_callback]
        )
    except ImportError as e:
        if "tensorboard" in str(e).lower():
            print("\nError: TensorBoard logging failed. Retrying without TensorBoard...")
            # Recreate the model without TensorBoard
            if args.algo.lower() == "ppo":
                model = PPO("MultiInputPolicy", env, verbose=1, tensorboard_log=None)
            elif args.algo.lower() == "a2c":
                model = A2C("MultiInputPolicy", env, verbose=1, tensorboard_log=None)
            elif args.algo.lower() == "sac":
                model = SAC("MultiInputPolicy", env, verbose=1, tensorboard_log=None)
            
            # Train without TensorBoard
            model.learn(
                total_timesteps=args.timesteps,
                callback=[eval_callback, checkpoint_callback]
            )
        else:
            # If it's a different ImportError, re-raise it
            raise
    
    # Save the final model
    final_model_path = os.path.join(model_dir, "final_model")
    model.save(final_model_path)
    print(f"Training completed. Final model saved to {final_model_path}")
    
    return model

def evaluate_agent(args):
    """Evaluate a trained RL agent."""
    print(f"Evaluating trained agent from {args.model_path}")
    
    # Create the environment
    env_fn = make_env("ws://localhost:8765", "main", args.start, args.target)
    env = env_fn()
    
    # Load the trained model
    if args.algo.lower() == "ppo":
        model = PPO.load(args.model_path, env=env)
    elif args.algo.lower() == "a2c":
        model = A2C.load(args.model_path, env=env)
    elif args.algo.lower() == "sac":
        model = SAC.load(args.model_path, env=env)
    else:
        raise ValueError(f"Unsupported algorithm: {args.algo}")
    
    # Run evaluation episodes
    episodes = 5
    max_steps = 500
    
    for episode in range(episodes):
        print(f"\nStarting evaluation episode {episode + 1}/{episodes}")
        obs, _ = env.reset()
        done = False
        total_reward = 0
        step = 0
        
        while not done and step < max_steps:
            action, _ = model.predict(obs, deterministic=True)
            obs, reward, done, _, info = env.step(action)
            total_reward += reward
            
            # Print progress every 50 steps
            if step % 50 == 0:
                position = obs['position'] if isinstance(obs, dict) else obs
                distance = info.get('distance', 'unknown')
                print(f"Step {step}: Position = {position}, Distance to target = {distance}")
            
            # Small delay to make the motion visible
            time.sleep(0.01)
            step += 1
        
        print(f"Episode {episode + 1}/{episodes} completed - Total reward: {total_reward:.2f}")
    
    env.close()
    print("Evaluation completed")

def main():
    args = parse_args()
    
    try:
        if args.eval:
            evaluate_agent(args)
        else:
            train_agent(args)
    
    except KeyboardInterrupt:
        print("\nTraining interrupted by user")
    except Exception as e:
        print(f"\nError during training: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    main() 