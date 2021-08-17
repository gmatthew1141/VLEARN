const app = require("./app");
const http = require("http");
const WebSocket = require("ws");
const url = require("url");
const getUserFromToken = require("./utils/getUserFromToken");
const parseCookies = require("./utils/parseCookies");

const server = http.createServer(app);

const wss = new WebSocket.Server({
  noServer: true,
  clientTracking: true,
});

wss.on("connection", (ws, req) => {
  // Check if connection has been dropped
  ws.isAlive = true;
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("close", (connection) => {
    console.log("Closing", connection);
  });

  ws.on("message", (message) => {
    console.log("Websocket Message: " + message);
  });

  // Sending confirm message to the connected client.
  ws.send("Successfully connected");
});

// HTTP Server ==> WebSocket upgrade handling:
server.on("upgrade", function upgrade(request, socket, head) {
  let headers = request.headers;
  // Authenticate or terminate connection
  // Expecting JWT to be in authorization header
  // or cookie if sent from the browser
  let jwt;
  if (headers.authorization) {
    console.log("WebSocket Authorizing with Authorization Header");
    jwt = headers.authorization;
  } else if (headers.cookie) {
    console.log("WebSocket Authorizing with Cookie");
    jwt = parseCookies(request)["token"];
  } else {
    console.log("No JWT found.");
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }
  console.log("Attempting to authenticate websocket...");
  try {
    let user = getUserFromToken(jwt);
    if (!user.isAdmin) {
      console.log(`User: ${user.username} tried to access the websocket.`);
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    console.log("Successfully authenticated", user.username);
  } catch (err) {
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
    return;
  }

  console.log(
    new Date() + " | Upgrading http connection to wss: url = " + request.url
  );

  // Parsing url from the request.
  var parsedUrl = url.parse(request.url, true, true);
  const pathname = parsedUrl.pathname;

  console.log(new Date() + " | Pathname = " + pathname);

  // If path is valid connect to the websocket.
  if (pathname === "/") {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
  }
});

// check if the connection is still alive
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.close(1000);

    ws.isAlive = false;
    ws.ping(null, false, true);
  });
}, 10000);

// start server
server.listen(process.env.PORT || 3000, () => {
  console.log(`Express running → PORT ${server.address().port}`);
});

// Detecting interrupt signal.
process.on("SIGINT", function () {
  console.log(new Date() + " | Caught interrupt signal.");
  // Closing server.
  wss.close(function () {
    console.log(new Date() + " | Server is closed.");
    // Exiting process.
    process.exit();
  });
});

exports.broadcastMessage = (message) => {
  let toReturn = null;
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
  return toReturn;
};
