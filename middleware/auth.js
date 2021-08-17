const getUserFromToken = require('../utils/getUserFromToken');
const boom = require("@hapi/boom");
const parseCookies = require("../utils/parseCookies");

const auth = (req, res, next) => {
	let cookieList = parseCookies(req); 
  // accept authorization headers for secure api requests
  // cookie token is for the browser only
	const token = cookieList["token"] || req.headers.authorization;
	
  try {
    let user = getUserFromToken(token);
    req.currentUser = user;
    next();
    return;
  } catch (err) {
    // check if the client accepts html content
    if (/text\/html/.test(req.headers.accept)) {
      res.redirect("https://" + req.headers.host + "/login");
      return;
    }
    next(boom.unauthorized("Authentication Failed."));
  }
};

module.exports = auth;