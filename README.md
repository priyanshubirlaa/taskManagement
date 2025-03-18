# Task Management Application

Welcome to the Task Management Application! This is a Node.js-based RESTful API built with Express.js, MongoDB (via Mongoose), Redis for caching, and JWT (JSON Web Token) for authentication. The application allows users to manage tasks with CRUD operations, pagination, filtering, and priority-based scheduling using a priority queue. Unit tests are implemented using Jest.

## Repository
- **GitHub URL**: [https://github.com/priyanshubirlaa/taskManagement](https://github.com/priyanshubirlaa/taskManagement)
- **Clone the Repository**:
  ```bash
  git clone https://github.com/priyanshubirlaa/taskManagement.git
  cd taskManagement
  ```

## Features
- User authentication using JWT.
- CRUD operations for tasks (Create, Read, Update, Delete).
- Task management with title, description, status (pending/completed), priority (low/medium/high), and userId.
- Pagination and filtering for task retrieval.
- Redis caching for improved performance.
- Priority queue (heap-based) for scheduling tasks by priority.
- Unit tests with Jest and mocking for MongoDB and Redis.

## Prerequisites
- Node.js (v18.x or later recommended)
- npm (comes with Node.js)
- MongoDB (for development; in-memory MongoDB is used for tests via @shelf/jest-mongodb)
- Redis (optional, for caching in development)

## Setup Instructions

### 1. Install Dependencies
After cloning the repository, install the required dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory with the following variables:
```
MONGO_URI=mongodb://localhost:27017/taskManagement
JWT_SECRET=your_secure_jwt_secret_key
PORT=5000
```
- `MONGO_URI`: Connection string for your MongoDB instance (e.g., local or remote).
- `JWT_SECRET`: A secure secret key for JWT token generation (keep it confidential).
- `PORT`: The port on which the server will run (default is 5000).

### 3. Start the Server
Run the application:
```bash
npm start
```
The server will start on the specified PORT (default 5000), and you should see `Server running on port 5000` in the console.

### 4. Run Tests
To execute the unit tests with Jest:
```bash
npm test
```
Tests use an in-memory MongoDB instance via `@shelf/jest-mongodb` and mock Redis with `redis-mock`.
Ensure `NODE_ENV=test` is set (handled by the `cross-env` package in the test script).

## API Documentation
All APIs are prefixed with `/api`. Authentication is required for task-related endpoints using a JWT token in the `Authorization` header (e.g., `Bearer <token>`).

### Authentication APIs

#### Register User
- **Endpoint:** `POST /api/register`
- **Payload:**
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "User registered successfully"
  }
  ```

#### Login User
- **Endpoint:** `POST /api/login`
- **Payload:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "token": "string" // JWT token
  }
  ```

### Task APIs

#### Create Task
- **Endpoint:** `POST /api/tasks`
- **Headers:** `Authorization: Bearer <token>`
- **Payload:**
  ```json
  {
    "title": "string",
    "description": "string",
    "priority": "low | medium | high"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Task created successfully",
    "task": {
      "_id": "string",
      "title": "string",
      "description": "string",
      "priority": "low | medium | high",
      "userId": "string",
      "createdAt": "date",
      "status": "pending"
    }
  }
  ```

#### Get Tasks
- **Endpoint:** `GET /api/tasks`
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (optional, default: 1)
  - `limit` (optional, default: 10)
  - `status` (optional, "pending" | "completed")
  - `priority` (optional, "low" | "medium" | "high")
- **Response:**
  ```json
  [
    {
      "_id": "string",
      "title": "string",
      "description": "string",
      "status": "pending | completed",
      "priority": "low | medium | high",
      "userId": "string",
      "createdAt": "date"
    }
  ]
  ```

#### Update Task
- **Endpoint:** `PUT /api/tasks/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Payload:**
  ```json
  {
    "title": "string",
    "description": "string",
    "status": "pending | completed",
    "priority": "low | medium | high"
  }
  ```

#### Delete Task
- **Endpoint:** `DELETE /api/tasks/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  {
    "message": "Task deleted successfully"
  }
  ```

#### Get Tasks by Priority
- **Endpoint:** `GET /api/tasks/priority`
- **Headers:** `Authorization: Bearer <token>`
- **Response:**
  ```json
  [
    {
      "_id": "string",
      "title": "string",
      "description": "string",
      "status": "pending | completed",
      "priority": "low | medium | high",
      "userId": "string",
      "createdAt": "date"
    }
  ]
  ```

## Testing with Jest
### Run Tests:
```bash
npm test
```
### Generate a Coverage Report:
```bash
npm test -- --coverage
```

## Contributing
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make changes and commit (`git commit -m "Add new feature"`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a Pull Request.

Happy coding! 🚀
