FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 8080
CMD sed -i 's/listen       80/listen       8080/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
