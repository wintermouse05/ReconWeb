FROM node:20-bookworm-slim AS base

WORKDIR /app

# Install system dependencies and common security tools as needed.
# Uncomment and extend the list below to include the scanning binaries required by your workflows.
# RUN apt-get update \
#     && apt-get install -y --no-install-recommends \
#        nikto \
#        gobuster \
#        sqlmap \
#        python3-pip \
#        git \
#     && rm -rf /var/lib/apt/lists/*
# RUN pip install xsstrike
# RUN go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

COPY package*.json ./
RUN npm install --omit=dev

COPY src ./src
COPY .env.example ./

ENV NODE_ENV=production
EXPOSE 5000

CMD ["npm", "run", "start"]
