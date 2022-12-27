# GUI

> **Note**
> 
> The GUI is fairly new and is only available for the deploy command. Soon, it will be available for more commands and provide more features.

Simply pass the `--gui` flag with the command and the GUI will automatically show up.

```shell
npx fullstacked deploy --gui
```

![FullStacked GUI](https://files.cplepage.com/fullstacked/gui.png)

## SSH Connection

Enter your credentials to your remote server. Test the connection until you only get success messages. If it detects that docker isn't installed, you can try to launch the Docker Installation, but not all OS are supported. View the list of available docker isntallation scripts [here](https://github.com/cplepage/fullstacked/blob/main/utils/dockerInstallScripts.ts).

## Configuration

Each service defined by your `docker-compose` files that expose a port. Meaning they should be publicly accessible. They will be displayed with the option to give server names and extra nginx configurations. 

## SSL Certificate

Generate SSL certificate for your hostnames.  **<u>Before trying to do anything make sure every server name you will use actually points to your server.</u>** Whether with a DNS A record or CNAME record.

## Deployment

Launch your deployment 🚀🚀🚀.

## Save and Load configs

At the end of the deployment process, save your configurations to a `.fullstacked` file encrypted with a password. This way, the content of the file is unreadeable unless you have the password to decrypt. **We strongly don't recommend to commit this file in public repositories**.

## Run with CLI only

Once you have went through a first deployment using the GUI, you can run your deployment directly from the CLI with the configs password.

```shell
npx fullstacked deploy --password=my-configs-pass
```
