# Sử dụng image node 14.18.1
FROM node:14.18.1

# Tạo thư mục /app trong container và sử dụng làm thư mục làm việc
WORKDIR /app

# Copy package.json và package-lock.json vào thư mục /app trên container
COPY package*.json ./

# Cài đặt các package và dependency của ứng dụng
RUN npm install

# Copy tất cả các file trong thư mục hiện tại vào thư mục /app trên container
COPY . .

# Chạy command để build version của ứng dụng
RUN npm run build

# Expose port 9000 của container
EXPOSE 9000

# Khởi động ứng dụng
CMD [ "npm", "run", "start" ]
