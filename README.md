Here's the updated README.md with all the new features and the correct test accounts:

```markdown
# 📦 SINAG – Pepper Production E-Commerce Platform

**SINAG** is a full‑stack, production‑ready e‑commerce platform tailored for pepper production. It connects farmers, enthusiasts, and suppliers with quality equipment, seeds, and supplies through a modern, responsive web experience.

---

## 🚀 Live Demo

[sinag-store.vercel.app](https://sinag-store.vercel.app)

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
- **Blog** – read and engage with posts (like, comment)

### 📦 Order Management

- **Order flow** – Pending → Confirmed → Preparing → Packed → Ready for Pickup → Assigned Rider → Out for Delivery → Delivered
- **Payment methods** – Cash on Delivery (COD) and GCash
- **Order history** – view past orders in profile
- **Staff dashboard** – process and manage orders
- **Rider dashboard** – manage assigned deliveries
- **Order tracking** – real-time rider location on map (Out for Delivery status)
- **Order notifications** – customers receive notifications when order is out for delivery or delivered

### 🗺️ Delivery & Tracking

- **Live rider tracking** – customers can track their rider in real-time on a map
- **Fullscreen map** – expand map to fullscreen for better visibility
- **Store location** – admin can set store location via profile page
- **Rider location updates** – automatic GPS updates every 3 seconds
- **Map themes** – Street, Dark, and Satellite view options
- **Route visualization** – shows the delivery route from store to customer
- **Rider actions** – Start Delivery, Mark Delivered, Cancel, Return

### 👑 Admin Panel

- **Dashboard** – revenue, orders, products, users overview with charts
- **Product management** – CRUD operations with category selection and image support
- **User management** – create staff/rider accounts, edit user details, delete users
- **Category management** – create, edit, delete categories with product count
- **Banner management** – create, edit, delete homepage banners with active toggle
- **Blog management** – create, edit, delete blog posts with cover images and tags
- **Order management** – full control over all orders with detailed view including product images
- **Delivery management** – manage all deliveries with rider assignment and filtering
- **Role‑based sidebar** – Admin sees all pages, Staff sees Orders, Rider sees Delivery view
- **Search & filtering** – search products, users, categories, banners, orders, and blog posts
- **Responsive layout** – collapsible sidebar with mobile support
- **Profile management** – admin can update profile and set store location

### 🖼️ Product Images

- **Product images** – support for multiple product images via Unsplash or custom URLs
- **Order detail images** – view product images directly in order details
- **Image fallback** – graceful fallback when images fail to load

### 📱 Mobile Experience

- **Bottom navigation** – Home, Products, Notifications, Profile
- **PWA ready** – installable on Android and iOS
- **Touch‑friendly** – large tap targets, swipe gestures
- **Offline support** – service worker caches assets
- **Responsive admin panel** – full admin functionality on mobile

### 🔔 Notifications

- **Real‑time updates** – order status changes, delivery updates, promotions
- **Mark as read/unread**
- **Filter** – All / Unread
- **Delivery notifications** – customers get notified when rider starts delivery
- **Dropdown** – quick access from header

### 👤 User Profile

- **Personal information** – name, email, join date
- **Order history** – view all past orders with status tracking
- **Address management** – save and manage delivery addresses with map picker
- **Wishlist** – saved items
- **Settings** – update profile

### 📝 Blog

- **Blog posts** – create and manage blog content
- **Engagement** – like and comment on posts
- **Admin management** – create, edit, delete posts with cover images

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
| **Maps**             | Leaflet + OpenStreetMap                         |
| **PWA**              | next-pwa                                        |
| **Email**            | Nodemailer + React Email                        |
| **Deployment**       | Vercel                                          |
| **Realtime**         | Supabase Realtime (PostgreSQL changes)          |

---

## 📁 Project Structure
```

sinag-ecommerce/
├── src/
│ ├── app/
│ │ ├── (admin)/ # Admin dashboard routes
│ │ │ ├── admin/
│ │ │ │ ├── banners/ # Banner management
│ │ │ │ ├── blog/ # Blog management
│ │ │ │ ├── categories/ # Category management
│ │ │ │ ├── delivery/ # Delivery management
│ │ │ │ ├── orders/ # Order management
│ │ │ │ ├── products/ # Product management
│ │ │ │ ├── profile/ # Admin profile
│ │ │ │ ├── users/ # User management
│ │ │ │ └── page.tsx # Dashboard
│ │ │ └── layout.tsx # Admin layout with sidebar
│ │ ├── (store)/ # Storefront routes
│ │ │ ├── blog/ # Blog pages
│ │ │ ├── cart/ # Shopping cart
│ │ │ ├── checkout/ # Checkout flow
│ │ │ ├── notifications/ # User notifications
│ │ │ ├── products/ # Product catalog
│ │ │ ├── profile/ # User profile
│ │ │ │ ├── addresses/ # Address management
│ │ │ │ ├── orders/ # Order history
│ │ │ │ └── wishlist/ # Wishlist
│ │ │ └── page.tsx # Homepage
│ │ ├── api/ # API routes
│ │ │ ├── addresses/ # Address CRUD
│ │ │ ├── admin/ # Admin API endpoints
│ │ │ │ ├── banners/ # Banner CRUD
│ │ │ │ ├── blog/ # Blog CRUD
│ │ │ │ ├── categories/ # Category CRUD
│ │ │ │ ├── orders/ # Order management
│ │ │ │ ├── products/ # Product CRUD
│ │ │ │ ├── profile/ # Admin profile
│ │ │ │ ├── stats/ # Dashboard stats
│ │ │ │ └── users/ # User management
│ │ │ ├── auth/ # Authentication endpoints
│ │ │ ├── blog/ # Public blog API
│ │ │ ├── cart/ # Cart API
│ │ │ ├── notifications/ # Notification API
│ │ │ └── orders/ # Order API
│ │ ├── forgot-password/ # Password reset
│ │ ├── login/ # Login page
│ │ ├── register/ # Register page
│ │ ├── verify-otp/ # OTP verification
│ │ ├── layout.tsx # Root layout
│ │ └── globals.css # Global styles
│ ├── components/
│ │ ├── admin/ # Admin components
│ │ │ ├── address-map-picker.tsx # Map picker for addresses
│ │ │ ├── delivery-order-detail.tsx # Delivery detail dialog
│ │ │ ├── order-detail-dialog.tsx # Order detail dialog
│ │ │ ├── order-map.tsx # Map component for orders
│ │ │ └── user-management.tsx # User management
│ │ ├── home/ # Homepage components
│ │ ├── nav/ # Navigation components
│ │ │ ├── admin-sidebar.tsx # Admin sidebar
│ │ │ └── header.tsx # Store header
│ │ ├── notifications/ # Notification components
│ │ ├── products/ # Product components
│ │ ├── ui/ # shadcn/ui components
│ │ ├── theme-provider.tsx # Theme provider
│ │ └── theme-toggle.tsx # Theme toggle button
│ ├── hooks/
│ │ ├── use-mobile.ts # Mobile detection hook
│ │ └── use-role.ts # Role detection hook
│ ├── lib/
│ │ ├── prisma.ts # Prisma client
│ │ ├── supabase.ts # Supabase client
│ │ ├── jwt.ts # JWT utilities
│ │ ├── role.ts # Server-side role utils
│ │ ├── safe-query.ts # Database query wrapper
│ │ ├── utils.ts # General utilities
│ │ └── validation.ts # Form validation
│ ├── types/ # TypeScript type definitions
│ └── proxy.ts # Next.js middleware
├── prisma/
│ ├── schema.prisma # Database schema
│ └── seed.ts # Seed script
├── public/
│ └── animations/ # Lottie animations for maps
│ ├── location.json
│ ├── rider.json
│ ├── store.json
│ └── truck.json
├── package.json
├── tailwind.config.js
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

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

---

## 🧪 Testing Accounts

| Name          | Email                   | Password   | Role      |
| ------------- | ----------------------- | ---------- | --------- |
| Administrator | admin@sinag.com         | Admin@1234 | **ADMIN** |
| Store Manager | store.manager@sinag.com | Sinag@1234 | **STAFF** |
| Courier       | courier@sinag.com       | Sinag@1234 | **RIDER** |
| John Doe      | john.doe@sinag.com      | Sinag@1234 | **USER**  |
| Maria Santos  | maria.santos@sinag.com  | Sinag@1234 | **USER**  |
| Pedro Reyes   | pedro.reyes@sinag.com   | Sinag@1234 | **USER**  |

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
- **Address** – user shipping addresses with map coordinates
- **BlogPost** – blog posts with comments and likes
- **Notification** – user notifications for orders and updates

Full schema in `prisma/schema.prisma`.

---

## 🎨 Admin Panel Features

### Role-Based Access

- **Admin**: Full access to all pages (Dashboard, Products, Orders, Users, Categories, Banners, Blog, Delivery, Profile)
- **Staff**: Access to Orders page for processing orders
- **Rider**: Access to Delivery page for managing assigned deliveries

### Pages

- **Dashboard**: Revenue stats, order charts, low stock alerts, recent orders
- **Products**: List, create, edit, delete products with category selection and image URLs
- **Orders**: List all orders with status filtering, update order status, view order details with product images
- **Users**: List users, create staff/rider accounts, edit user details, delete users (except admin)
- **Categories**: List, create, edit, delete categories with product count
- **Banners**: List, create, edit, delete banners with image preview and active toggle
- **Blog**: List, create, edit, delete blog posts with cover images and tags
- **Delivery**: Manage all deliveries with rider assignment, status tracking, and real-time map
- **Profile**: Update admin profile and set store location (used for delivery tracking)

### Search & Filtering

- **Products**: Search by title or description
- **Orders**: Search by order number or customer name, filter by status
- **Users**: Search by name, email, or role
- **Categories**: Search by title or description
- **Banners**: Search by title or link
- **Blog**: Search by title, author, or tags
- **Delivery**: Search by order number, customer name, or city

---

## 🗺️ Delivery Tracking Features

- **Real-time rider location** – customers can track their rider on a map
- **Live route updates** – route updates as rider moves
- **Multiple map themes** – Street, Dark, and Satellite
- **Fullscreen map** – expand map for better visibility
- **Store location** – admin sets store location via profile
- **Rider actions** – Start Delivery, Mark Delivered, Cancel, Return

---

## 🔔 Notification System

- **Order notifications** – customers receive notifications when:
  - Order is out for delivery
  - Order is delivered
  - Order is cancelled
- **Mark as read/unread** – manage notification status
- **Filter** – view all or unread notifications
- **Delivery notifications** – special truck icon and styling for delivery updates

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
- [Leaflet](https://leafletjs.com/) – Interactive maps
- [OpenStreetMap](https://www.openstreetmap.org/) – Map tiles
- [Recharts](https://recharts.org/) – Charts for dashboard
- [Unsplash](https://unsplash.com/) – Product images

---

## 📬 Contact

**SINAG Support** – [support@sinag.com](mailto:support@sinag.com)
