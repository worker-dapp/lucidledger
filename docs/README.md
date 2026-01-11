# LucidLedger Documentation

This folder contains detailed implementation plans, technical documentation, and operational guides for the LucidLedger platform.

## Contents

### Deployment & Operations

- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Complete checklist for transitioning from demo mode to production deployment (includes demo mode toggle and SEO configuration)
- **[CI_CD_SETUP.md](./CI_CD_SETUP.md)** - Automated CI/CD pipeline setup and GitHub Actions workflows
- **[DOCKER_SETUP.md](./DOCKER_SETUP.md)** - Docker container configuration and management for local development and production
- **[NGINX_SETUP.md](./NGINX_SETUP.md)** - Nginx reverse proxy configuration with SSL/HTTPS support
- **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** - Environment variable configuration for development and production

### Project Governance & Community

- **[GOVERNANCE.md](./GOVERNANCE.md)** - Development governance, leadership structure, and workflow policies
- **[CONTRIBUTORS.md](./CONTRIBUTORS.md)** - Recognition of all project contributors

## Project Documentation

- **[CLAUDE.md](../CLAUDE.md)** (root) - Claude Code instructions and project overview
- **[README.md](../README.md)** (root) - Project setup and getting started guide
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** (root) - How to contribute to the project
- **[CODEOWNERS](../.github/CODEOWNERS)** (.github) - Code review requirements and ownership

## Documentation Quick Links

**Getting Started:**
1. [Environment Setup](./ENVIRONMENT_SETUP.md) - Configure your environment variables
2. [Docker Setup](./DOCKER_SETUP.md) - Run the application locally with Docker

**Deployment:**
1. [Production Checklist](./PRODUCTION_CHECKLIST.md) - Deploy to production
2. [CI/CD Setup](./CI_CD_SETUP.md) - Configure automated deployments
3. [Nginx Setup](./NGINX_SETUP.md) - Set up reverse proxy and SSL

## Contributing

When adding new documentation:
1. Create clear, descriptive filenames (kebab-case)
2. Include table of contents for longer documents
3. Add entry to this README under the appropriate section
4. Cross-reference related documents
5. Include last updated date and version number
