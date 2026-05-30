# Deployment Guide: Hosting on Railway

This guide walks you through deploying the unified **Clothes Renting Platform** to [Railway](https://railway.app/).

---

## Architecture Overview

On Railway, we will deploy the repository as a **Multi-Service Project**:
1. **Database Service**: A managed PostgreSQL database.
2. **Backend Service**: The FastAPI Python application located in `services/backend`.
3. **Frontend Service**: The Next.js web application located in `apps/web`.

---

## Step 1: Initialize Database (PostgreSQL)

1. Log in to [Railway](https://railway.app/) and create a new project.
2. Click **+ New** -> **Database** -> **Add PostgreSQL**.
3. Railway will provision a PostgreSQL instance.
4. Under the PostgreSQL service settings, note the connection credentials. Railway automatically provides a private connection variable `DATABASE_URL` that can be shared with other services.

---

## Step 2: Deploy the Backend Service

1. Click **+ New** -> **GitHub Repo** and select `clothes-renting-app`.
2. Once the service is created, go to its **Settings**:
   - **Service Name**: Rename it to `backend`.
   - **Root Directory**: Set this to `services/backend`.
   - *Railway will automatically detect the `Dockerfile` inside `services/backend` and use it to build the container.*
3. Go to **Variables** and configure the environment variables:
   - `DATABASE_URL`: Set this to `${{Postgres.DATABASE_URL}}` (this references the PostgreSQL service connection string dynamically).
   - `JWT_SECRET_KEY`: Enter a secure random string.
   - `RAZORPAY_KEY_ID`: Your Razorpay test/production key.
   - `RAZORPAY_KEY_SECRET`: Your Razorpay secret key.
   - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
   - `FACEBOOK_APP_ID`: Your Facebook/Meta App ID.
   - `FACEBOOK_APP_SECRET`: Your Facebook/Meta App Secret.
4. Go to **Settings** -> **Public Networking** and click **Generate Domain** (or bind your custom domain). This will generate an endpoint like `https://backend-production.up.railway.app`.

---

## Step 3: Initialize Database Schema & Categories

Once the backend service successfully deploys and connects to PostgreSQL:
1. In the Railway dashboard, select the `backend` service.
2. Go to the **Variables** or **Settings** tab and open the **Terminal / Console** (or use Railway CLI locally).
3. Alternatively, you can run the initialization script locally on your computer by pointing `DATABASE_URL` to the **PostgreSQL Public Connection URL**:
   ```bash
   # In your terminal
   $env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT/railway"
   .\venv\Scripts\python init_db.py
   ```
4. This script connects to the PostgreSQL database, creates the schemas/tables, and seeds the product categories.

---

## Step 4: Deploy the Next.js Frontend Service

1. Click **+ New** -> **GitHub Repo** and select `clothes-renting-app` again.
2. Once the service is created, go to its **Settings**:
   - **Service Name**: Rename it to `frontend`.
   - **Root Directory**: Set this to `apps/web`.
   - *Railway will automatically detect that this is a Next.js app, configure Nixpacks, and handle dependencies.*
3. Go to **Variables** and configure:
   - `BACKEND_URL`: Enter the private network address of your backend service (e.g. `http://backend.railway.internal:8000`). Using the internal URL keeps traffic secure and fast.
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google OAuth Client ID.
   - `NEXT_PUBLIC_FACEBOOK_APP_ID`: Facebook/Meta App ID.
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Razorpay Key ID.
4. Go to **Settings** -> **Public Networking** and click **Generate Domain** to get the public web app URL.

---

## Step 5: Verify Deployment

1. Visit your public frontend URL.
2. Check that the catalog loads products correctly (which confirms Next.js successfully proxies requests to the backend).
3. Access the API docs by visiting your backend domain at `https://your-backend.up.railway.app/docs` to verify endpoints.
