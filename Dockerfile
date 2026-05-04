FROM dhi.io/node:24-alpine3.23-dev AS deps

WORKDIR /app

COPY package.json package-lock.json ./

# Install project deps with frozen lockfile for reproducible builds
RUN if [ -f package-lock.json ]; then \
    npm ci --no-audit --no-fund; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

FROM dhi.io/node:24-alpine3.23-dev AS builder

# Set working directory
WORKDIR /app

# Copy project deps from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
COPY . .

ENV NODE_ENV=production

RUN if [ -f package-lock.json ]; then \
    npm run build; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

FROM dhi.io/node:24-alpine3.23 AS runner

# Set working directory
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Dane testowe, które są potrzebne do działania aplikacji. 
# W praktyce, w środowisku produkcyjnym, dane te powinny być 
# przechowywane w bazie danych lub dostarczane przez API.
COPY ./data/flights.json ./data/flights.json

USER node

# Expose port 3000 to allow HTTP traffic
EXPOSE 3000

CMD ["node", "server.js"]