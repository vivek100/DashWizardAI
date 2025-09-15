#!/usr/bin/env python3
"""Setup configuration for Dashboard Analysis Agent package."""

from setuptools import setup, find_packages

# Read requirements
with open('requirements.txt', 'r', encoding='utf-8') as f:
    requirements = f.read().splitlines()

# Read README
with open('README.md', 'r', encoding='utf-8') as f:
    long_description = f.read()

setup(
    name='dashboard-agent',
    version='1.0.0',
    packages=find_packages(),
    author='AI Assistant',
    description='A self-calling AI agent for dashboard analysis using LangGraph.',
    long_description=long_description,
    long_description_content_type='text/markdown',
    install_requires=requirements,
    python_requires='>=3.9',
    package_data={
        'agent': ['**/*'],
    },
    include_package_data=True,
) 