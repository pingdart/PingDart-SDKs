import setuptools

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

required = [
    "pymysql>=1.0.0",
    "cryptography>=3.4.0",
    "requests>=2.25.0"
]

setuptools.setup(
    name="pingdartdb",
    version="1.0.1",
    author="PingDart",
    author_email="support@pingdart.com",
    description="PingDart Direct Database SDK for Python",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/pingdart/pingdart",
    package_dir={"": "src"},
    packages=setuptools.find_packages(where="src"),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.7",
    install_requires=required,
)
