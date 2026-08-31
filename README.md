# 📦 SINAG – Pepper Production E-Commerce Platform

**SINAG** is a full‑stack, production‑ready e‑commerce platform tailored for pepper production. It connects farmers, enthusiasts, and suppliers with quality equipment, seeds, and supplies through a modern, responsive web experience.

---

## 🚀 Live Demo

[sinag-store.vercel.app](https://sinag-store.vercel.app) — (replace with your actual URL)

---

## ✨ Features

### 👤 Authentication & Users

- **Multi‑role system** – Admin, Staff, Rider, Customer
- **Sign up** with email & OTP verification
- **Login** via email/password or Google OAuth
- **Forgot password** with OTP reset
- **Session management** – secure httpOnly cookies
- **Role‑based dashboard redirects**

### 🛒 Storefront

- **Product browsing** – grid with image, name, price, discount badge
- **Filters** – by category, price range, stock, search
- **Wishlist** – save favorite products
- **Cart** – add items with quantity control (min 1, max stock)
- **Responsive** – mobile‑first with bottom navigation

### 📦 Order Management

- **Order flow** – Pending → Confirmed → Preparing → Packed → Ready for Pickup → Assigned Rider → Out for Delivery → Delivered
- **Payment methods** – Cash on Delivery (COD) and GCash
- **Order history** – view past orders in profile
- **Staff dashboard** – process and manage orders
- **Rider dashboard** – manage assigned deliveries

### 👑 Admin Panel

- **Dashboard** – revenue, orders, products, users overview
- **Product management** – CRUD operations (create, read, update, delete)
- **User management** – create staff/rider accounts with password validation
- **Category & Brand management**
- **Banner management**
- **Order management** – full control over all orders

### 📱 Mobile Experience

- **Bottom navigation** – Home, Products, Notifications, Profile
- **PWA ready** – installable on Android and iOS
- **Touch‑friendly** – large tap targets, swipe gestures
- **Offline support** – service worker caches assets

### 🔔 Notifications

- **Real‑time updates** – order status changes, promotions, announcements
- **Mark as read/unread**
- **Filter** – All / Unread
- **Dropdown** – quick access from header

### 👤 User Profile

- **Personal information** – name, email, join date
- **Order history** – view all past orders
- **Wishlist** – saved items
- **Settings** – update profile

---

## 🛠️ Tech Stack

| Category             | Technology                                      |
| -------------------- | ----------------------------------------------- |
| **Framework**        | Next.js 16.3.1 (App Router + Server Components) |
| **Language**         | TypeScript 5.6.3                                |
| **Database**         | PostgreSQL (Supabase)                           |
| **ORM**              | Prisma 5.22.0                                   |
| **Authentication**   | Supabase Auth (JWT + OAuth)                     |
| **Styling**          | Tailwind CSS 4 + shadcn/ui                      |
| **Forms**            | React Hook Form + Zod validation                |
| **State Management** | Zustand + React Context                         |
| **Charts**           | Recharts                                        |
| **PWA**              | next-pwa                                        |
| **Email**            | Nodemailer + React Email                        |
| **Deployment**       | Vercel                                          |

---

## 📁 Project Structure

```
sinag-ecommerce/
├── src/
│   ├── app/
│   │   ├── (store)/          # Storefront routes
│   │   ├── (admin)/          # Admin dashboard routes
│   │   ├── api/              # API routes
│   │   ├── login/            # Login page
│   │   ├── register/         # Register page
│   │   ├── verify-otp/       # OTP verification page
│   │   ├── forgot-password/  # Password reset page
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── ui/               # shadcn components
│   │   ├── nav/              # Navigation components
│   │   ├── home/             # Home page components
│   │   ├── products/         # Product-related components
│   │   ├── notifications/    # Notification components
│   │   └── admin/            # Admin components
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client
│   │   ├── supabase.ts       # Supabase client
│   │   ├── jwt.ts            # JWT utilities
│   │   ├── validation.ts     # Form validation
│   │   ├── safe-query.ts     # Database query wrapper
│   │   └── utils.ts          # General utilities
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript type definitions
│   └── middleware.ts         # Next.js middleware
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed script
├── public/                   # Static assets
├── .env.local                # Environment variables
├── package.json
├── tailwind.config.js
├── next.config.js
└── vercel.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or bun
- Supabase account (free tier)
- PostgreSQL database (provided by Supabase)

### Installation

```bash
# Clone the repository
git clone https://github.com/sinag-support/e-commerce.git
cd e-commerce

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Push database schema
npx prisma db push

# Seed the database with sample data
npx prisma db seed

# Run the development server
npm run dev
```

---

## 📝 Environment Variables

Create a `.env.local` file with the following:

```env
# Database
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:6543/postgres?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres?sslmode=require"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# JWT
JWT_SECRET_KEY="your-jwt-secret"

# Email (for OTP)
MAIL_SMTP_SERVICE="Gmail"
MAIL_SMTP_USER="your-email@gmail.com"
MAIL_SMTP_PASS="your-app-password"

# Environment
NODE_ENV="development"
```

---

## 🧪 Testing Accounts

| Role  | Email           | Password   |
| ----- | --------------- | ---------- |
| Admin | admin@sinag.com | Admin@1234 |
| Staff | staff@sinag.com | Staff@1234 |
| Rider | rider@sinag.com | Rider@1234 |
| User  | user@sinag.com  | User@1234  |

---

## 🚢 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Environment variables** must be set in Vercel's dashboard.

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start
```

---

## 🔐 Authentication Flow

1. **Sign Up** → User fills name, email, password → OTP sent via email → Verify OTP → Account created
2. **Login** → Email/password or Google OAuth → Role check → Redirect to appropriate dashboard
3. **Forgot Password** → Enter email → OTP sent → Verify OTP → Set new password → Redirect to login

---

## 📦 Database Schema

Key models:

- **User** – roles (ADMIN, STAFF, RIDER, USER)
- **Product** – with categories, brands, images, discount
- **Order** – status, payments, shipping
- **Cart** – user‑specific cart items
- **Review** – product reviews from users
- **Banner** – homepage carousel banners

Full schema in `prisma/schema.prisma`.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT © SINAG

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) – Component library
- [Supabase](https://supabase.com/) – Backend as a Service
- [Vercel](https://vercel.com/) – Hosting
- [Unsplash](https://unsplash.com/) – Product images

---

## 📬 Contact

**SINAG Support** – [support@sinag.com](mailto:support@sinag.com)
Here's the updated `README.md` with all the new features and improvements we've added:

```markdown
# 📦 SINAG – Pepper Production E-Commerce Platform

**SINAG** is a full‑stack, production‑ready e‑commerce platform tailored for pepper production. It connects farmers, enthusiasts, and suppliers with quality equipment, seeds, and supplies through a modern, responsive web experience.

---

## 🚀 Live Demo

[sinag-store.vercel.app](https://sinag-store.vercel.app) — (replace with your actual URL)

---

## ✨ Features

### 👤 Authentication & Users

- **Multi‑role system** – Admin, Staff, Rider, Customer
- **Sign up** with email & OTP verification
- **Login** via email/password or Google OAuth
- **Forgot password** with OTP reset
- **Session management** – secure httpOnly cookies
- **Role‑based dashboard redirects**

### 🛒 Storefront

- **Product browsing** – grid with image, name, price, discount badge
- **Filters** – by category, price range, stock, search
- **Wishlist** – save favorite products
- **Cart** – add items with quantity control (min 1, max stock)
- **Responsive** – mobile‑first with bottom navigation

### 📦 Order Management

- **Order flow** – Pending → Confirmed → Preparing → Packed → Ready for Pickup → Assigned Rider → Out for Delivery → Delivered
- **Payment methods** – Cash on Delivery (COD) and GCash
- **Order history** – view past orders in profile
- **Staff dashboard** – process and manage orders
- **Rider dashboard** – manage assigned deliveries

### 👑 Admin Panel

- **Dashboard** – revenue, orders, products, users overview with charts
- **Product management** – CRUD operations with category selection and image support
- **User management** – create staff/rider accounts, edit user details, delete users
- **Category management** – create, edit, delete categories with product count
- **Banner management** – create, edit, delete homepage banners with active toggle
- **Order management** – full control over all orders with detailed view including product images
- **Role‑based sidebar** – Admin sees all pages, Staff sees Orders, Rider sees Delivery view
- **Search & filtering** – search products, users, categories, banners, and orders
- **Responsive layout** – collapsible sidebar with shadcn/ui style

### 🖼️ Product Images

- **Product images** – support for multiple product images via Unsplash or custom URLs
- **Order detail images** – view product images directly in order details
- **Image fallback** – graceful fallback when images fail to load

### 📱 Mobile Experience

- **Bottom navigation** – Home, Products, Notifications, Profile
- **PWA ready** – installable on Android and iOS
- **Touch‑friendly** – large tap targets, swipe gestures
- **Offline support** – service worker caches assets

### 🔔 Notifications

- **Real‑time updates** – order status changes, promotions, announcements
- **Mark as read/unread**
- **Filter** – All / Unread
- **Dropdown** – quick access from header

### 👤 User Profile

- **Personal information** – name, email, join date
- **Order history** – view all past orders
- **Wishlist** – saved items
- **Settings** – update profile

---

## 🛠️ Tech Stack

| Category             | Technology                                      |
| -------------------- | ----------------------------------------------- |
| **Framework**        | Next.js 16.3.1 (App Router + Server Components) |
| **Language**         | TypeScript 5.6.3                                |
| **Database**         | PostgreSQL (Supabase)                           |
| **ORM**              | Prisma 5.22.0                                   |
| **Authentication**   | Supabase Auth (JWT + OAuth)                     |
| **Styling**          | Tailwind CSS 4 + shadcn/ui                      |
| **Forms**            | React Hook Form + Zod validation                |
| **State Management** | Zustand + React Context                         |
| **Charts**           | Recharts                                        |
| **PWA**              | next-pwa                                        |
| **Email**            | Nodemailer + React Email                        |
| **Deployment**       | Vercel                                          |

---

## 📁 Project Structure
```

sinag-ecommerce/
├── src/
│ ├── app/
│ │ ├── (store)/ # Storefront routes
│ │ ├── (admin)/ # Admin dashboard routes
│ │ │ ├── admin/ # Admin pages
│ │ │ │ ├── banners/ # Banner management
│ │ │ │ ├── categories/ # Category management
│ │ │ │ ├── orders/ # Order management
│ │ │ │ ├── products/ # Product management
│ │ │ │ └── users/ # User management
│ │ │ └── layout.tsx # Admin layout with sidebar
│ │ ├── api/ # API routes
│ │ │ ├── admin/ # Admin API endpoints
│ │ │ │ ├── banners/ # Banner CRUD
│ │ │ │ ├── categories/ # Category CRUD
│ │ │ │ ├── orders/ # Order management
│ │ │ │ ├── products/ # Product CRUD
│ │ │ │ ├── stats/ # Dashboard stats
│ │ │ │ └── users/ # User management
│ │ │ └── auth/ # Authentication endpoints
│ │ ├── login/ # Login page
│ │ ├── register/ # Register page
│ │ ├── verify-otp/ # OTP verification page
│ │ ├── forgot-password/ # Password reset page
│ │ ├── layout.tsx # Root layout
│ │ └── globals.css # Global styles
│ ├── components/
│ │ ├── ui/ # shadcn components
│ │ │ ├── collapsible.tsx # Collapsible sidebar
│ │ │ └── tooltip.tsx # Tooltips
│ │ ├── nav/ # Navigation components
│ │ │ ├── admin-sidebar.tsx # Admin sidebar with role-based filtering
│ │ │ └── header.tsx # Store header
│ │ ├── admin/ # Admin components
│ │ │ └── user-management.tsx # User management component
│ │ ├── home/ # Home page components
│ │ ├── products/ # Product-related components
│ │ ├── notifications/ # Notification components
│ │ └── orders/ # Order components
│ ├── hooks/
│ │ └── use-role.ts # Role fetching hook
│ ├── lib/
│ │ ├── prisma.ts # Prisma client
│ │ ├── supabase.ts # Supabase client
│ │ ├── role.ts # Server-side role utilities
│ │ ├── jwt.ts # JWT utilities
│ │ ├── validation.ts # Form validation
│ │ ├── safe-query.ts # Database query wrapper
│ │ └── utils.ts # General utilities
│ ├── types/ # TypeScript type definitions
│ └── proxy.ts # Next.js middleware
├── prisma/
│ ├── schema.prisma # Database schema
│ └── seed.ts # Seed script
├── public/ # Static assets
├── .env.local # Environment variables
├── package.json
├── tailwind.config.js
├── next.config.ts
└── vercel.json

````

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or bun
- Supabase account (free tier)
- PostgreSQL database (provided by Supabase)

### Installation

```bash
# Clone the repository
git clone https://github.com/sinag-support/e-commerce.git
cd e-commerce

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Push database schema
npx prisma db push

# Seed the database with sample data
npx prisma db seed

# Run the development server
npm run dev
````

---

## 📝 Environment Variables

Create a `.env.local` file with the following:

```env
# Database
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:6543/postgres?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres?sslmode=require"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# JWT
JWT_SECRET_KEY="your-jwt-secret"

# Email (for OTP)
MAIL_SMTP_SERVICE="Gmail"
MAIL_SMTP_USER="your-email@gmail.com"
MAIL_SMTP_PASS="your-app-password"

# Environment
NODE_ENV="development"
```

---

## 🧪 Testing Accounts

| Role  | Email           | Password   |
| ----- | --------------- | ---------- |
| Admin | admin@sinag.com | Admin@1234 |
| Staff | staff@sinag.com | Staff@1234 |
| Rider | rider@sinag.com | Rider@1234 |
| User  | user@sinag.com  | User@1234  |

---

## 🚢 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Environment variables** must be set in Vercel's dashboard.

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start
```

---

## 🔐 Authentication Flow

1. **Sign Up** → User fills name, email, password → OTP sent via email → Verify OTP → Account created
2. **Login** → Email/password or Google OAuth → Role check → Redirect to appropriate dashboard
3. **Forgot Password** → Enter email → OTP sent → Verify OTP → Set new password → Redirect to login

---

## 📦 Database Schema

Key models:

- **User** – roles (ADMIN, STAFF, RIDER, USER)
- **Product** – with categories, images, discount, stock
- **Order** – status, payments, shipping, order items
- **OrderItem** – product references with quantity and price
- **Cart** – user‑specific cart items
- **Review** – product reviews from users
- **Banner** – homepage carousel banners
- **Category** – product categories with product count
- **Address** – user shipping addresses

Full schema in `prisma/schema.prisma`.

---

## 🎨 Admin Panel Features

### Role-Based Access

- **Admin**: Full access to all pages (Dashboard, Products, Orders, Users, Categories, Banners)
- **Staff**: Access to Orders page for processing orders
- **Rider**: Access to Orders page for managing deliveries

### Pages

- **Dashboard**: Revenue stats, order charts, low stock alerts, recent orders
- **Products**: List, create, edit, delete products with category selection and image URLs
- **Orders**: List all orders with status filtering, update order status, view order details with product images
- **Users**: List users, create staff/rider accounts, edit user details, delete users (except admin)
- **Categories**: List, create, edit, delete categories with product count
- **Banners**: List, create, edit, delete banners with image preview and active toggle

### Search & Filtering

- **Products**: Search by title or description
- **Orders**: Search by order number or customer name, filter by status
- **Users**: Search by name, email, or role
- **Categories**: Search by title or description
- **Banners**: Search by title or link

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT © SINAG

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) – Component library
- [Supabase](https://supabase.com/) – Backend as a Service
- [Vercel](https://vercel.com/) – Hosting
- [Unsplash](https://unsplash.com/) – Product images
- [Recharts](https://recharts.org/) – Charts for dashboard

---

## 📬 Contact

**SINAG Support** – [support@sinag.com](mailto:support@sinag.com)

```

---

## 📋 Summary of updates made to README

1. **Added Admin Panel section** – detailed all admin features including role-based access, pages, search & filtering
2. **Added Product Images section** – describes image support in products and orders
3. **Updated Project Structure** – reflects new files and folders (collapsible, tooltip, user-management, etc.)
4. **Added Admin Panel Features** – comprehensive list of all admin pages and their functionality
5. **Added Database Schema details** – includes OrderItem model
6. **Updated Tech Stack** – added Recharts for charts
7. **Added Search & Filtering** – detailed search capabilities across all admin pages

```
