# FortTask - Household Management Application
## Project Documentation

## Table of Contents
1. [Application Overview](#application-overview)
2. [Project Requirements](#project-requirements)
3. [Division of Work](#division-of-work)
4. [Database Structure](#database-structure)
5. [Technical Implementation](#technical-implementation)
6. [Installation and Setup](#installation-and-setup)
7. [API Documentation](#api-documentation)
8. [Third-party Integration](#third-party-integration)

## Application Overview

**FortTask** is a comprehensive household management application designed to help users effectively manage their household activities, track shared responsibilities, and enhance collaboration among household members. The application provides various features to facilitate household management, including event planning, chore management, bill tracking, shopping list creation, and real-time messaging.

The primary goal of FortTask is to centralize all household management activities into a single platform, making it easier for family members or roommates to coordinate and keep track of shared responsibilities. The user-friendly interface and collaborative features make it an ideal tool for modern households seeking efficient management solutions.

## Project Requirements

According to the project specifications:

- **Project Deadline**: May 31, 2025
- **Team Size**: 1-3 people

## Division of Work

The project was developed by a team of three members, with responsibilities distributed based on expertise and interest areas:

### Mateusz Borach (eWarzywo) - 107 contributions
- **Full Stack Developer**
- Developed fronted and backend for: Login, Signup, Logout, Household, Management and Messages pages
- Developed backend for: Overview(Dashboard) page
- Developed the user authentication system using NextAuth.js
- Set up real-time messaging with GetStream Chat API integration
- Developed backend unit tests for: User operations, authentication, Login, Signup, Logout, Household, Overview(Dashboard) and Messages pages
- Developed frontend tests for: Login, Logout, Management and Messages pages
- Designed UI/UX


### Jakub Majdanski (Majdanka) - 85 contributions
- **Frontend Developer and UI/UX Designer**
- Designed and implemented the user interface using React and TailwindCSS
- Developed the dashboard and overview components
- Created the shopping list page and calendar functionality
- Implemented bill tracking and payment features
- Designed responsive layouts for various device sizes
- Created reusable UI components and styled elements
- Handled form validation and client-side error handling

### Mateusz Gliszczynski (apozjebus) - 67 contributions
- **Full Stack Developer**
- Created initial Prisma Models
- Created initial API routes
- Developed frontend and backend for: Events and Chores Pages
- Integrated Socket.IO
- Developed backend unit tests for: Events, Chores, Shopping and Bills pages
- Developed frontend unit tests for: Events and Chores pages
- Designed UI/UX

## Database Structure

FortTask uses PostgreSQL as its relational database, with Prisma ORM for database interactions. The database schema is designed to efficiently support all the application's features while maintaining data integrity and relationships.

### Database Diagram

```
┌─────────────┐       ┌────────────┐       ┌───────────────┐
│  Household  │       │    User    │       │ProfilePicture │
├─────────────┤       ├────────────┤       ├───────────────┤
│ id          │       │ id         │       │ id            │
│ name        │       │ username   │       │ name          │
│ joinCode    │       │ email      │       │ imageUrl      │
│ createdAt   │       │ passwordHash│       │ category      │
│ ownerId     │◄─────┐│ createdAt  │       │ createdAt     │
└─────────────┘      ││ profilePictureId│◄──┘───────────────┘
        ▲            ││ householdId │
        │            │└────────────┘
        └────────────┘      ▲
        │                   │
┌───────┴────────┐  ┌──────┴──────┐  ┌────────────────┐
│      Bill      │  │    Chore    │  │  ShoppingItem  │
├────────────────┤  ├─────────────┤  ├────────────────┤
│ id             │  │ id          │  │ id             │
│ name           │  │ name        │  │ name           │
│ description    │  │ priority    │  │ cost           │
│ amount         │  │ description │  │ createdAt      │
│ cycle          │  │ cycle       │  │ updatedAt      │
│ dueDate        │  │ repeatCount │  │ createdById    │
│ createdAt      │  │ done        │  │ boughtById     │
│ updatedAt      │  │ dueDate     │  │ householdId    │
│ createdById    │  │ createdAt   │  └────────────────┘
│ paidById       │  │ updatedAt   │
│ householdId    │  │ createdById │         ┌────────────────┐
└────────────────┘  │ doneById    │  ┌─────▶│ EventAttendee  │
                    │ householdId │  │      ├────────────────┤
                    │ parentChoreId│  │      │ eventId        │
                    └─────────────┘  │      │ userId         │
                                     │      └────────────────┘
                    ┌─────────────┐  │
                    │    Event    │  │
                    ├─────────────┤  │
                    │ id          │──┘
                    │ name        │
                    │ description │
                    │ date        │
                    │ cycle       │
                    │ repeatCount │
                    │ location    │
                    │ createdAt   │
                    │ updatedAt   │
                    │ createdById │
                    │ householdId │
                    │ parentEventId│
                    └─────────────┘
```

### Key Database Entities

1. **Household** - The central entity representing a household unit, with properties like name, join code, and relationships to users and various household items.
   
2. **User** - Represents application users with their authentication details and relationships to households and activities.

3. **Bill** - Represents household bills with amount, due date, payment status, and relationships to users who created and paid them.

4. **Chore** - Represents household tasks with priority levels, due dates, completion status, and users assigned to them.

5. **ShoppingItem** - Represents items on shopping lists with cost estimates and users who added and purchased them.

6. **Event** - Represents household events with date, location, and attendee management.

7. **EventAttendee** - Junction table for the many-to-many relationship between events and attending users.

8. **ProfilePicture** - Stores user profile image information.

## Technical Implementation

### Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Real-time Messaging**: GetStream Chat API
- **Testing**: Jest

### Key Features

1. **Household Management**
   - Create and join households
   - Invite members with join codes
   - Manage household settings and members

2. **Event Planning**
   - Schedule and track events
   - Manage event attendance
   - Set recurring events

3. **Chore Management**
   - Assign and track chores
   - Set priority levels for tasks
   - Mark chores as completed

4. **Bill Tracking**
   - Record household bills
   - Track payment status
   - View payment history

5. **Shopping Lists**
   - Create collaborative lists
   - Track estimated costs
   - Mark items as purchased

6. **Real-time Messaging**
   - Household chat rooms
   - Message history

7. **Dashboard Overview**
   - Consolidated information display
   - Upcoming activities
   - Recent updates

8. **User Authentication**
   - Secure login/registration
   - Password protection
   - Session management

## Installation and Setup

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- GetStream account for chat functionality

### Setup Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/eWarzywo/project-webowki.git
   cd project-webowki
   cd forttask
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the forttask directory with:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/forttask"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # GetStream API Keys
   NEXT_PUBLIC_STREAM_KEY=YOUR_STREAM_KEY
   STREAM_SECRET=YOUR_STREAM_SECRET
   ```

4. **Initialize the database**:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   npm run seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   Open your browser and navigate to `http://localhost:3000`

## API Documentation

FortTask provides the following API endpoints:

### Authentication
- `/api/auth/[...nextauth]` - NextAuth.js authentication routes

### User Management
- `/api/user` - User information and settings
- `/api/user/get` - Retrieve user data
- `/api/user/profilepicture` - Retrieve user profile picture and set new one
- `/api/user/profilepictures` - Retrieves profile pictures of all users in household

### Household Management
- `/api/household` - Household CRUD operations
- `/api/household/create` - Create new household
- `/api/household/join` - Join existing household
- `/api/household/users` - Manage household members

### Events
- `/api/event/create` - Create new event
- `/api/event/delete` - Delete an event
- `/api/events/get` - Retrieve events

### Chores
- `/api/chore/create` - Create new chore
- `/api/chore/delete` - Delete a chore
- `/api/chore/done` - Marks chore as done
- `/api/chore/todo` - Marks chore as undone
- `/api/chores/done` - Retrieves chores marked as done
- `/api/chores/todo` - Retrieves chores marked as undone

### Bills
- `/api/bill/` - Bill tracking and payment
- `/api/bill/details` - Gets details of a bill
- `/api/bill/paidToggle` - Changes status of a bill to paid or not paid
- `/api/bill/totalNumber` - Returns number of all bills in household

### Shopping List
- `/api/shoppingList` - Shopping list management
- `/api/shoppingList/bought` - Changes status of shopping list item to bought
- `/api/shoppingList/details` - Retrieves datails of an item in shopping list
- `/api/shoppingList/totalNumber` - Retrieves number of specific item in shopping list
- `/api/shoppingList/unbought` - Changes status of shopping list item to unbought

### Messaging
- `/api/messages/token` - GetStream Chat token generation

### Dashboard
- `/api/overview` - Consolidated data for dashboard
- `/api/overview/bills` - Retrieves 3 oldest not paid bills
- `/api/overview/chores` - Retrieves 3 chores to be completed
- `/api/overview/events` - Retrieves 3 most recent upcoming events yet to come
- `/api/overview/shoppingList` - Retrieves 3 oldest items to be purchased

## Third-party Integration

### GetStream Chat Integration

FortTask uses the GetStream Chat API for real-time messaging functionality:

- **Token-Based Authentication**: Secure user authentication for chat
- **Household Channels**: Private chat channels for each household
- **Message History**: Complete conversation archives
