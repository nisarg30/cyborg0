const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const spp = require('./models/stockprice.js');  // Ensure this path matches your setup

let io;
let userSocketMap = {};  // Maps usernames to socket IDs

function fetchAndUpdateStockPrice(stockname, socket) {
    spp.findOne({ stockname : stockname }, (err, doc) => {
        console.log(doc);
        if (err) {
            console.error('Error fetching stock data:', err);
            return;
        }
        if (doc) {
            socket.emit('update', {
                stock: doc.stockname,
                price: doc.currentprice,
                open : doc.close
            });
        } else {
            console.log('No document found for', stockname);
        }
    });
}
// Middleware to authenticate the token and attach username to the socket
function authenticateToken(socket, next) {
    const token = socket.handshake.auth.token; 
    if (!token) {
        console.log("error no token")
        return next(new Error('Authentication error: No token provided'));
    }

    jwt.verify(token, "36a4df6c92e79981ebd6ac4652a9d3695db3a0d3d062c76f4631a6b5098b6e47", (err, decoded) => {
        if (err) {
          console.log("error in decode");
            return next(new Error('Authentication error'));
        }
        socket.username = decoded._id; // Store the decoded username in the socket session
        next();
    });
}

// Initialize Socket.IO with server and middleware
function initSocket(server) {
    io = socketIO(server, {
        cors: {
            origin: '*',  
        }
    });

    // Authenticated namespace
    const authNamespace = io.of('/auth');
    authNamespace.use(authenticateToken); 

    authNamespace.on('connection', (socket) => {
        userSocketMap[socket.username] = socket.id;
        console.log(`User ${socket.username} connected with socket ID ${socket.id}`);

        socket.on('joinrequest', (rooms) => {
            console.log(rooms);
            if(!rooms) return;
            rooms.forEach((room) => {
                if (room.stockname && typeof room.stockname === 'string') {
                    socket.join(room.stockname);
                    fetchAndUpdateStockPrice(room.stockname, socket);
                }
            });
        });

        socket.on('leaverequest', (rooms) => {
            if(!rooms) return;
            rooms.forEach((room) => {
                if (room.stockname && typeof room.stockname === 'string') {
                    socket.leave(room.stockname);
                }
            });
        });

        socket.on('disconnect', () => {
            delete userSocketMap[socket.username];
            console.log(`User ${socket.username} disconnected`);
        });
    });

    // General namespace without authentication
    const generalNamespace = io.of('/general');
    generalNamespace.on('connection', (socket) => {
        console.log('A client connected to the general namespace');

        socket.on('joinrequest', (rooms) => {
            if(!rooms) return;
            rooms.forEach((room) => {
                if (room.stockname && typeof room.stockname === 'string') {
                    socket.join(room.stockname);
                    fetchAndUpdateStockPrice(room.stockname, socket);
                }
            });
        });

        socket.on('leaverequest', (rooms) => {
            if(!rooms) return;
            rooms.forEach((room) => {
                if (room.stockname && typeof room.stockname === 'string') {
                    socket.leave(room.stockname);
                }
            });
        });

        socket.on('disconnect', () => {
            console.log(`User disconnected from general server`);
        });
    });
}

// Utility function to fetch and update stock price, emitting to roo

// Access Socket.IO instance
function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized.');
    }
    return io;
}

function sendUserSpecificUpdate(username, message) {
  const socketId = userSocketMap[username];
  console.log(username);
  console.log(userSocketMap[username]);
  console.log(io.sockets.sockets);
  if (socketId && io.of('/auth').sockets.get(socketId)) {
      io.of('/auth').to(socketId).emit('order_executed', message);
      console.log(`Notified ${username} of order execution`);
  } else {
      console.log(`No active socket for user ${username}`);
  }
}

module.exports = {
  initSocket,
  getIO,
  userSocketMap, 
  sendUserSpecificUpdate  
};



