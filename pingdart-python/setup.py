from setuptools import setup, find_packages

setup(
    name="pingdart-sdk",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "requests>=2.25.1",
    ],
    author="PingDart",
    description="Official Python SDK for the PingDart platform",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires='>=3.6',
)
