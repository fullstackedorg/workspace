export default {
    // https://www.rockyourcode.com/how-to-install-docker-compose-v2-on-linux-2021/
    "Amazon Linux 2": [
        "sudo yum install docker -y",
        "sudo systemctl enable docker.service",
        "sudo systemctl start docker.service",
        "sudo chmod 666 /var/run/docker.sock",
        "sudo mkdir -p ~/.docker/cli-plugins",
        "sudo curl -sSL https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m) -o ~/.docker/cli-plugins/docker-compose",
        "sudo chmod +x ~/.docker/cli-plugins/docker-compose"
    ],
    // https://docs.docker.com/engine/install/ubuntu/
    "Ubuntu" : [
        "sudo apt-get update",
        "sudo apt-get install ca-certificates curl gnupg lsb-release -y",
        "sudo mkdir -p /etc/apt/keyrings",
        "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg",
        "sudo apt-get update",
        "echo \"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable\" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null",
        "sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y"
    ],
    // https://docs.docker.com/engine/install/debian/
    "Debian" : [
        "sudo apt-get update",
        "sudo apt-get install  ca-certificates  curl  gnupg  lsb-release -y",
        "sudo mkdir -p /etc/apt/keyrings",
        "curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg",
        "echo \"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable\" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null",
        "sudo apt-get update",
        "sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y"
    ]
}
