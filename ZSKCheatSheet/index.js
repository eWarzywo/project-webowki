const express = require('express');
const path = require('path');

/**
 * Create and configure an Express application that serves INF04 exam cheat sheet
 * @param {number} port - Port number to listen on (default: 3001)
 * @returns {object} Express app instance
 */
function createCheatSheetApp(port = 3001) {
  const app = express();

  // Serve static files from the public directory
  app.use(express.static(path.join(__dirname, 'public')));

  // Main route to serve the cheat sheet
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // Start the server
  const server = app.listen(port, () => {
    console.log(`ZSK Cheat Sheet is running on http://localhost:${port}`);
  });

  return { app, server };
}

module.exports = createCheatSheetApp;

// If this file is run directly, start the server
if (require.main === module) {
  createCheatSheetApp();
}
