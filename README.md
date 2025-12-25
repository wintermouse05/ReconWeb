# ReconWeb - Web Vulnerability Scanning Platform

<div align="center">

![ReconWeb Logo](https://img.shields.io/badge/ReconWeb-Security%20Scanner-blue?style=for-the-badge&logo=security)

[![Node.js](https://img.shields.io/badge/Node.js-20+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7+-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=flat-square&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

**ReconWeb** is a full-stack web application that automates running open-source vulnerability scanners against user-provided targets. It provides a modern UI for configuring scans, tracking progress in real-time, and generating professional reports.

[Features](#features) • [Quick Start](#quick-start) • [Installation](#installation) • [API Docs](#api-endpoints) • [Contributing](#contributing)

</div>

---

## 📋 Table of Contents

- [Features](#features)
- [Supported Security Tools](#supported-security-tools)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Installation](#installation)
  - [Docker (Recommended)](#docker-deployment-recommended)
  - [Local Development](#local-development)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### Core Features
- 🔍 **Automated Security Scanning** - Run multiple security tools against web targets
- 📊 **Real-time Progress Tracking** - Monitor scan progress with live updates
- 📜 **Scan History** - View and manage all past scans with filtering
- 📄 **Export Reports** - Generate PDF, JSON, and TXT reports
- 🎯 **Finding Extraction** - Automatic parsing and categorization of vulnerabilities
- 🔐 **User Authentication** - Secure JWT-based authentication

### Subscription Plans
| Feature | Free | Pro ($9.99/mo) | VIP ($29.99/mo) |
|---------|------|----------------|-----------------|
| Scans/Month | 10 | 100 | Unlimited |
| Code Reviews/Day | 3 | 20 | Unlimited |
| Basic Tools | ✅ | ✅ | ✅ |
| Advanced Tools | ❌ | ✅ | ✅ |
| AI Code Review | ❌ | ✅ | ✅ |
| Auto Remediation | ❌ | ❌ | ✅ |

### Advanced Features
- 🤖 **Secure Code Review** - Pattern-based security analysis for 10+ languages
- 🔧 **Remediation Suggestions** - Rule-based fix recommendations with code examples
- 📈 **Risk Scoring** - Automatic severity classification and risk assessment

---

## 🛠 Supported Security Tools

| Tool | Description | Category |
|------|-------------|----------|
| **Nikto** | Web server scanner | Web Security |
| **Gobuster** | Directory/DNS brute-forcer | Enumeration |
| **Nuclei** | Template-based vulnerability scanner | Vulnerability |
| **SQLMap** | SQL injection detection | Database |
| **XSStrike** | XSS detection suite | Web Security |
| **WPScan** | WordPress vulnerability scanner | CMS Security |

---

## 🏗 Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js 5
- **Database**: MongoDB 7+
- **Authentication**: JWT + bcrypt

### Frontend
- **Framework**: React 18 + Vite
- **UI Library**: React Bootstrap
- **Styling**: Tailwind CSS
- **HTTP Client**: Fetch API

### DevOps
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (production)
- **Process Manager**: Node.js native

---

## 🚀 Quick Start

### Using Docker (Fastest)

```bash
# Clone the repository
git clone https://github.com/wintermouse05/ReconWeb.git
cd ReconWeb

# Start all services
docker compose up --build

# Access the application
# Frontend: http://localhost:3000
# API: http://localhost:5000/api
```

### Using npm

```bash
# Clone and install
git clone https://github.com/wintermouse05/ReconWeb.git
cd ReconWeb
npm install
npm install --prefix server
npm install --prefix client

# Setup environment
cp server/.env.example server/.env
# Edit server/.env with your settings

# Start development servers
npm run dev
```

---

## 📦 Installation

### Prerequisites

- **Node.js** 20.x or higher
- **MongoDB** 7.x or higher
- **Docker** & **Docker Compose** (for containerized deployment)
- **Security Tools** (for local development):
  - Nikto, Gobuster, SQLMap, WPScan, XSStrike, Nuclei

### Docker Deployment (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/wintermouse05/ReconWeb.git
   cd ReconWeb
   ```

2. **Configure environment** (optional)
   ```bash
   # Create .env file for docker-compose
   echo "JWT_SECRET=$(openssl rand -base64 32)" > .env
   ```

3. **Build and start containers**
   ```bash
   docker compose up --build -d
   ```

4. **Verify deployment**
   ```bash
   # Check container status
   docker compose ps
   
   # View logs
   docker compose logs -f
   ```

5. **Access the application**
   - **Frontend**: http://localhost:3000
   - **API**: http://localhost:5000/api
   - **MongoDB**: mongodb://localhost:27017

### Local Development

1. **Install system dependencies** (Ubuntu/Debian)
   ```bash
   # Security tools
   sudo apt update
   sudo apt install -y nikto gobuster sqlmap wpscan
   
   # Install Go for Nuclei
   sudo apt install -y golang-go
   go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest
   echo 'export PATH=$PATH:$HOME/go/bin' >> ~/.bashrc
   source ~/.bashrc
   
   # Install XSStrike
   sudo pip3 install xsstrike --break-system-packages
   # Or from source:
   git clone https://github.com/s0md3v/XSStrike.git /opt/XSStrike
   sudo ln -sf /opt/XSStrike/xsstrike.py /usr/local/bin/xsstrike
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   npm install --prefix server
   npm install --prefix client
   ```

3. **Configure environment**
   ```bash
   cp server/.env.example server/.env
   ```
   
   Edit `server/.env`:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/reconweb
   JWT_SECRET=your-super-secret-key-min-32-characters
   CLIENT_ORIGIN=http://localhost:5173
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d --name mongodb -p 27017:27017 mongo:7
   
   # Or using system service
   sudo systemctl start mongod
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - **Frontend**: http://localhost:5173
   - **API**: http://localhost:5000/api

---

## ⚙️ Configuration

### Server Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/reconweb` |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `CLIENT_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:5173` |
| `NODE_ENV` | Environment mode | `development` |

### Client Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:5000/api` |

---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user info |

### Scans
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scans/tools/installed` | Get installed tools |
| POST | `/api/scans` | Create new scan |
| GET | `/api/scans` | List all scans |
| GET | `/api/scans/:id` | Get scan details |
| GET | `/api/scans/:id/export` | Export scan (json/txt/pdf) |

### Subscription
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscription/plans` | Get all plans |
| GET | `/api/subscription/status` | Get subscription status |
| POST | `/api/subscription/upgrade` | Upgrade plan |

### Code Review
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/code-review/review` | Submit code for review |
| GET | `/api/code-review/history` | Get review history |
| GET | `/api/code-review/:id` | Get specific review |
| DELETE | `/api/code-review/:id` | Delete review |

### Remediation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/remediation/scan/:id` | Get AI remediation (VIP) |
| GET | `/api/remediation/basic/:id` | Get basic remediation |
| GET | `/api/remediation/tips/:severity` | Get quick tips |

---

## 📁 Project Structure

```
ReconWeb/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page components
│   │   ├── context/           # React context providers
│   │   ├── services/          # API client
│   │   ├── constants/         # Tool definitions
│   │   └── App.jsx            # Root component
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── server/                    # Express Backend
│   ├── src/
│   │   ├── config/            # Database config
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Auth middleware
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   └── index.js           # Entry point
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── docker-compose.yml         # Container orchestration
├── package.json               # Root package (scripts)
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

This tool is intended for **authorized security testing only**. Always obtain proper authorization before scanning any systems you do not own. The developers are not responsible for any misuse of this software.

---

## 🙏 Acknowledgments

- [Nikto](https://github.com/sullo/nikto) - Web server scanner
- [Gobuster](https://github.com/OJ/gobuster) - Directory brute-forcer
- [Nuclei](https://github.com/projectdiscovery/nuclei) - Vulnerability scanner
- [SQLMap](https://github.com/sqlmapproject/sqlmap) - SQL injection tool
- [XSStrike](https://github.com/s0md3v/XSStrike) - XSS detection
- [WPScan](https://github.com/wpscanteam/wpscan) - WordPress scanner

---

<div align="center">

**Made with ❤️ for the security community**

[⬆ Back to Top](#reconweb---web-vulnerability-scanning-platform)

</div>
