# Deploy

Ship your web app in production mode onto a remote server. Run this command once with the GUI, save your configs with a password and then deploy with a single command. More about this [here](../Deploy/GUI.md).

```shell
npx fullstacked deploy
```

## Flags

### `--gui`

(run it for the first deployment)

Will bring up the GUI to deploy your web app onto your remote server.

### `--password=`

If you have a `.fullstacked` file in your project root directory, pass in your password and deploy directly. This is a good approach to deploy with your CI.

```shell
npx fullstacked deploy --password=my-configs-pass
```
