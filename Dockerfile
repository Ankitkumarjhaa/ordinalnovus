# Use an official Node.js runtime as the base image
FROM node:16.8-slim

# Accept environment variables as build arguments
ARG NEXT_PUBLIC_PROVIDER
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_API
ARG API_KEY
ARG MONGODB_URI
ARG REDIS_URL

# Set the build arguments as environment variables in the image
ENV NEXT_PUBLIC_PROVIDER=$NEXT_PUBLIC_PROVIDER
ENV NEXT_PUBLIC_URL=$NEXT_PUBLIC_URL
ENV NEXT_PUBLIC_API=$NEXT_PUBLIC_API
ENV API_KEY=$API_KEY
ENV MONGODB_URI=$MONGODB_URI
ENV REDIS_URL=$REDIS_URL

# Set the working directory in the container
WORKDIR /usr/src/app

# Install git, gnupg, nano, and Playwright dependencies
RUN apt-get update && \
    apt-get install -y git nano curl gnupg libxss1 libasound2 libxtst6 libatk-bridge2.0-0 libgtk-3-0

# Install Yarn
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update && apt-get install -y yarn

# Copy the local source code to the container
COPY . .

# Install dependencies
RUN yarn install

# Install Playwright browsers
RUN npx playwright install

# Build the Next.js application
RUN yarn run build

# Install additional necessary dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libdrm2 \
    libgbm1

# Expose port 8080
EXPOSE 8080

# CMD to run your application
CMD ["yarn", "start"]
