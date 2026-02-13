# Upgrade Docker Compose on EC2

## Problem
EC2 instance uses Docker Compose v1 (`docker-compose`) which has been end-of-life since July 2023 and no longer receives security patches. Local development uses v2 (`docker compose`) via Docker Desktop.

## What to do

### 1. Install Docker Compose v2 plugin on EC2
```bash
ssh -i <pem-path> ubuntu@3.131.3.144
sudo apt update && sudo apt install docker-compose-plugin
docker compose version  # verify it works
```

### 2. Update deploy.yml workflow
Replace all `docker-compose` (hyphenated) references with `docker compose` (space):
- `docker-compose -f docker-compose.nginx.yml down`
- `docker-compose -f docker-compose.nginx.yml up -d --build`
- `docker-compose -f docker-compose.nginx.yml ps`
- `docker-compose -f docker-compose.nginx.yml logs`

### 3. Optionally remove v1
```bash
sudo apt remove docker-compose  # or pip uninstall docker-compose
```

### 4. Test
Trigger a deploy and verify everything works with v2.
