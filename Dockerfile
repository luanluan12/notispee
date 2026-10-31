FROM node:24-alpine
WORKDIR /app
COPY package.json app.js storage.js server.js ./
ENV NODE_ENV=production
ENV DATA_DIR=/data
EXPOSE 3000
CMD ["node", "server.js"]
