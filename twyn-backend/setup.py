from setuptools import setup, find_packages

setup(
    name="twyn-backend",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "supabase",
        "openai",
        "numpy",
        "python-dotenv",
        "rich",
        "pydantic",
        "uvicorn",
        "openai-agents",
        "uvicorn",
        "plotly",
        "scipy",
        "griffe",
        "resend",
        "pandas",
        "matplotlib",
    ],
) 