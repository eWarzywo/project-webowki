# ZSKCheatSheet

An Express-based npm package that serves an HTML cheat sheet with all important information for the INF04 exam.

## Installation

```bash
npm install
```

## Usage

### As a standalone application

```bash
npm start
```

The server will start on `http://localhost:3001` by default.

### As an imported module

```javascript
const createCheatSheetApp = require('zskcheatsheet');

// Start with default port (3001)
const { app, server } = createCheatSheetApp();

// Or specify a custom port
const { app, server } = createCheatSheetApp(8080);
```

## Features

The cheat sheet includes:

- **SQL Databases** - Basic SQL commands, aggregate functions, data types
- **Web Technologies** - HTML, CSS, JavaScript fundamentals
- **Programming** - OOP concepts, data structures, algorithm complexity
- **Computer Networks** - OSI model, network protocols, IP addressing
- **Security** - Security threats, protection methods, GDPR basics
- **Exam Tips** - Practical advice for the INF04 exam

## Contents

The application serves a comprehensive HTML page with:
- Responsive design (mobile-friendly)
- Quick navigation links
- Code examples and syntax
- Print-friendly styles
- Clean, modern UI

## Development

The package structure:
```
ZSKCheatSheet/
├── index.js           # Express server
├── package.json       # Package configuration
├── README.md          # This file
└── public/
    ├── index.html     # Main HTML content
    └── styles.css     # CSS styling
```

## License

MIT
