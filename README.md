<p align="center">
<a href="https://fullstacked.org/">
<img src="https://files.cplepage.com/fullstacked/favicon.png" alt="FullStacked Logo" width="50px" />
</a>
</p>
<h1 align="center">FullStacked</h1>
<h3 align="center">A Cloud Workspace for Web Developers</h3>

![FullStacked](https://files.cplepage.com/fullstacked/fullstacked-sharing.jpg)

## Run with Docker
```
docker run --privileged -p 8000:8000 -v workspace-data:/home fullstackedorg/workspace
```


## Environment Variables
```
AUTO_SHUTDOWN= in seconds, inactivity duration before ending process
PASS= set a password
AUTH_URL= url agains't which to authorize token generation
REVOKE_URL= url to poke on logout
LOGOUT_REDIRECT= page to redirect to after logging out
STORAGE_ENDPOINT= default is FullStacked Cloud, define another storage server endpoint
USE_CLOUD_CONFIG= use cloud configs
CONFIG_FILE= default $HOME/.fullstacked, but use another for different server without overwriting
FORCE_PORT_USAGE= force the usage of port instead of subdomains
```
