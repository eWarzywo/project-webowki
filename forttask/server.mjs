import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { parse } from 'url';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });
    const io = new Server(server);

    io.on('connection', (socket) => {

        socket.on('join-household', (householdId) => {
            socket.join(`household-${householdId}`);
        });

        socket.on('leave-household', (householdId) => {
            socket.leave(`household-${householdId}`);
        });

        socket.on('update-events', (householdId) => {
            io.to(`household-${householdId}`).emit('update-events', householdId);
        });

        socket.on('update-shopping', (householdId) => {
            io.to(`household-${householdId}`).emit('update-shopping', householdId);
        });

        socket.on('update-bills', (householdId) => {
            io.to(`household-${householdId}`).emit('update-bills', householdId);
        });

        socket.on('disconnect', () => {
        });
    });

    server.listen(PORT, (err) => {
        if (err) throw err;
    });
});