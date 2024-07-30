# 🚀 ProfitPlay Backend

The backend for ProfitPlay is a powerful and efficient service built with Node.js and MongoDB, featuring WebSocket integration for live data relay and advanced trading functionalities.

## 📚 Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Routes](#routes)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## 🌟 Features

- **⚡ Real-Time Data Relay**: Utilizes WebSocket to provide live updates.
- **📊 Angel One Smart API Integration**: Fetches live price data for accurate simulations.
- **🚀 Limit Execution Engine**: Continuously executes limit trades for seamless trading.
- **💾 MongoDB Bulk Updates**: Employs MongoDB's bulk update methods for enhanced performance.
- **🔐 JWT and Session Authentication**: Implements JSON Web Tokens and sessions for secure user authentication.

## 🛠️ Installation

To set up the backend for ProfitPlay, follow these steps:

1. **Clone the repository**
    ```bash
    git clone https://github.com/your-username/profitplay-backend.git
    cd profitplay-backend
    ```

2. **Install dependencies**
    ```bash
    npm install
    ```

3. **Set up environment variables**
   - Create a `.env` file in the root directory.
   - Add the following variables to the `.env` file:
    ```env
    # Environment variables
    STATUS=production

    # Development port
    PORT=4000

    # MongoDB credentials
    MONGODB_USERNAME=your_mongodb_username
    MONGODB_PASSWORD=your_mongodb_password

    # Secret key for authentication
    SECRET_KEY=your_secret_key

    # Client and API keys
    CLIENT=your_client_id
    CLIENT_PASSWORD=your_client_password

    API_KEY=your_api_key
    API_SECRET=your_api_secret

    # Error codes
    LOGIN_REQ=1000
    INSUFFICIENT_FUNDS=1001
    ORDER_EXECUTED=1002
    NO_OWN_STOCK=1003
    INSUFFICIENT_QUANTITIES=1004
    ERRORS=1005
    ```

4. **Start the server**
    ```bash
    node server.js
    node server1.js
    ```

## 🏗️ Usage

1. **Run the server**
   - Ensure MongoDB is running and accessible.
   - Use `node server.js` and `node server1.js` to start the server instances.

2. **Authenticate Users**
   - Use the provided endpoints to register and log in users securely with JWT and session management.

3. **Relay Live Data**
   - Connect to the WebSocket endpoint to receive real-time stock price updates.

4. **Execute Trades**
   - Utilize the limit execution engine to handle trade orders effectively.

## 📡 API Endpoints

### Authentication

- **POST /api/auth/register**
  - Registers a new user.
  
- **POST /api/auth/login**
  - Logs in a user and returns a JWT.

### Trading

- **POST /api/trades**
  - Places a new trade order.

### Live Data

- **GET /api/live**
  - Connects to the WebSocket for real-time data.

## 🛤️ Routes

### Authentication Routes

- **POST /** 
  - Logs in a user and generates a JWT.

- **POST /jwt**
  - Verifies the JWT and returns user data.

### User Management Routes

- **POST /reg**
  - Registers a new user.

- **POST /deleteuser**
  - Deletes a user.

- **POST /resetuser**
  - Resets user information.

### Market Operations

- **POST /market**
  - Places a buy or sell order.

- **POST /limit**
  - Places a limit order.

### Watchlist and Portfolio Management

- **POST /addstocktowatchlist**
  - Adds a stock to the user's watchlist.

- **POST /addwatchlist**
  - Creates a new watchlist for the user.

- **POST /deletewatchlist**
  - Deletes a watchlist.

- **POST /deletestock**
  - Removes a stock from a watchlist.

- **POST /portfolio**
  - Fetches the user's portfolio and balance.

### Trade Logs and History

- **POST /positions**
  - Retrieves open positions and intraday logs.

- **POST /orderhistory**
  - Fetches order history for the current date.

- **POST /openorders**
  - Retrieves open orders.

- **POST /account**
  - Fetches delivery information.

- **POST /deliveryfetch**
  - Fetches delivery data for a specific stock.

- **POST /intradayfetch**
  - Fetches intraday data for a specific date.

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Commit your changes.
4. Push your changes to your fork.
5. Create a pull request detailing your changes.

Please ensure your code adheres to the project's coding standards and includes appropriate tests.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 📫 Contact

For any inquiries or feedback, please contact:
- **Email**: nisargpatel0466@gmail.com
- **GitHub**: nisarg30(https://github.com/nisarg30)

---

Happy trading with ProfitPlay! 🚀
