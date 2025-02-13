# Ultraviolet Proxy

This project is a static HTML proxy built using Ultraviolet and deployed with Socket.IO and Express. It allows you to serve static content and proxy requests seamlessly.

## Project Structure

```
ultraviolet-proxy
├── public
│   ├── index.html          # Main HTML page for the proxy
│   ├── ultraviolet
│   │   └── index.js       # JavaScript for Ultraviolet static proxy functionality
├── src
│   ├── app.js             # Entry point of the application
│   └── routes
│       └── proxy.js       # Routing logic for the proxy
├── package.json            # npm configuration file
├── .gitignore              # Files and directories to ignore by Git
└── README.md               # Documentation for the project
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd ultraviolet-proxy
   ```

2. Install the dependencies:
   ```
   npm install
   ```

## Usage

1. Start the server:
   ```
   npm start
   ```

2. Open your browser and navigate to `http://localhost:3000` to access the proxy.

## Contributing

Feel free to submit issues or pull requests to improve the project. 

## License

This project is licensed under the MIT License.