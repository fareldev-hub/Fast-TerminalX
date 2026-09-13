<div align="center">

<img src="thumbnail/thumb.png">

# Fast-TerminalX (Ftermx)

**SSH Tunnel Application Built with Node.js**

[![npm version](https://img.shields.io/npm/v/f-termx?style=for-the-badge&color=blue)](https://www.npmjs.com/package/f-termx)
[![npm downloads](https://img.shields.io/npm/dt/f-termx?style=for-the-badge&color=green)](https://www.npmjs.com/package/f-termx)
[![npm downloads per month](https://img.shields.io/npm/dm/f-termx?style=for-the-badge&color=orange)](https://www.npmjs.com/package/f-termx)
[![License](https://img.shields.io/badge/License-Apache%202.0-red?style=for-the-badge)](LICENSE)

[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)

</div>

---

Fast-Terminalx (or ftermx) is a terminal tool for Node.js-based server tunneling.

You can use Railway for the installation:
Railway is a versatile cloud platform and Platform as a Service (PaaS) that allows developers to quickly deploy web applications, servers, databases, and other full-stack services without having to manually manage infrastructure.

## Workflow
![doc](workflow.png)

Here is how to get a free 30-day VPS on Railway and connect it to ftermx:

First, ensure you have a Railway account; you can log in by visiting https://railway.com. Once you are on the Railway dashboard, click the **New** button in the top-right corner.

![doc](doc/step1.png)

After that, select the **Template** section.

![doc](doc/step2.png)

Perform a search:
```bash
ttyd debian
```
![doc](doc/step3.png)
> For the OS, you can use other templates such as Ubuntu, Debian, Kali Linux, Parrot OS, Arch Linux, and so on if available on Railway.

SNext, select the Debian template.

![doc](doc/step4.png)

Once you have selected the template, you will be directed to the preview page; configure it first by clicking the "Configure" button.

![doc](doc/step5.png)

In the configuration section, the username and password fields are mandatory; once filled in, save the configuration and click the deploy button.

![doc](doc/step6.png)
![doc](doc/step7.png)

Once that is complete, we move on to the process stages.

![doc](doc/step8.png)

This usually takes quite a long time; wait until the process completes successfully and turns green.

![doc](doc/step9.png)

Once the process is complete, the next step is to scroll sideways along the top navigation bar until you find the **settings** button.

![doc](doc/step10.png)

Click the settings button, then locate the Networking section to change the link and configure the port.

![doc](doc/step11.png)

Once you have obtained the public networking section, the next step is to rename the link to your preference by clicking the button with the pen icon.

![doc](doc/step12.png)

Once finished, click the **update** button again; leave the port at the default 8080.

![doc](doc/step13.png)

Next, add a new domain for the Ftermx website.

![doc](doc/step14.png)

In this section, assign a name for the URL and set the port to 1010; once done, click the **update** button again.

![doc](doc/step15.png)

Then, click the URL in the first section.

![doc](doc/step16.png)

Upon accessing the URL, you will be prompted to enter a username and password; use the credentials you specified during the configuration stage.

![doc](doc/step17.png)

If the display looks like this, you have successfully accessed the VPS terminal; however, since this is just a raw terminal without a UI, *ftermx* is needed to provide a web-based terminal interface.

![doc](doc/step18.png)

In the terminal, you need to install several packages required to run ftermx; execute all the following commands:

```bash 
apt-get update
```
```bash
apt install tmux
```
```bash
apt install nodejs
```
```bash
apt install npm
```
```bash
apt install openssh
```
Or
```bash
apt install ssh
```

Once all those packages have been installed, the next step is to install ftermx; run the following command:

```bash
npm install -g f-termx
```

Then run the command.
```bash
ftermx
```

![doc](doc/step19.jpg)

The image above shows the ftermx interface; to run the port, select the **start server** menu option and press Enter.

Alternatively, you can run it directly by typing:

```bash
ftermx start
```
Or
```bash
ftermx start --port 1010
```

Next, press Enter to select either 'local' or 'ngrok' (depending on your needs); using 'local' is recommended, then press Enter.

![doc](doc/step20.jpg)

After pressing Enter, the next step is to enter port 1010, matching the port configuration you set up in Railway. Once that is done, return to the Public Networking section of the Railway page and click the second URL to access ftermx.

![doc](doc/21.jpg)

![doc](doc/step22.png)

Once the URL has been successfully accessed, you will be redirected to the login page; the default settings are:

Username
```bash
admin
```

Password
```bash
admin
```

![doc](doc/login.png)

Once the login is successful, you will enter the admin dashboard page.

![doc](doc/step23.png)

Hopefully, these tools will assist you and simplify your tasks, particularly in managing servers or VPS instances.

Thank you for using ftermx. If you encounter any issues or bugs, please report them to the developers via the links or contact details provided on the fareldev-hub GitHub repository; we are committed to continuously improving ftermx.

## Support

If you find this project useful, consider supporting its development:

[![Donate via Saweria](https://img.shields.io/badge/Donate-Saweria-FF5C00?style=for-the-badge&logo=paypal)](https://saweria.co/farelalfareza)
[![Donate via Trakteer](https://img.shields.io/badge/Donate-Trakteer-red?style=for-the-badge)](https://trakteer.id/farel_alfarez)

### Connect

[![Website](https://img.shields.io/badge/Website-0056D2?style=for-the-badge&logo=googlechrome&logoColor=white)](https://farelsite.pages.dev)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/fareldev-hub)

---

<div align="center">
  
**Made with 🤍 by FarelDev**

If you like this project, don't forget to give it a star!

</div>

