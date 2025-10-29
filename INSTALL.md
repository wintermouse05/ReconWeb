# Installation Requirements

This guide lists the runtime prerequisites and the commands needed to install each dependency when running ReconWeb locally on Linux/macOS systems. Adjust paths and package names for your distribution as needed.

## Core Prerequisites

- Node.js 20.x and npm 10+
- MongoDB 7.x (server and client binaries)
- Git (for pulling third-party repositories)
- Python 3.10+ with pip (used by XSStrike)
- Go 1.22+ (used by Gobuster and Nuclei builds)

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y \ 
  nodejs npm \ 
  mongodb-org \ 
  git python3 python3-pip \ 
  golang-go
```

> Install MongoDB from the official MongoDB APT repository if the default repo does not provide the desired version.

### macOS (Homebrew)

```bash
brew install node mongodb-community@7.0 git python go
brew services start mongodb-community@7.0
```

## Recon Tools

All scanners must be available on the API host `PATH` because the Express server spawns these binaries directly.

### Nikto

- Ubuntu/Debian: `sudo apt install nikto`
- macOS (Homebrew): `brew install nikto`

### Gobuster

```bash
# requires Go toolchain
go install github.com/OJ/gobuster/v3@latest
```

Ensure `$HOME/go/bin` (Linux/macOS) is in your `PATH`.

### Nuclei

```bash
# requires Go toolchain
go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
```

After installation, confirm availability with `which nuclei`.

### SQLMap

- Ubuntu/Debian: `sudo apt install sqlmap`
- macOS: `brew install sqlmap`

### XSStrike

```bash
python3 -m pip install --user xsstrike
```

Add `$HOME/.local/bin` (Linux) or the pip user base scripts directory to `PATH` if the binary is not found.

## Verification

After installing all dependencies, verify tool access:

```bash
which node
which mongod
which nikto
which gobuster
which nuclei
which sqlmap
which xsstrike
```

## Optional: Docker-Based Setup

If you prefer containers, edit `server/Dockerfile` to install the scanner binaries during the build stage. Uncomment the provided `apt-get` and `pip` commands and rebuild via `docker compose up --build`.
