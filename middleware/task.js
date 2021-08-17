const parseCookies = require("../utils/parseCookies");

const task = (req, res, next) => {
  const cookieList = parseCookies(req);
  const task = cookieList["task"];
  const timestamp = cookieList["timestamp"];

  if (task && timestamp) {
    req.task = task;
    req.timestamp = timestamp;
    next();
  } else {
    res.json({ status: 404, error: "Task Data Missing" });
  }
};

module.exports = task;
