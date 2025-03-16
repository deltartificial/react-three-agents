from setuptools import setup, find_packages

setup(
    name="r3f_agents",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "websockets>=10.0",
        "numpy>=1.21.0",
        "gymnasium>=0.26.0",
    ],
    author="delartificial",
    author_email="",
    description="Python SDK for React Three Agents - RL in 3D environments",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    url="",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
    ],
    python_requires=">=3.8",
) 