# Packnexa Backend

This is the backend server for the Packnexa logistics platform, built with Node.js, Express, and TypeScript. It handles authentication, merchant management, product tracking, and more.

## 🚀 Technologies Used

- **Runtime Environment:** [Node.js](https://nodejs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database ORM:** [Prisma](https://www.prisma.io/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Validation:** [Zod](https://zod.dev/)
- **Authentication:** [JSON Web Tokens (JWT)](https://jwt.io/) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **File & Image Management:** [Multer](https://github.com/expressjs/multer) & [Cloudinary](https://cloudinary.com/)
- **Email Service:** [Nodemailer](https://nodemailer.com/)
- **Security:** [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit) (DDoS protection)
- **Utilities:** `cookie-parser`, `cors`, `dotenv`, `date-fns`, `http-status`, `chalk`

## 🛠️ Key Features

- **Multi-Role Authentication:** Secure login and registration for Admins and Merchants.
- **Merchant Management:** Complete workflow for merchant profiles and document verification.
- **Product & Logistics:** Tracking and management of package deliveries.
- **File Uploads:** Integrated with Cloudinary for secure storage of images and documents.
- **Email Notifications:** Automated emails for verification and notifications.
- **Robust Error Handling:** Centralized error helping system with consistent HTTP status codes.

## 📁 Project Structure

```bash
src/
├── app/
│   ├── modules/       # Feature-based modular structure
│   ├── middlewares/   # Custom Express middlewares (Auth, Validation)
│   ├── helper/        # Utility functions
│   ├── shared/        # Shared components and constants
│   ├── types/         # TypeScript type definitions
│   └── routes/        # Main API router
├── config/            # Environment configurations
├── emails/            # Email templates
├── app.ts             # Express app setup
└── server.ts          # Server entry point
prisma/                # Database schema and migrations
```

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd packnexa-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and add the following:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/packnexa"
JWT_SECRET="your_jwt_secret"
CLOUDINARY_NAME="your_cloudinary_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
# Add other necessary variables
```

### 4. Prisma Setup
```bash
npx prisma generate
```

### 5. Running the Application
```bash
npm run dev
```
The server will start on [http://localhost:5000](http://localhost:5000).

---
Developed for **Plutohub - Packnexa**.
# packnexa_backend
# packnexa-backend
