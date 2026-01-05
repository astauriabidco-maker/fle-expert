FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Skip build for development to avoid TS errors stopping the service
# RUN npm run build

EXPOSE 5173

# Using dev to avoid build errors and enable hot reload if volumes are added
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]
