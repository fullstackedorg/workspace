# Restore

### Command
```shell
npx fullstacked restore
```
Restore your docker compose defined volumes. You can do it locally or remotely.

### Flags
| Flag                                            | Description                                                                                                                                           |
|-------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| *--volume=*  &nbsp;                             | Define the volumes you want to backup. If voided, all volumes will be backed up.                                                                      |
| ---------------                                 | **For remote restoration, add your ssh credentials**                                                                                                  |
| --host=                                         | Your remote host instance address.<br />e.g., `--host=55.30.44.223` or `--host=example.com`                                                           |
| --user=                                         | Your ssh user name. e.g., `--user=ec2-user`                                                                                                           |
| --pass=                                         | Your ssh password. e.g., `--pass=foobar`<br />Use this or a private key file to authenticate on your remote host.                                     |
| --private-key=  &nbsp;<br />--private-key-file= | Your ssh private key. e.g., <br />`--private-key-file=/Users/me/SSHPrivateKey.pem` <br /> Use this or a password to authenticate on your remote host. |
| --app-dir=                                      | Where you want to put your app inside your remote host.<br />e.g.,`--app-dir=/home/ec2-user`                                                          |
