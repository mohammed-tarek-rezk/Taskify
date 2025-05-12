# Taskify

## Overview
Welcome to the **Task Management System**, a powerful tool designed to help teams efficiently manage tasks, track progress, and enhance productivity. Graduated project for **DEPI Team group 2**, this system provides an intuitive interface for seamless task coordination and collaboration.

## Features
- 📝 **Task Creation & Assignment**: Easily create and assign tasks to team members.
- 📅 **Task Scheduling**: Set deadlines and reminders to keep track of work.
- 📊 **Progress Tracking**: Monitor task completion status with visual indicators.
- 🔔 **Notifications & Alerts**: Stay updated with real-time notifications.
- 👥 **Team Collaboration**: Share tasks, comments, and updates with your team.
- 📁 **File Attachments**: Upload documents related to tasks.
- 🔍 **Search & Filtering**: Quickly find tasks using search and filters.

## Tech Stack
- **Frontend**: React Js
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Authentication**: JWT-based authentication

## Installation & Setup
### Prerequisites
Ensure you have the following installed:
- Node.js
- MongoDB
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mohammed-tarek-rezk/taskify.git
   cd taskify
   ```

2. Install dependencies:
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. Create a `.env` file in the server directory:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. Start the development servers:
   ```bash
   # Start server (from server directory)
   npm run dev

   # Start client (from client directory)
   npm start
   ```

## Project Structure

```
taskify/
├── client/                 # React frontend
│   ├── public/            # Static files
│   └── src/               # Source files
│       ├── components/    # Reusable components
│       ├── contexts/      # React contexts
│       ├── pages/         # Page components
│       └── App.js         # Main App component
└── server/                # Node.js backend
    ├── models/           # Mongoose models
    ├── routes/           # API routes
    ├── middleware/       # Custom middleware
    └── server.js         # Server entry point
```
## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- GET /api/auth/me - Get current user

### Teams
- GET /api/teams - Get all teams
- POST /api/teams - Create a new team
- GET /api/teams/:id - Get team by ID
- PUT /api/teams/:id - Update team
- DELETE /api/teams/:id - Delete team

### Projects
- GET /api/projects - Get all projects
- POST /api/projects - Create a new project
- GET /api/projects/:id - Get project by ID
- PUT /api/projects/:id - Update project
- DELETE /api/projects/:id - Delete project

### Tasks
- GET /api/tasks - Get all tasks
- POST /api/tasks - Create a new task
- GET /api/tasks/:id - Get task by ID
- PUT /api/tasks/:id - Update task
- DELETE /api/tasks/:id - Delete task
## Usage
- Create an account and log in.
- Add new tasks and assign them to team members.
- Update task status and track progress.
- Collaborate and communicate efficiently.

## Contributing
We welcome contributions! Feel free to fork the repository and submit pull requests.

## License
This project is licensed under the MIT License.

## Contact
For any inquiries, reach out to the **DEPI Team** at [mohammed.tarek.rezk@gmail.com](mailto:mohammed.tarek.rezk@gmail.com).

