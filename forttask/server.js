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

        socket.on('join household', (householdId) => {
            socket.join(`household-${householdId}`);
        });

        socket.on('refresh', (data) => {
            io.to(`household-${data.householdId}`).emit('refresh', data);
        });

        socket.on('disconnect', () => {
        });
    });

    server.listen(PORT, (err) => {
        if (err) throw err;
    });
});