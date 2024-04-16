const socketIO = require('socket.io');

let io; // Socket.IO instance

function initSocket(server) {
    io = socketIO(server, {
        cors: {
            origin: '*',
        }
    });

    io.on('connection', (socket) => {
        console.log('A client connected');

        socket.on('joinrequest', (rooms) => {
          console.log(rooms);
          if(!rooms) return;
          
          rooms.forEach((room) => {
            socket.join(room.stockname);
          });
          console.log('keys : ', io.sockets.adapter.rooms)
        });
        
        socket.on('leaverequest1', (rooms) => {
          rooms.forEach((room) => {
            socket.leave(room.stockname);
          });
        });
        
        socket.on("hello", (d) => {
          console.log('hello', d);
        })
    
        socket.on('disconnect', () => {
          console.log('A client disconnected');
        });
      });
}

function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized.');
    }
    return io;
}

module.exports = {
    initSocket,
    getIO
};
