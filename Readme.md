# 📦 Quản lý mượn/trả Lab thông qua QR Code. Quản lý bảo trì

## 📖 Giới thiệu
**Chuyên đề phát triển phần mềm** - Đại học Công nghệ Đồng Nai

---

## 👥 Thành viên nhóm

| STT | Họ và tên | MSSV |
|:---:|-----------|:----:|
| 1 | Trần Trọng Phúc | 1721030713 |
| 2 | Nguyễn Đức Thiện | 1721030943 |
| 3 | Đặng Minh Vũ | 1721030920 |

---

## 📌 Yêu cầu trước khi chạy

- Node.js (>= 18)  
- MongoDB Atlas account  

---

## 🛠️ Cài đặt dự án

### Clone project

    git clone <your-repo-url>
    cd <your-project-folder>

### Cài dependencies

    npm install

---

## ⚙️ Cấu hình Environment

### Tạo file `.env`

Tạo file `.env` trong thư mục gốc của project.

### MongoDB Atlas

- Truy cập: https://www.mongodb.com/atlas  
- Tạo tài khoản  
- Tạo cluster  
- Vào **Database → Connect → Drivers**  
- Copy connection string  
- Dán vào `MONGO_URI`  

---

## 📄 Ví dụ file `.env`

    PORT=5000
    MONGO_URI=mongodb+srv://phuctran:phuctran123@cluster0.jowbvs6.mongodb.net/lab-management?retryWrites=true&w=majority&appName=Cluster0
    JWT_SECRET=supersecret123

---

## ▶️ Chạy project

### Backend

    cd backend
    node server.js

### Frontend

    cd frontend
    npm install
    npm run dev

---

## 📦 Công nghệ sử dụng

- NodeJS  
- MongoDB  
- Express.js  

---

## 🛠️ Công cụ hỗ trợ

- Antigavity  

---

## 🔐 Lưu ý bảo mật

- Không commit file `.env` lên GitHub  
- Thêm `.env` vào `.gitignore`

    .env
    node_modules
