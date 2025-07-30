const socketIo = require('socket.io');
const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');

let io;

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
            origin: '*',
            methods: [ 'GET', 'POST' ]
        }
    });

    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);


        socket.on('join', async (data) => {
            const { userId, userType } = data;
            console.log(`User ${userId} (${userType}) joined with socket ${socket.id}`);

            if (userType === 'user') {
                await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
            } else if (userType === 'captain') {
                // Update captain socket ID and ensure they stay active
                await captainModel.findByIdAndUpdate(userId, {
                    socketId: socket.id,
                    status: 'active' // Ensure captain is active when they connect
                });
                console.log(`Captain ${userId} socket updated to ${socket.id} and set to active`);
            }
        });


        socket.on('update-location-captain', async (data) => {
            const { userId, location } = data;
            console.log(`Captain ${userId} location update:`, location);

            if (!location || !location.ltd || !location.lng) {
                return socket.emit('error', { message: 'Invalid location data' });
            }

            await captainModel.findByIdAndUpdate(userId, {
                location: {
                    ltd: location.ltd,
                    lng: location.lng
                }
            });

            console.log(`Captain ${userId} location updated successfully`);
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);

            // When a captain disconnects, set them to inactive
            captainModel.findOneAndUpdate(
                { socketId: socket.id },
                { status: 'inactive', socketId: null }
            ).then((captain) => {
                if (captain) {
                    console.log(`Captain ${captain._id} set to inactive due to disconnect`);
                }
            }).catch(err => {
                console.error('Error updating captain on disconnect:', err);
            });
        });
    });
}

const sendMessageToSocketId = (socketId, messageObject) => {

console.log(messageObject);

    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data);
    } else {
        console.log('Socket.io not initialized.');
    }
}

module.exports = { initializeSocket, sendMessageToSocketId };