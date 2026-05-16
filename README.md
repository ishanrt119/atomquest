# AtomQuest Goal Setting & Tracking Portal

AtomQuest is a premium, enterprise-grade Goal Setting and Tracking Portal designed to modernize employee performance management with real-time KPI tracking and quarterly check-ins. This platform enables employees to set goals, managers to review and approve them, and administrators to gain insights into organizational progress.

## Overview

This repository contains the foundation for the AtomQuest portal. It is built to deliver a highly user-friendly, responsive, and minimalist experience reminiscent of modern SaaS platforms (like Notion, Linear, and Stripe).

### Features
- **Goal Creation**: Employees can seamlessly create personal and OKR-based goals.
- **Manager Reviews**: Managers can review, approve, and align goals.
- **Quarterly Tracking**: Easy check-ins and performance tracking.
- **Analytics Dashboard**: Insights on organizational performance (planned).
- **Role-based Authentication**: Secure access for Employees, Managers, and Admins.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI Architecture**: Shadcn UI, Framer Motion, Lucide React
- **Backend Architecture**: Next.js API Routes (Serverless)
- **Database Architecture**: MongoDB Atlas with Mongoose ODM

## Architecture Diagram

```mermaid
graph TD
    Client["Client / Browser"]
    
    subgraph Frontend [Next.js App Router Layer]
        UI["React UI Components\n(Tailwind, Shadcn)"]
        State["State Management"]
        APIRoutes["Next.js API Routes / Actions"]
    end
    
    subgraph DataAccess [Database Layer]
        Mongoose["Mongoose ODM Models\n(User, Goal, CheckIn, etc.)"]
        Connection["Singleton Connection Utility"]
    end
    
    DB[(MongoDB Atlas)]

    Client --> UI
    UI <--> State
    UI --> APIRoutes
    APIRoutes --> Connection
    Connection --> Mongoose
    Mongoose --> DB
```

## Database Schema Overview
The architecture implements the following robust Mongoose schemas:
- **User**: Captures identity, roles (employee, manager, admin), and relationships.
- **Goal**: Core entity tracking targets, thrust areas, and quarterly weightings.
- **GoalSheet**: Container linking multiple goals to a specific quarter/year for an employee.
- **CheckIn**: Periodic updates on active goals with manager review hooks.
- **SharedGoal**: Junction allowing shared progress on cross-departmental tasks.
- **AuditLog**: Immutable historical tracking of all significant changes.
- **Notification**: In-app routing for updates and reminders.

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn or pnpm
- A MongoDB Atlas Cluster URL

### Run Locally

1. Clone the repository and navigate into the project directory.
2. Copy the example environment variables:
   ```bash
   cp .env.example .env.local
   ```
3. Update `.env.local` with your secure MongoDB connection string:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster...
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser.
7. Test the database connection by visiting `http://localhost:3000/api/test-db`.

## Deployment Instructions

### Frontend (Vercel)
The Next.js application is optimized for deployment on Vercel. Connect your repository to Vercel, ensure you provide the `MONGODB_URI` environment variable, and it will automatically configure the build settings.

## Future Roadmap

- Fully integrate Employee, Manager, and Admin dashboards.
- Implement robust JWT Authentication and Route Guards.
- Build the OKR alignment engine.
- Establish the comprehensive Analytics module and Audit Logging system.
