export default {
    // source : https://www.rockyourcode.com/how-to-install-docker-compose-v2-on-linux-2021/
    "amzn": [
        "sudo yum install docker -y",
        "sudo systemctl enable docker.service",
        "sudo systemctl start docker.service",
        "sudo chmod 666 /var/run/docker.sock",
        "sudo mkdir -p ~/.docker/cli-plugins",
        "sudo curl -sSL https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m) -o ~/.docker/cli-plugins/docker-compose",
        "sudo chmod +x ~/.docker/cli-plugins/docker-compose"
    ],
    // source : https://techglimpse.com/failed-metadata-repo-appstream-centos-8/
    "centos": [
        "if [ \"$(cat /etc/centos-release | grep 8)\" ]; then sudo sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-* ; fi",
        "if [ \"$(cat /etc/centos-release | grep 8)\" ]; then sudo sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-* ; fi"
    ],
    // https://github.com/docker/docker-install/pull/228
    "rocky": [
        "sudo dnf update -y",
        "sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo",
        "sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin",
        "sudo systemctl start docker",
        "sudo systemctl enable docker"
    ]
}
