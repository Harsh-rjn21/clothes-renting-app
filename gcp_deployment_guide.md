# Deploying to Google Cloud Platform (GCP)

This guide walks you through pushing your code to GitHub and deploying it to a **Google Compute Engine (GCE)** virtual machine.

## Part 1: Push to GitHub

1.  **Initialize Git**:
    Open your terminal in the project root (`clothes-renting-app`) and run:
    ```bash
    git init
    git add .
    git commit -m "Initial commit of Clothes Renting Platform"
    ```

2.  **Create Repository**:
    - Go to [GitHub.com](https://github.com) and create a new repository (e.g., `clothes-renting-app`).
    - **Note**: If you make it **Private**, you will need to set up SSH keys or use a Personal Access Token on the server later. For simplicity, we assume a **Public** repo, or you know how to clone private repos.

3.  **Push Code**:
    Execute the commands GitHub provides (replace `<your-username>` with your actual username):
    ```bash
    git branch -M main
    git remote add origin https://github.com/<your-username>/clothes-renting-app.git
    git push -u origin main
    ```

## Part 2: Set up Google Cloud VM

1.  **Create an Account/Project**:
    - Go to [console.cloud.google.com](https://console.cloud.google.com/).
    - Create a new project.

2.  **Create VM Instance**:
    - Navigate to **Compute Engine** > **VM instances**.
    - Click **Create Instance**.
    - **Name**: `clothes-renting-server`
    - **Region**: Choose one close to you (e.g., `us-central1`, `asia-south1`).
    - **Machine Type**: `e2-medium` (2 vCPU, 4GB memory) is recommended for running 5 containers. `e2-micro` might run out of memory.
    - **Boot Disk**: Switch to **Ubuntu** (select **Ubuntu 22.04 LTS**). Increase size to **20 GB**.
    - **Firewall**: Check both boxes:
        - [x] Allow HTTP traffic
        - [x] Allow HTTPS traffic
    - Click **Create**.

3.  **Reserve Static IP (Optional but Recommended)**:
    - Go to **VPC network** > **External IP addresses**.
    - Find your VM's IP and change Type from "Ephemeral" to "Static".

## Part 3: Deploy on the VM

1.  **Connect to VM**:
    - On the VM Instances page, click the **SSH** button next to your instance. A browser terminal window will open.

2.  **Install Docker & Compose**:
    Copy and paste these commands into the SSH window:
    ```bash
    # Update packages
    sudo apt update && sudo apt upgrade -y

    # Install Docker
    sudo apt install docker.io -y
    sudo systemctl start docker
    sudo systemctl enable docker

    # Install Docker Compose Standalone
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Verify installation
    docker-compose --version
    ```

3.  **Clone Your Repository**:
    ```bash
    git clone https://github.com/<your-username>/clothes-renting-app.git
    cd clothes-renting-app
    ```

4.  **Run the Application**:
    ```bash
    # Run using the production compose file
    sudo docker-compose -f docker-compose.prod.yml up -d --build
    ```

5.  **Initialize Database**:
    Wait a minute for the containers to start, then seed the database:
    ```bash
    # Only need to do this once
    sudo docker exec -it clothes-renting-app-catalog-service-1 python3 seed_data.py
    # (Note: You might need to copy seed_data.py content or ensure it's in the container if the command above fails. 
    # Alternatively, just use the 'seed_data.py' from the host but pointing to localhost:80 works too).
    # Since the seed script uses 'requests', install it inside container if missing:
    sudo docker exec -it clothes-renting-app-catalog-service-1 pip install requests
    sudo docker exec -it clothes-renting-app-catalog-service-1 python3 seed_data.py
    ```

## Part 4: Access Your Site

1.  Go to the VM Instances page in Google Cloud Console.
2.  Copy the **External IP** of your instance.
3.  Open `http://<YOUR_EXTERNAL_IP>` in your browser.
    - You should see the landing page!
