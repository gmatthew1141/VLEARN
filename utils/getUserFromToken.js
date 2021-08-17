const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

function getUserFromToken(token) {
  let toReturn;
  jwt.verify(token, process.env.JWT_KEY, (err, data) => {
    if (err) {
      throw err;
    }
    let json = fs.readFileSync(path.resolve(__dirname, "../users.json"));
    if (err) {
      console.error(err);
      throw err;
    }

    //find the user in the users json.
    let users = JSON.parse(json);
    users = users.filter(
      (user) => user.username.normalize() === data.username.normalize()
    );

    if (users.length == 0) {
      toReturn = undefined;
    }
    toReturn = users[0];
  }); //verify the jwt token.
  return toReturn;
}

module.exports = getUserFromToken;
