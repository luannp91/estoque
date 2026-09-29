let _io = null;

const realtimeService = {
    init(io) {
        _io = io;
        io.on("connection", (socket) => {
            console.log(`⚡ WS conectado: ${socket.usuario?.nome || "anônimo"} (${socket.id})`);
            socket.on("disconnect", () => {
                console.log(`⚡ WS desconectado: ${socket.id}`);
            });
        });
    },

    emit(evento, dados) {
        if (_io) _io.emit(evento, { ...dados, _timestamp: new Date().toISOString() });
    },

    get io() {
        return _io;
    }
};

module.exports = realtimeService;
