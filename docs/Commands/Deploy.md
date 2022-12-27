# Deploy

Move your web app onto a remote server. Run this command once with the GUI, set everything up like your SSH Credentials, your nginx configurations and make sure your remote server is setup with docker and docker compose v2. After you've done this, save your configs with a password and then deploy with a single command.

```
npx fullstacked deploy --password=my-config-password
```

## Flags

### `--gui`

(run it for the first deployment)

Will bring up the GUI to deploy your web app onto your remote server.

### `--password=`

If you have a `.fullstacked` file with the right configs. Pass in your password and deploy directly. This is a good approach to deploy with your CI.
