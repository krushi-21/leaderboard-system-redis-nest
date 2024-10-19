# Real-Time Leaderboard System

## Overview

This system is designed to manage and update a game leaderboard in real-time. It ranks players based on their scores and updates instantly whenever a player's score changes. The leaderboard shows the top 100 players, but the system is scalable to handle up to 1 million users efficiently.

### Main Features:

- Real-time score updates
- Top 100 leaderboard displayed live
- Asynchronous database updates to avoid performance bottlenecks
- Scalable for high loads (up to 1 million users)

## Technologies Used:

### 1. **NestJS**:

We chose NestJS because it's a robust and scalable framework for building server-side applications with TypeScript. It allows us to structure our code cleanly and provides built-in support for WebSockets, which we need for real-time communication.

### 2. **Socket.IO**:

Socket.IO enables real-time, bi-directional communication between the server and clients. We use it to send instant score updates to players, ensuring the leaderboard is always up-to-date. This helps improve the user experience, as players can see score changes without refreshing the page.

### 3. **Redis (Pub/Sub and Sorted Sets)**:

Redis plays a critical role in our system for several reasons:

- **Redis Pub/Sub**: We use Redis Pub/Sub (publish/subscribe) to broadcast score updates across multiple instances of our application. This ensures that all connected players get updated in real-time, even when the system is distributed across many servers.
- **Redis Sorted Sets**: Redis Sorted Sets help us store and manage the leaderboard efficiently. This data structure is ideal because it keeps player scores sorted automatically, allowing us to easily retrieve the top players without having to sort the list manually.

### 4. **MySQL**:

MySQL is used for persistent storage of player data. While Redis is great for fast, in-memory data handling (like our leaderboard), we still need to store player data permanently in a database. MySQL is well-suited for this as it's reliable and performs well at scale.

### 5. **Redis Streams**:

Redis Streams are used to handle database updates asynchronously. When a player's score changes, we first update the leaderboard in Redis, then add the update to a Redis Stream. A background worker processes this stream and updates MySQL in the background. This ensures that our real-time performance isn't slowed down by database writes, which can take time.

## How It Works:

1. **Real-time updates**: When a player's score changes, the system updates Redis (sorted sets) with the new score.
2. **Broadcasting**: Using Socket.IO, the new score is broadcast to all connected clients in real-time.
3. **Redis Pub/Sub**: Redis Pub/Sub ensures that updates are sent across all instances of the application.
4. **Redis Streams**: To avoid slowing down the leaderboard, the database (MySQL) is updated asynchronously using Redis Streams, so the main system remains responsive.
5. **Top 100 Leaderboard**: The leaderboard displays the top 100 players by querying Redis. This makes retrieving the top players fast and efficient.

## Why We Used These Services:

- **NestJS** gives us a structured and scalable platform to build our backend, which is important when handling large numbers of users.
- **Socket.IO** allows real-time communication between server and client, which is crucial for an interactive game leaderboard.
- **Redis** is used because it's very fast and handles in-memory data efficiently, making it perfect for managing live updates and sorting scores.
- **MySQL** provides a reliable way to store data permanently, ensuring we don't lose important player information.
- **Redis Streams** help us keep the system fast by allowing database updates to happen in the background, so the main flow of the application isn't slowed down.

## Installation Steps

### 1. Clone the Repository:

```bash
git clone https://github.com/krushi-21/leaderboard-system-redis-nest
cd leaderboard-system-redis-nest
```

### 2. Install Dependencies:

```bash
npm install
```

### 3. Run Docker Compose:

```bash
docker-compose up
```

### 4. Start the Development Server:

```bash
npm run start:dev
```

### 5. Access the Application:

Open your browser and go to:
http://localhost:3000
