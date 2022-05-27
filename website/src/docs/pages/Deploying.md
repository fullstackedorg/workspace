# Deploying

### Requirements
You need a server that run yum as it's package manager.
Anything like the OS in this list works :
* RHEL
* CentOS
* Rocky
* Amazon Linux 2

You will also need an SSH access with a password or with a private key file.

### Command
```shell
npx fullstacked deploy
```

### Flags
| Flag | Description |
| --- | --- |
| --host= | Your remote host instance address.<br />e.g., `--host=55.30.44.223` or `--host=example.com` |
| --user= | Your ssh user name. e.g., `--user=ec2-user` |
| --pass= | Your ssh password. e.g., `--pass=foobar`<br />Use this or a private key file to authenticate on your remote host. |
| --private-key= | Your ssh private key. e.g., `--private-key=/Users/me/SSHPrivateKey.pem` <br /> Use this or a password to authenticate on your remote host. |
| --app-dir= | Where you want to put your app inside your remote host.<br />e.g.,`--app-dir=/home/ec2-user` |
