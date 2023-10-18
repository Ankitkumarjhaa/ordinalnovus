# Use an official Node.js runtime as the base image
FROM node:16.8-slim

USER root

# Set the working directory in the container
WORKDIR /usr/src/app

ARG MONGODB_URI

ENV MONGODB_URI=$MONGODB_URI

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

# Expose port 3000
EXPOSE 3000

# CMD to run your application
CMD ["yarn", "start"]
