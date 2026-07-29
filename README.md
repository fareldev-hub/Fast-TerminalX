
<div align="center">
  
![Dev Ftermx](thumbnail/thumb.png)

# Fast-TerminalX (Ftermx)

**SSH Tunnel Application Built with Node.js**

[![npm version](https://img.shields.io/npm/v/f-termx?style=for-the-badge&color=blue)](https://www.npmjs.com/package/f-termx)
[![npm downloads](https://img.shields.io/npm/dt/f-termx?style=for-the-badge&color=green)](https://www.npmjs.com/package/f-termx)
[![npm downloads per month](https://img.shields.io/npm/dm/f-termx?style=for-the-badge&color=orange)](https://www.npmjs.com/package/f-termx)
[![License](https://img.shields.io/badge/License-Apache%202.0-red?style=for-the-badge)](LICENSE)

[![Node.js Version](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)

</div>

---

## Information

Fast-TerminalX (abbreviated **Ftermx**) is a powerful SSH tunnel application that runs seamlessly in the Node.js environment. It provides a web-based interface for managing SSH tunnels, terminals, file management, and package installations.

Key Features:
- Web-based SSH Terminal - Access your server from anywhere
- File Manager - Manage files directly from your browser
- Package Manager - Install packages with ease
- Admin Panel - Full control over users and settings
- SSH Tunneling - Support for local and ngrok tunnels
- Modern UI - Clean and intuitive interface

---

## Prerequisites

Make sure you have the following installed on your system:

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | 18+ | `node --version` |
| npm | Latest | `npm --version` |
| SSH Client | Any | `ssh -V` |

---

## Installation

### SSH Installation

If SSH is not yet installed, run the following command:

```bash
# For Debian/Ubuntu-based systems
sudo apt install openssh-client

# For CentOS/RHEL-based systems
sudo yum install openssh-clients

# For macOS
brew install openssh
```

> **Note:** For other operating systems, adjust according to your respective package manager.

### Ftermx Installation

Install Ftermx globally using npm:

```bash
npm install -g f-termx
```

![Install Ftermx](doc/step1.png)

---

## Quick Start

1. **Run Ftermx** to see the menu:
```bash
ftermx
```
![Menu](doc/step2.png)

2. **Start the application**:
```bash
ftermx start
```

![start](doc/step4.png)

3. **Select tunnel type** using arrow keys (up/down):
   - `local` - Run on local network
   - `ngrok` - Expose via ngrok tunnel

4. **Enter your preferred port** (make sure it's not in use):
![port](doc/step5.png)

5. **Access your server**:
Open your browser and navigate to:
```bash
localhost:1010
```
> Replace **1010** with your chosen port number

![result](doc/step6.png)

6. **Need help?**
```bash
ftermx -help
```

---

## Admin Access

We provide a comprehensive admin panel for managing your Ftermx instance.

**Add a new user:**
```bash
ftermx add user
```
Follow the interactive prompts, or use the Admin Panel web interface.

---

## Screenshots

### Login Page
![Login](doc/step7.png)
> Default credentials: `admin` / `admin`

### Dashboard
![Dashboard](doc/step8.png)

### Terminal Access
![Terminal](doc/step9.png)

### Package Installation
![Packages](doc/step10.png)

### Admin Panel
![Admin Panel](doc/step11.png)

### File Manager
![File Manager](doc/step12.png)

---

[![NPM Stats - f-termx](https://img.shields.io/badge/NPM%20Stats-f--termx-blue?style=for-the-badge)](https://tanstack.com/stats/npm?packageGroups=[{"packages":[{"name":"f-termx"}]}]&range=365-days&binType=daily)

[![NPM Total Downloads](https://img.shields.io/npm/dt/f-termx?style=for-the-badge&label=Total%20Downloads)](https://www.npmjs.com/package/f-termx)
[![NPM Monthly Downloads](https://img.shields.io/npm/dm/f-termx?style=for-the-badge&label=Monthly%20Downloads)](https://www.npmjs.com/package/f-termx)
[![NPM Weekly Downloads](https://img.shields.io/npm/dw/f-termx?style=for-the-badge&label=Weekly%20Downloads)](https://www.npmjs.com/package/f-termx)
[![NPM Version](https://img.shields.io/npm/v/f-termx?style=for-the-badge&label=Version)](https://www.npmjs.com/package/f-termx)

---

## License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

**What this means:**
- You can use the software for any purpose
- You can modify and distribute it
- You must include copyright and license notices
- You must document any significant changes
- You cannot use our trademarks
- You cannot hold us liable for damages

---

## Support

### Donate
If you find this project useful, consider supporting its development:

[![Donate via Saweria](https://img.shields.io/badge/Donate-Saweria-FF5C00?style=for-the-badge&logo=paypal)](https://saweria.co/farelalfareza)
[![Donate via Trakteer](https://img.shields.io/badge/Donate-Trakteer-red?style=for-the-badge)](https://trakteer.id/farel_alfarez)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-yellow?style=for-the-badge&logo=buymeacoffee)](https://www.buymeacoffee.com/yourusername)

### Connect

[![Website](https://img.shields.io/badge/Website-0056D2?style=for-the-badge&logo=googlechrome&logoColor=white)](https://farelsite.pages.dev)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/fareldev-hub)

---

<div align="center">
  
**Made with 🤍 by FarelDev**

If you like this project, don't forget to give it a star!

</div>
