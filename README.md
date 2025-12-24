# ReconWeb Automation Platform

ReconWeb is a full-stack web application that automates running open-source vulnerability scanners (Nikto, Gobuster, Nuclei, SQLMap, XSStrike, WPScan) against user-provided targets. The project includes a Node.js + Express API, MongoDB persistence, and a React (Vite) front-end styled with Bootstrap and Tailwind CSS.

## Features

### Core Features
- **Automated Security Scanning**: Run multiple security tools against web targets
- **Real-time Progress Tracking**: Monitor scan progress with live updates
- **Scan History**: View and manage all past scans
- **PDF Export**: Generate professional PDF reports of scan results
- **Finding Extraction**: Automatic parsing and categorization of vulnerabilities

### New Features (v2.0)

#### 1. VIP Plan Subscription
Three-tiered subscription system with different capabilities:
- **Free Plan**: 10 scans/month, 3 code reviews/day, basic tools (Nikto, Gobuster)
- **Pro Plan ($9.99/mo)**: 100 scans/month, 20 code reviews/day, advanced tools + AI Code Review
- **VIP Plan ($29.99/mo)**: Unlimited scans & reviews, all tools, auto-remediation suggestions

#### 2. AI-Powered Secure Code Review
- Submit code snippets for security analysis
- Supports JavaScript, TypeScript, Python, Java, PHP, C#, Go, Ruby, SQL, HTML
- Powered by Google Gemini AI
- Identifies vulnerabilities like SQL injection, XSS, authentication issues
- Provides fix recommendations with code examples

#### 3. Automated Remediation Suggestions
- Basic remediation guidance for all plans
- AI-powered detailed remediation for VIP subscribers
- Step-by-step fix instructions
- Code examples for common vulnerabilities
- Compliance notes (OWASP, PCI-DSS, GDPR)

## Project Structure

- `server/`: Express API, authentication, scan orchestration, MongoDB models.
- `client/`: React front-end with auth flows, scan configuration UI, history and export views.
- `docker-compose.yml`: Container orchestration for MongoDB, API, and web UI services.

## Environment Variables

### Server
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/reconweb
JWT_SECRET=your-secret-key
CLIENT_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your-gemini-api-key  # Required for AI features
```

### Client
```bash
VITE_API_URL=http://localhost:5000
```

## Local Development

```bash
# install dependencies
npm install
npm install --prefix server
npm install --prefix client

# run backend and frontend together
npm run dev
```

Copy `.env.example` files to `.env` and fill in secrets before launching:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

## Docker Deployment

1. Ensure Docker Engine and Docker Compose plugin are installed.
2. Build and start the stack:

   ```bash
   docker compose up --build
   ```

   - API reachable at `http://localhost:5000/api`
   - Web UI served at `http://localhost:4173`
   - MongoDB exposed on `mongodb://localhost:27017`

3. Override defaults by editing environment values in `docker-compose.yml` or by supplying a `.env` file consumed by Compose.

### Scanner Binaries Inside the API Container

The API executes external scanners. Extend `server/Dockerfile` to install the required binaries (e.g., Nikto, Gobuster, Nuclei, SQLMap, XSStrike, WPScan) for your environment. Uncomment and modify the `apt-get`/`pip` commands in that file or add additional steps to fetch the latest releases.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Scans
- `POST /api/scans` - Create new scan
- `GET /api/scans` - List all scans
- `GET /api/scans/:id` - Get scan details
- `GET /api/scans/:id/export` - Export scan (json, txt, pdf)

### Subscription
- `GET /api/subscription/plans` - Get all plans
- `GET /api/subscription/status` - Get user's subscription status
- `POST /api/subscription/upgrade` - Upgrade plan
- `POST /api/subscription/cancel` - Cancel subscription

### Code Review
- `POST /api/code-review/review` - Submit code for review
- `GET /api/code-review/history` - Get review history
- `GET /api/code-review/:id` - Get specific review
- `GET /api/code-review/stats` - Get review statistics

### Remediation
- `GET /api/remediation/scan/:id` - Get AI remediation (VIP only)
- `GET /api/remediation/basic/:id` - Get basic remediation
- `GET /api/remediation/tips/:severity` - Get quick tips

## Production Build

- API: `npm run start --prefix server`
- Client: `npm run build --prefix client` followed by hosting the `client/dist` directory using a static web server.

## Scripts

- `npm run dev` – concurrently starts API (`server`) and client (`client`) with hot reloads.
- `npm run dev:server` – API only.
- `npm run dev:client` – front-end only.

## License

This project is provided as-is. Replace `JWT_SECRET` and review security posture prior to production deployment.
