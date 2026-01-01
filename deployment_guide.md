# Deployment Guide

This guide explains how to deploy the **Clothes Renting Platform** to a Linux server (VPS).

## 1. Prerequisites
- A Linux server (Ubuntu 22.04 LTS recommended) with a public IP.
- A domain name pointing to your server's IP.
- SSH access to the server.

## 2. Server Setup

SSH into your server and install Docker & Docker Compose:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo apt install docker-compose -y
```

## 3. Deploy Application

### Step 1: Copy Files
Copy the project folder to your server (e.g., using `scp` or `git clone`).
Ensure you have the following files:
- `docker-compose.prod.yml`
- `nginx/nginx.conf`
- `services/` folder
- `apps/` folder
- `seed_data.py` (optional)

### Step 2: Configure Environment
Create a `.env` file in the project root if needed (currently config is inside docker-compose.prod.yml).

### Step 3: Start Application
Run the production compose file:

```bash
sudo docker-compose -f docker-compose.prod.yml up -d --build
```

## 4. Initialization

### Seed Database
Once all containers are running, you can populate the database:

```bash
# Install python requests if not present
sudo apt install python3-requests -y

# Run seed script (ensure it points to localhost/api or run inside container)
# Easiest is to run inside the catalog service container:
sudo docker exec -it clothes-renting-app-catalog-service-1 python3

# (Then paste the python seed logic or copy the script in)
```
*Alternatively, just use the Admin Panel on the deployed site to add products.*

## 5. SSL (HTTPS) - Optional but Recommended

For a real production app, install Certbot and set up SSL for Nginx.

```bash
sudo apt install certbot python3-certbot-nginx
# (Requires Nginx to be installed on host or configured differently with Certbot)
```
*Simplest approach:* Use Caddy instead of Nginx for automatic HTTPS, or mount Certbot certificates into the Nginx container.

## 6. Access
Open your browser and navigate to `http://<your-domain-or-ip>`.
- Frontend: Served on root `/`
- APIs: Proxied via `/api/...`
