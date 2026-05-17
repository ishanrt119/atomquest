# AtomQuest Goal Setting & Tracking Portal

AtomQuest is a premium, enterprise-grade Goal Setting and Tracking Portal designed to modernize employee performance management with real-time KPI tracking and quarterly check-ins. This platform enables employees to set goals, managers to review and approve them, and administrators to gain insights into organizational progress.

## Overview

This repository contains the foundation for the AtomQuest portal. It is built to deliver a highly user-friendly, responsive, and minimalist experience reminiscent of modern SaaS platforms (like Notion, Linear, and Stripe).

### Features
- **[Phase 1] Goal Creation & Employee Dashboard (COMPLETED)**
- **[Phase 1] Dynamic Manager Dashboard & Approval System (COMPLETED)**
- **[Phase 1] Real-time Shared Goals Management (COMPLETED)**
- **[Phase 1] System-wide Notifications & Alerts (COMPLETED)**
- **[Phase 2] Quarterly Check-ins & Continuous Feedback (COMPLETED)**
- [Phase 3] Advanced Analytics & PDF Exporting

---

## 🏗 Phase 1 Architecture (Implemented)

### 1. Goal Lifecycle Workflow

```mermaid
stateDiagram-v2
    [*] --> Draft: Employee creates goals
    Draft --> Submitted: Employee submits (100% weightage)
    
    state Manager_Review {
        Submitted --> Approved: Manager Approves
        Submitted --> Rejected: Manager Rejects
    }
    
    Rejected --> Draft: Employee modifies
    
    Approved --> Locked: System Auto-Locks Goals
    Locked --> [*]
    
    Locked --> Draft: Admin Force Unlocks (Audit Logged)
```

### 3. Enterprise Shared Goals & KPI Syncing

```mermaid
graph TD
    Admin["Admin"]
    Manager["Manager"]
    SharedGoal["Organization / Department Shared Goal"]
    TeamSelected["Assigned To Specific Team"]
    PrimaryOwner["Primary Owner (Source of Truth)"]
    Participating["Linked Participating Employees"]
    GoalDocs["Individual Goal Documents"]

    Admin -->|Assigns to Team| SharedGoal
    Manager -->|Assigns to own Team| SharedGoal
    SharedGoal --> TeamSelected
    TeamSelected -->|Selects 1 from Team| PrimaryOwner
    TeamSelected -->|Selects multiple from Team| Participating
    
    PrimaryOwner --> GoalDocs
    Participating --> GoalDocs
    
    PrimaryOwner -.->|Updates Achievement| SyncEngine["Sync Engine Backend"]
    SyncEngine -.->|Auto-updates| Participating
```

- `GET/POST /api/shared-goals` - Admin/Manager creation of team-linked shared goals.
- `PUT /api/shared-goals/:id/update-achievement` - Only executable by the `Primary Owner`. Triggers the `bulkWrite` sync engine.
- `POST /api/shared-goal-sync/:id` - Internal sync engine propagating actuals to all linked active quarterly check-ins.

### 4. Notification Architecture & Event Flow

```mermaid
graph TD
    UserAction["User Action\n(Submit, Approve, Assign)"]
    
    NotificationGen["Notification Generator\n(src/services/notification.ts)"]
    
    DB[("MongoDB Notification Collection")]
    
    BellDropdown["Bell Icon Dropdown\n(TopNav.tsx)"]
    
    RoleNav["Role-Based Navigation\n(/employee, /manager)"]

    UserAction -->|"Triggers"| NotificationGen
    NotificationGen -->|"Saves and Resolves Priority"| DB
    DB -.-|"Polls Every 30s"| BellDropdown
    BellDropdown -->|"On Click"| RoleNav
```

- `GET /api/notifications` - Fetch latest unread/read notifications for the logged-in user.
- `PUT /api/notifications/read-all` - Mark all notifications as read.
- `PUT /api/notifications/:id/read` - Mark a single notification as read.
- `DELETE /api/notifications/:id` - Delete a specific notification.

---

## 🚀 Phase 2 Architecture (Implemented)

### 1. Quarterly Check-in & Review Flow

```mermaid
graph TD
    System["Active Quarter Engine"]
    EmployeeDashboard["Employee Check-in UI"]
    CalcEngine["Progress Calculation Engine"]
    ManagerReview["Manager Review Dashboard"]

    System -->|"Returns Q1/Q2/Q3/Q4 Window"| EmployeeDashboard
    EmployeeDashboard -->|"Inputs Actual Achievement"| CalcEngine
    CalcEngine -->|"Dynamically parses UoM: Numeric, Timeline, Zero"| EmployeeDashboard
    EmployeeDashboard -->|"Saves Draft / Submits"| ManagerReview
    ManagerReview -->|"Adds Structured Comment and Approves"| EmployeeDashboard
```

### 2. Supported Progress Calculation (UoM Engine)

The core calculation logic seamlessly interprets progress based on how the goal was originally parameterized:
- **Min / Percentage**: Progress scales based on maximum limits (e.g. `(Target / Actual) * 100` for cost, or `(Actual / Target) * 100` for revenue).
- **Timeline**: Returns 100% if completed before target date; deducts scale based on days delayed.
- **Zero Type**: Assumes binary state. `0 = 100% Success` (e.g., Target: 0 Accidents).

#### API Documentation
- `GET /api/checkins/active-quarter` - Retrieve the currently enforced Check-in Window based on fiscal year setup.
- `GET/PUT /api/checkins` - Employee CRUD operations for quarterly drafts.
- `POST /api/checkins/submit` - Irreversible quarter submission locking the employee form.
- `POST /api/checkins/review` - Manager route to persist structured comments.
- `POST /api/progress/calculate` - Independent service routing calculation math.

---

## 🔒 Security & Middleware

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
- **Goal**: Core entity tracking targets, thrust areas, and quarterly weightings. Supports dynamic Unit of Measurement (`numeric`, `percentage`, `timeline`, `zero`) via `targetValue` and `targetDate`.
- **GoalSheet**: Container linking multiple goals to a specific quarter/year for an employee. Contains strict `status` and `locked` control layers for the approval workflow.
- **CheckIn**: Periodic updates on active goals with manager review hooks.
- **SharedGoal**: Junction allowing shared progress on cross-departmental tasks. Fully integrated for Admin and Manager creation.
- **AuditLog**: Immutable historical tracking of all significant changes (Status changes, Locking, Rejections).
- **Notification**: Real-time event tracking schema. Fields include `recipientId`, `type`, `title`, `message`, `priority` (`low`, `medium`, `high`, `urgent`), `isRead`, and deep `link` references.

## Authentication Flow & RBAC

AtomQuest utilizes a robust, Next.js Edge-compatible JWT authentication system secured by MongoDB and `bcryptjs`.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant NextJS_Middleware
    participant Auth_API
    participant MongoDB

    User->>Frontend: Enters Email & Password
    Frontend->>Auth_API: POST /api/auth/login
    Auth_API->>MongoDB: Fetch user & verify bcrypt hash
    MongoDB-->>Auth_API: Return User (if match)
    Auth_API->>Auth_API: Sign JWT with `jose`
    Auth_API-->>Frontend: Set HTTP-Only Cookie (`auth_token`) + Return 200 OK
    Frontend->>Frontend: window.location.href = /dashboard
    Frontend->>NextJS_Middleware: Intercept Route Request
    NextJS_Middleware->>NextJS_Middleware: Extract & Verify `auth_token`
    NextJS_Middleware-->>Frontend: Enforce RBAC rules (redirect if unauthorized)
    Frontend-->>User: Render Authorized Dashboard
```

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

- Build the dynamic OKR alignment engine.
- Establish the comprehensive Analytics module and detailed Audit Logging integrations.

---

## 🔄 Phase 2 Sync Architecture — Employee → Manager

### Employee Achievement → Manager Dashboard Data Flow

```mermaid
sequenceDiagram
    participant E as Employee
    participant API as /api/checkins/update-achievement
    participant DB as MongoDB (CheckIn + Goal)
    participant Sync as Shared Goal Sync Engine
    participant M as Manager Dashboard

    E->>API: POST { goalId, actualAchievement, status, quarter }
    API->>DB: Update Goal.currentAchievement + Goal.status
    API->>DB: Upsert CheckIn document (create if virtual)
    API->>DB: CheckIn.progressPercentage = calculated
    
    alt isPrimaryOwner && isSharedGoal
        API->>Sync: POST /api/shared-goal-sync/:id
        Sync->>DB: Update SharedGoal.currentAchievement
        Sync->>DB: Sync all linked employee Goal documents
        Sync->>DB: Sync all linked CheckIn documents
    end

    M->>API: GET /api/manager/team-checkins?quarter=Q1
    API->>DB: Find Team by managerId
    DB-->>API: employeeIds[]
    API->>DB: CheckIn.find({ employeeId: {$in:...}, quarter })
    DB-->>API: Latest CheckIn records (populated with Goal + User)
    API-->>M: { members, checkins, quarter }
    M->>M: Derive per-employee avgProgress from CheckIn.progressPercentage
```

### Source of Truth Design

| Data Point | Source Collection | Used By |
|---|---|---|
| Employee quarterly progress | `CheckIn.progressPercentage` | Manager Dashboard, Check-in Review |
| Goal achievement | `Goal.currentAchievement` | Employee Dashboard, Shared Goal Sync |
| Submission status | `CheckIn.checkinSubmitted` | Manager Review Queue |
| Review status | `CheckIn.managerReviewed` | Employee feedback panel |
| Team composition | `Team.employeeIds` | All manager-scoped queries |
| Org-level KPIs | `SharedGoal` | Admin + Manager shared-goals pages |

### Key Architectural Decisions

- **`CheckIn` is the quarterly source of truth** — the Manager Dashboard reads `CheckIn.progressPercentage`, never `Goal.status` counts.
- **`Team` collection drives scoping** — all manager queries use `Team.findOne({ managerId })`, not `User.managerId` field, ensuring hierarchy integrity.
- **Virtual check-ins** — employees without a persisted `CheckIn` get a virtual one generated on the fly from the `Goal` document, which becomes real on first save.
- **`router.refresh()`** — the Manager Dashboard uses Next.js's `router.refresh()` to re-run the server component and pull fresh MongoDB data without a full page reload.
- **Shared Goal Primary Owner sync** — when a primary owner saves progress, `/api/checkins/update-achievement` fires a background sync to `shared-goal-sync/:id`, which propagates the achievement to all linked employee `Goal` and `CheckIn` documents.

---

## 🎯 Phase 3 Architecture: Goal Cycle Management System

### Active Quarter & Window Enforcement Engine

```mermaid
graph TD
    CurrentDate["Current Date"]
    ActiveQuarterService["Active Quarter Service"]
    WindowValidation["Window Validation Service"]
    RBAC["Role Access Control"]
    UILock["UI Lock/Unlock State"]
    SubmissionFlow["Quarter Submission Flow"]

    CurrentDate -->|"Evaluates Date vs Cycle"| ActiveQuarterService
    ActiveQuarterService -->|"Determines Active Phase"| WindowValidation
    WindowValidation -->|"Enforces Window Constraints"| RBAC
    RBAC -->|"Disables/Enables Actions"| UILock
    UILock -->|"Employee/Manager Acts"| SubmissionFlow
```

### Key Components

- **Database-Driven Cycles**: Admin configures a specific `GoalCycle` with discrete dates for Goal Setting, Q1, Q2, Q3, and Q4 windows.
- **Active Quarter Service**: Determines dynamically on the backend what the current cycle status is (`GOAL_SETTING`, `Q1`, `Q2`, `Q3`, `Q4`, or `LOCKED`).
- **Strict Backend Enforcement**: `Window Validation Service` blocks API routes outside of authorized windows. For example, check-ins cannot be saved if the window is closed.
- **Admin Overrides**: Administrators can apply a temporary override to reopen a specific phase globally or for targeted employees (audit-logged).
- **Auto Transitions**: No manual switching. As time progresses, the system automatically advances the state to the current active window.

---

## 📊 Phase 4 Architecture: Governance & Enterprise Reporting

### Complete Audit & Reporting Data Flow

```mermaid
graph TD
    EmployeeUpdate["Employee / Manager Update"]
    CheckInSubmission["CheckIn / Goal Modified"]
    CompletionDashboardUpdate["Real-time Completion Dashboard Update"]
    AuditLogGeneration["Immutable Audit Log Generation"]
    ReportingAggregation["MongoDB Aggregation Pipeline"]
    CSVExcelExport["CSV / Excel Export Generation"]

    EmployeeUpdate --> CheckInSubmission
    CheckInSubmission --> CompletionDashboardUpdate
    CheckInSubmission -->|"If modified post-lock"| AuditLogGeneration
    CompletionDashboardUpdate -.-> ReportingAggregation
    AuditLogGeneration -.-> ReportingAggregation
    ReportingAggregation --> CSVExcelExport
```

### Key Components

- **Enterprise Reporting Engine**: Backend-driven CSV and Excel generation using `json2csv` and `ExcelJS`. Relies on MongoDB `$lookup` aggregation pipelines to join Goals, CheckIns, Users, and Teams on the fly without heavy frontend processing.
- **Real-Time Completion Dashboard**: Provides managers and leadership with immediate visibility into department participation, identifying pending and overdue check-ins instantly.
- **Immutable Audit Trail (`AuditLog` Schema)**: Every state mutation (targets, weightages, approvals, admin overrides) is captured permanently. It logs the actor, old value, new value, exact timestamp, and the required override reason.
- **Lock Date Governance**: Post-lock modifications are structurally restricted and require administrative overrides which are forcefully tracked in the Audit Log.
