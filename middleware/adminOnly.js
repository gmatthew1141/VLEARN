const boom = require("@hapi/boom");

const adminOnly = (req, res, next) => {
  if (req.currentUser) {
    if (!req.currentUser.isAdmin) {
      next(boom.forbidden("Requires Administrator permission."));
      return;
    }
  }
  next();
};

module.exports = adminOnly;
