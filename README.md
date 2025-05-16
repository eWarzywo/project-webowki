# FortTask - Household Management Application

## Overview
**FortTask** is a comprehensive household management application built with Next.js, TypeScript, and Prisma. It helps users manage their household activities, track shared responsibilities, and enhance collaboration among household members.

## Features
- **Household Management**: Create and join households, invite members, and manage household settings.
- **Event Planning**: Schedule and track events for the household with date, location and attendee management.
- **Chore Management**: Assign, track, and complete household chores with priority levels.
- **Bill Tracking**: Keep track of household bills, payment status, and payment history.
- **Shopping Lists**: Create collaborative shopping lists with cost estimates.
- **Real-time Messaging**: In-app messaging system powered by GetStream Chat API for seamless household communication.
- **Dashboard Overview**: View consolidated information about upcoming events, bills, chores, and shopping items.
- **User Authentication**: Secure login, registration, and session management.
- **Responsive Design**: Optimized for mobile, tablet, and desktop experiences.

## Tech Stack
- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Real-time Messaging**: GetStream Chat API
- **Testing**: Jest

## Installation
To get started with FortTask, follow these steps:

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

3. **Set up environment variables**:
    Create a `.env` file in the forttask directory with the following variables:
    ```
    DATABASE_URL="postgresql://username:password@localhost:5432/forttask"
    NEXTAUTH_SECRET="your-secret-key"
    NEXTAUTH_URL="http://localhost:3000"
    
    # GetStream API Keys (for messaging functionality)
    NEXT_PUBLIC_STREAM_KEY=YOUR_STREAM_KEY
    STREAM_SECRET=YOUR_STREAM_SECRET
    ```
    You'll need to create a free account at [GetStream.io](https://getstream.io/) to obtain your API keys.

4. **Set up the database**:
    ```bash
    npx prisma migrate dev
    npx prisma db seed
    npm run seed
    ```

5. **Start the development server**:
    ```bash
    npm run dev
    ```

## Usage
Once the application is running:

1. Open your web browser and navigate to `http://localhost:3000`.
2. Sign up for a new account or log in with your credentials.
3. Create a new household or join an existing one using a join code.
4. Start managing your household by adding events, chores, bills, and shopping items.
5. Use the real-time messaging system to communicate with household members.
6. Use the dashboard to get an overview of upcoming activities and responsibilities.

## API Endpoints
FortTask provides the following API endpoints:

- **Authentication**: `/api/auth/[...nextauth]`
- **User Management**: `/api/user`
- **Household Management**: `/api/household`, `/api/household/create`, `/api/household/join`
- **Events**: `/api/event`, `/api/events/get`
- **Chores**: `/api/chore`
- **Bills**: `/api/bill`
- **Shopping List**: `/api/shoppingList`
- **Messaging**: `/api/messages/token` (GetStream Chat token generation)
- **Dashboard Data**: `/api/overview` (with date filtering)

## GetStream Chat Integration
FortTask uses GetStream Chat API for its real-time messaging functionality:

- **Token-Based Authentication**: Secure user authentication for chat using JWT tokens.
- **Household Channels**: Each household has its own private chat channel.
- **Real-time Notifications**: Instant message delivery and notifications.
- **Rich Media Support**: Share images and other media in conversations.
- **Message History**: Full history of household communications.

To configure GetStream for your development environment:
1. Create an account on [GetStream.io](https://getstream.io/)
2. Create a new Stream Chat application in the dashboard
3. Copy your API Key and Secret to your `.env` file
4. The application will automatically create channels for each household

## Contributing
Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for detailed guidelines.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements
- Thanks to the open-source community for their valuable contributions.
- GetStream.io for their powerful chat API.
- Special thanks to the team members who worked on this project.
- Acknowledgement to all third-party libraries and tools used in the development of FortTask.
