# RLS Guard Dog 🐕‍🦺

A comprehensive full-stack application demonstrating **Row Level Security (RLS)** with role-based access control for educational progress tracking.

## 🎯 Project Overview

RLS Guard Dog is an educational management system that showcases advanced database security patterns using Supabase RLS policies. The system allows:

- **Students** to view only their own progress
- **Teachers** to manage progress for students in their classes  
- **Head Teachers** to oversee all school data

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with TypeScript & Tailwind CSS
- **Backend**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Authentication
- **Analytics**: MongoDB for aggregated data
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React

## 📊 Database Schema

### Core Tables
- **`schools`** - School information
- **`teachers`** - Teacher profiles with roles (teacher/head_teacher)
- **`students`** - Student profiles with class assignments
- **`progress`** - Student progress records with scores

### Key Features
- **Row Level Security** policies for role-based data access
- **Custom PostgreSQL types** for roles and subjects
- **Optimized indexes** for performance
- **Audit trails** with timestamps

## 🔒 Security Implementation

### RLS Policies
- Students can only access their own progress data
- Teachers can view/edit progress for students in their assigned classes
- Head teachers have full access to school data
- Automatic school-level data isolation

### Helper Functions
- `get_current_user_role()` - Determines user's role
- `get_current_user_school_id()` - Gets user's school context

## 🚀 Current Progress

### ✅ Completed
- [x] **Project Setup** - Next.js with TypeScript, Tailwind, dependencies
- [x] **Database Schema** - Complete table structure with relationships
- [x] **RLS Policies** - Comprehensive role-based security rules
- [x] **Type Definitions** - Full TypeScript type safety
- [x] **Supabase Client** - SSR-ready configuration
- [x] **MongoDB Integration** - Class averages storage setup
- [x] **Database Utilities** - Helper functions for common operations

### 🚧 In Progress
- [ ] Authentication system (login/signup with role assignment)
- [ ] Student dashboard (progress visualization)
- [ ] Teacher dashboard (class management)
- [ ] Supabase Edge Function (automated calculations)
- [ ] UI components (reusable dashboard elements)
- [ ] Data visualization (charts and analytics)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
├── lib/
│   ├── supabase.ts        # Supabase client configuration
│   ├── database.ts        # Database utility functions
│   └── mongodb.ts         # MongoDB operations
└── types/
    ├── database.ts        # Database schema types
    └── supabase.ts        # Generated Supabase types

supabase/
├── schema.sql             # Database schema definition
├── rls-policies.sql       # Row Level Security policies
└── sample-data.sql        # Test data for development
```

## 🔧 Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/pkp2207/rls-guard-dog.git
   cd rls-guard-dog
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Copy `.env.local` and fill in your Supabase and MongoDB credentials
   - Set up your Supabase project and run the SQL files in order:
     1. `supabase/schema.sql`
     2. `supabase/rls-policies.sql`
     3. `supabase/sample-data.sql` (optional, for testing)

4. **Run development server**
   ```bash
   npm run dev
   ```

## 🎓 Learning Objectives

This project demonstrates:

- **Advanced RLS Implementation** - Real-world security patterns
- **Type-Safe Database Operations** - Full TypeScript integration
- **Modern Next.js Patterns** - App Router, Server Components, SSR
- **Multi-Database Architecture** - PostgreSQL + MongoDB integration
- **Role-Based Access Control** - Educational domain modeling

## 📝 License

This project is built for educational purposes and demonstrates best practices in database security and modern web development.

---

**Built with ❤️ for learning Row Level Security patterns**
