# Stage 1: Build environment
FROM node:18.18-slim as builder

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and yarn.lock files
COPY package.json yarn.lock ./


# Set environment variables
ARG MONGODB_URI
ENV MONGODB_URI=$MONGODB_URI
ARG NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL

# Install dependencies
RUN apt-get update && apt-get install -y curl gnupg && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y yarn && \
    yarn install --frozen-lockfile && \
    apt-get remove -y curl gnupg && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# Copy the local source code to the container
COPY . .

# Build the Next.js application
RUN yarn run build

# Stage 2: Production environment
FROM node:18.18-slim

WORKDIR /usr/src/app

# Copy built assets from builder stage
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/package.json ./package.json


# Expose port 3000
EXPOSE 3000

# CMD to run your application
CMD ["yarn", "start"]
