from setuptools import setup, find_packages
import os
import re

# Read version from package __init__.py
def get_version():
    init_path = os.path.join(os.path.dirname(__file__), "r3f_agents", "__init__.py")
    if not os.path.exists(init_path):
        return "0.1.0"  # Default version if file doesn't exist
    with open(init_path, "r", encoding="utf-8") as f:
        version_match = re.search(r"^__version__ = ['\"]([^'\"]*)['\"]", f.read(), re.M)
        if version_match:
            return version_match.group(1)
        return "0.1.0"  # Default version if not found

# Read long description from README
with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="r3f_agents",
    version=get_version(),
    packages=find_packages(exclude=["tests", "examples"]),
    install_requires=[
        "websockets>=10.0",
        "numpy>=1.21.0",
        "gymnasium>=0.26.0",
    ],
    extras_require={
        "full": [
            "stable-baselines3>=2.0.0",
            "torch>=2.0.0",
            "tensorboard>=2.8.0",
        ],
        "dev": [
            "pytest>=7.0.0",
            "black>=22.1.0",
            "isort>=5.10.0",
            "mypy>=0.931",
        ],
    },
    author="delartificial",
    author_email="",
    description="Python SDK for React Three Agents - RL in 3D environments",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/delartificial/react-three-agents",
    project_urls={
        "Bug Tracker": "https://github.com/delartificial/react-three-agents/issues",
        "Documentation": "https://github.com/delartificial/react-three-agents/tree/main/packages/sdk-python",
        "Source Code": "https://github.com/delartificial/react-three-agents",
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Software Development :: Libraries",
    ],
    keywords="reinforcement learning, react three fiber, 3d, simulation, agents",
    python_requires=">=3.8",
) 