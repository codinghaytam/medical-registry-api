#!/bin/bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

# Update system and install Java 17 plus helpers compatible with Debian 12
apt-get update
apt-get upgrade -y
apt-get install -y curl tar openjdk-17-jdk

KEYCLOAK_ADMIN_USER="admin"
KEYCLOAK_ADMIN_PASSWORD="admin"

# Download and extract Keycloak (latest stable as of Jan 2026: 26.4.7)
curl -fsSL -O https://github.com/keycloak/keycloak/releases/download/26.4.7/keycloak-26.4.7.tar.gz
tar xzf keycloak-26.4.7.tar.gz
mkdir -p /opt
mv keycloak-26.4.7 /opt/keycloak

# Create systemd service with HTTP fixes
cat <<EOF > /etc/systemd/system/keycloak.service
[Unit]
Description=Keycloak Identity and Access Management
After=network.target

[Service]
Type=simple
User=root
Group=root
Environment=KC_DB=dev-file
Environment=KC_BOOTSTRAP_ADMIN_USERNAME=${KEYCLOAK_ADMIN_USER}
Environment=KC_BOOTSTRAP_ADMIN_PASSWORD=${KEYCLOAK_ADMIN_PASSWORD}
Environment=KC_HOSTNAME_STRICT_HTTPS=false
Environment=KC_HOSTNAME_STRICT=false
Environment=KC_HTTP_ENABLED=true
ExecStart=/opt/keycloak/bin/kc.sh start-dev --http-port=8080
Restart=always
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Start and enable the service
systemctl daemon-reload
systemctl enable keycloak
systemctl start keycloak

# Wait for Keycloak to fully start (increase if needed)
sleep 90

# Authenticate kcadm locally
/opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user ${KEYCLOAK_ADMIN_USER} --password ${KEYCLOAK_ADMIN_PASSWORD}

# Disable SSL requirement in master realm
/opt/keycloak/bin/kcadm.sh update realms/master -s sslRequired=NONE --server http://localhost:8080