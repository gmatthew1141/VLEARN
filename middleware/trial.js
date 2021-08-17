const parseCookies = require("../utils/parseCookies");

const trial = (req, res, next) => {
  const cookieList = parseCookies(req);
  const trial = cookieList["trial"];
  if (trial) {
    req.trial = trial;
    next();
  } else {
    res.json({ status: 404, error: "Trial Data Missing" });
  }
};

module.exports = trial;
