# Backup & Restore

This command allow to create and load `.tar` files from your volume defined in your compose files. This way, you can keep backups of your data and/or move it from one environnement to another. If you enter ssh credentials, it will backup/restore your remote server, else it will execute it locally.

```shell
npx fullstacked backup
```

```shell
npx fullstacked restore
```

## Flags

### `--volume=`

(optional)

List the volume(s) you want to backup or restore. Split with a comma (,) for multiple.

```shell
npx fullstacked backup --volume=mongo-data,postgres-data
```

### `--backup-dir=`

(optional)

Change the default backup directory location. *(default: ./backup)*

### SSH Credentials (Soon to be deprecated in favor of the GUI)

#### `--host=`

The IP address or the hostname resolving to it.

#### `--ssh-port=`

(optional)

Port for the ssh conenction *(default: 22)*

#### `--user=`

Username for login.

#### `--pass=`

(use pass or private-key)

Password for login.

#### `--private-key-file=`

(use pass or private-key)

Private key file path for login.

#### `--app-dir=`

(optional)

FullStacked apps directory. *(default: /home)*

```shell
npx fullstacked backup --host=123.123.123.123 --user=User --private-key-file=./key.pem --app-dir=/home/User
```
