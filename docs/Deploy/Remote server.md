# Choosing a remote server

To deploy to a remote server, you will need the ssh credentials to connect to it. Here is an example on how to get this information using Amazon Lightsail service.

Get your IP address, username and SSH key file from the dashboard. The port is the default (`22`) and the app directory must be `/home/ec2-user` because of AWS default file permissions.

![Lightsail SSH](https://files.cplepage.com/fullstacked/lightsail-ssh.png)

From there, you should be good to connect to the remote server and go along with the deployment. 

If you are using another cloud provider, try to locate the same information somewhere. We will try to populate our documentation with more guides eventually.

You can also use your own webserver, but FullStacked won't cover and is not responsible for your home networking. Be aware of what ports and vulnerability you are opening.
