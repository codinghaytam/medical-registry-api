#!/bin/bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg lsb-release apt-transport-https software-properties-common

# Install Docker
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg

  echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
$(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list >/dev/null

  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

systemctl enable docker
systemctl start docker

# Pull the latest application image
/usr/bin/docker pull ${node_app_image}

cat <<EOF >/etc/systemd/system/medical-app.service
[Unit]
Description=Medical Registry API Container
After=network.target docker.service
Requires=docker.service

[Service]
Restart=always
RestartSec=10
ExecStart=/usr/bin/docker run --rm --name medical-api \
  -p 3000:3000 \
  -e PORT=3000 \
  -e S3_BUCKET_NAME=${s3_bucket} \
  -e DATABASE_HOST=${database_host} \
  -e DATABASE_NAME=${database_name} \
  -e DATABASE_USER=${database_user} \
  -e DATABASE_PASSWORD=${database_password} \
  ${node_app_image}
ExecStop=/usr/bin/docker stop medical-api

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable medical-app
systemctl start medical-app
