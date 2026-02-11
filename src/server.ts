
import { httpServer } from './app.js';
import { getEnvironmentConfig } from './utils/config.js';

const config = getEnvironmentConfig();
const PORT = config.PORT;

httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Images directory serving at /uploads`);
    console.log(`🌍 Environment: ${config.NODE_ENV}`);
    console.log(`🔌 WebSocket server initialized`);
});
