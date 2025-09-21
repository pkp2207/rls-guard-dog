# RLS Guard Dog 🐕‍🦺

A comprehensive educational management system showcasing **Row Level Security (RLS)** with complete role-based access control, real-time dashboards, and data analytics.

## 🎯 Project Overview

RLS Guard Dog is a production-ready educational progress tracking system that demonstrates advanced database security patterns using Supabase RLS policies. The application provides role-specific dashboards with comprehensive analytics and secure data access.

### 🎭 Role-Based Access Control
- **Students** - Personal progress dashboard with charts and analytics
- **Teachers** - Class management with student progress tracking and editing
- **Head Teachers** - School-wide oversight with comprehensive analytics

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.3 with TypeScript & Turbopack
- **Styling**: Tailwind CSS with custom UI components
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with role-based routing
- **Analytics**: MongoDB for aggregated class averages
- **Visualization**: Recharts (LineChart, PieChart, BarChart)
- **UI Components**: Custom-built with Tailwind CSS

## 🎨 Features Implemented

### 🔐 Authentication System
- ✅ **Email/Password Authentication** with Supabase Auth
- ✅ **Role Assignment** during signup (Student/Teacher/Head Teacher)
- ✅ **School Association** with dropdown selection
- ✅ **Secure Logout** with session management
- ✅ **Protected Routes** with automatic role-based redirects

### 📊 Student Dashboard
- ✅ **Personal Progress Overview** with overall statistics
- ✅ **Interactive Charts**:
  - Line chart for progress over time with subject filtering
  - Pie chart for subject distribution
  - Bar chart for subject performance comparison
- ✅ **Subject Analytics** with trend analysis (improving/declining/stable)
- ✅ **Recent Activity Table** with color-coded performance indicators
- ✅ **Responsive Design** with mobile-friendly layout

### 👩‍🏫 Teacher Dashboard
- ✅ **Class Management** with student progress overview
- ✅ **Progress Tracking**:
  - Add new progress records with form validation
  - Edit existing scores with inline editing
  - Delete progress records with confirmation
- ✅ **Advanced Filtering** by student and subject
- ✅ **Class Analytics** with performance charts and statistics
- ✅ **Data Export** capabilities for progress records

### 🏫 Multi-School Support
- ✅ **School Isolation** with RLS policies
- ✅ **Cross-School Security** preventing data leakage
- ✅ **School-Specific User Management**

## 📊 Database Architecture

### Core Tables
```sql
schools        - School information and settings
teachers       - Teacher profiles with school associations  
students       - Student profiles with class assignments
progress       - Individual progress records with scores and analytics
```

### Security Features
- ✅ **Row Level Security Policies** for all tables
- ✅ **Role-Based Data Filtering** automatic enforcement
- ✅ **School-Level Isolation** preventing cross-school access
- ✅ **Audit Trails** with created_at and updated_at timestamps

### Helper Functions
```sql
get_current_user_role()      - Returns authenticated user's role
get_current_user_school_id() - Gets user's school context for filtering
```

## 🎨 UI/UX Features

### 🎯 Professional Interface
- ✅ **Custom Dropdown Components** with enhanced visibility and styling
- ✅ **Form Input Enhancements** with focus states and validation
- ✅ **Loading States** with spinners and skeleton screens
- ✅ **Error Handling** with user-friendly messages and retry options
- ✅ **Responsive Design** optimized for mobile and desktop

### 📱 Interactive Elements
- ✅ **Chart Interactions** with tooltips and filtering
- ✅ **Real-time Updates** after data modifications
- ✅ **Color-Coded Performance** (Green: 80%+, Yellow: 60-79%, Red: <60%)
- ✅ **Smooth Animations** and transitions throughout

## 🔒 Security Implementation

### RLS Policies Active
```sql
- students.select_policy: Users can only see their own student record
- students.insert_policy: Only authenticated users can create records
- teachers.school_isolation: Teachers only see teachers from their school
- progress.student_access: Students see only their progress records
- progress.teacher_access: Teachers see progress for their school's students
```

### Authentication Flow
1. **Signup** → Role assignment → School association → Profile creation
2. **Login** → Session validation → Role verification → Dashboard routing
3. **Dashboard Access** → RLS policy enforcement → Data filtering

## 📁 Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/          # Login page with email/password
│   │   └── signup/         # Registration with role selection
│   ├── student/            # Student dashboard with analytics
│   ├── teacher/            # Teacher dashboard with class management
│   ├── dashboard/          # General dashboard (redirects by role)
│   └── api/
│       └── profile/        # User profile API endpoint
├── components/
│   └── ui/
│       ├── logout-button.tsx    # Secure logout component
│       ├── select.tsx           # Enhanced dropdown component
│       ├── loading.tsx          # Loading states and spinners
│       └── [other-ui-components]
├── lib/
│   ├── auth-context.tsx    # Authentication context provider
│   ├── supabase.ts         # Supabase client configuration
│   ├── database.ts         # Database utility functions
│   └── mongodb.ts          # MongoDB class averages integration
└── types/
    ├── database.ts         # TypeScript database types
    └── supabase.ts         # Generated Supabase types

supabase/
├── schema.sql              # Complete database schema
├── rls-policies.sql        # Row Level Security policies  
├── rls-policies-fixed.sql  # Updated RLS policies
└── sample-data.sql         # Test data for development
```

## � Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase account
- MongoDB account (optional, for class averages)

### Installation

1. **Clone and Install**
   ```bash
   git clone https://github.com/pkp2207/rls-guard-dog.git
   cd rls-guard-dog
   npm install
   ```

2. **Environment Setup**
   ```bash
   # Copy environment file
   cp .env.local.example .env.local
   
   # Add your credentials:
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   MONGODB_URI=your_mongodb_connection_string
   ```

3. **Database Setup**
   ```bash
   # Run SQL files in your Supabase dashboard:
   # 1. supabase/schema.sql
   # 2. supabase/rls-policies-fixed.sql  
   # 3. supabase/sample-data.sql (optional)
   ```

4. **Start Development**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

## 🧪 Testing the Application

### Test User Flows
1. **Student Experience**:
   - Register as student → Select school → Access student dashboard
   - View personal progress charts and analytics
   - Filter progress by subject and view trends

2. **Teacher Experience**:
   - Register as teacher → Access teacher dashboard  
   - Add progress records for students
   - Edit existing scores with inline editing
   - Filter and analyze class performance

3. **Security Validation**:
   - Verify students cannot see other students' data
   - Confirm teachers only see their school's students
   - Test cross-school data isolation

## 📈 Performance & Analytics

### Real-time Features
- ✅ **Live Data Updates** after CRUD operations
- ✅ **Optimistic UI Updates** for better responsiveness  
- ✅ **Efficient Queries** with proper indexing
- ✅ **Chart Animations** with smooth data transitions

### Data Processing
- ✅ **Trend Analysis** algorithms for student progress
- ✅ **Statistical Calculations** (averages, percentiles, distributions)
- ✅ **Performance Categorization** with color coding
- ✅ **Historical Data** preservation and analysis

## 🎓 Learning Outcomes

This project demonstrates mastery of:

### 🔒 Advanced Security
- **Row Level Security** implementation at scale
- **Multi-tenant Architecture** with school isolation
- **Role-based Access Control** with TypeScript safety
- **Authentication Flow** with session management

### 🎨 Modern Frontend
- **Next.js 15 App Router** with server components
- **TypeScript** for type safety throughout
- **Tailwind CSS** for responsive design
- **Data Visualization** with interactive charts

### 🗄️ Database Expertise  
- **PostgreSQL** advanced features and optimization
- **Supabase** real-time capabilities and RLS
- **MongoDB** integration for analytics
- **Schema Design** for educational domains

## 🔧 Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 📝 License

MIT License - Built for educational purposes demonstrating production-ready patterns for database security and modern web development.

---

**🎯 A complete demonstration of Row Level Security in action with real-world educational management features**

**Built with ❤️ using Next.js, Supabase, and modern web technologies**
