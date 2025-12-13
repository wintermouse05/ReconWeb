# ReconWeb Automation Platform

ReconWeb is a full-stack web application that automates running open-source vulnerability scanners (Nikto, Gobuster, Nuclei, SQLMap, XSStrike) against user-provided targets. The project includes a Node.js + Express API, MongoDB persistence, and a React (Vite) front-end styled with Bootstrap and Tailwind CSS.

## Project Structure

- `server/`: Express API, authentication, scan orchestration, MongoDB models.
- `client/`: React front-end with auth flows, scan configuration UI, history and export views.
- `docker-compose.yml`: Container orchestration for MongoDB, API, and web UI services.

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

The API executes external scanners. Extend `server/Dockerfile` to install the required binaries (e.g., Nikto, Gobuster, Nuclei, SQLMap, XSStrike) for your environment. Uncomment and modify the `apt-get`/`pip` commands in that file or add additional steps to fetch the latest releases.

## Production Build

- API: `npm run start --prefix server`
- Client: `npm run build --prefix client` followed by hosting the `client/dist` directory using a static web server.

## Scripts

- `npm run dev` – concurrently starts API (`server`) and client (`client`) with hot reloads.
- `npm run dev:server` – API only.
- `npm run dev:client` – front-end only.

## License

This project is provided as-is. Replace `JWT_SECRET` and review security posture prior to production deployment. (Tuan -branch)
