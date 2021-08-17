// routes called by the bot
const boom = require("@hapi/boom");
const server = require("../server");
const logModel = require("../models/log");
const { Schema } = require("mongoose");
const { db } = require("../models/log");

// GET Requests
exports.getObjectIds = async (req, res, next) => {
  console.log("getObjectIds");
  const name = req.params.trialName;
  let exists = await logModel.exists({ name });

  if (!exists) {
    console.log(`getObjectIds: ${name} not found.`);
    next(boom.notFound("Log not found."));
  } else {
    logModel.getIdsByType(name, "object", (err, data) => {
      if (err) {
        console.log(err);
        next(boom.boomify(err));
      } else {
        console.log("getObjectIds: Success");
        res.json({
          statusCode: 200,
          data,
        });
      }
    });
  }
};

exports.getAgentIds = async (req, res, next) => {
  console.log("getAllAgentIds");
  const name = req.params.trialName;
  let exists = await logModel.exists({ name });

  if (!exists) {
    console.log("getAllAgentIds:", `${name} not found.`);
    next(boom.notFound("Log not found."));
  } else {
    logModel.getAgentIds(name, (err, data) => {
      if (err) {
        console.log("getAllAgentIds:", err);
        next(boom.boomify(err));
      } else {
        console.log("getAllAgentIds:", "Success");
        res.json({
          statusCode: 200,
          data,
        });
      }
    });
  }
};

exports.getTeleporterIds = async (req, res, next) => {
  console.log("getTeleporterIds");
  const name = req.params.trialName;
  let exists = await logModel.exists({ name });

  if (!exists) {
    console.log("getAgentById:", `${name} not found.`);
    next(boom.notFound("Log not found."));
  } else {
    logModel.getIdsByType(name, "teleporter", (err, data) => {
      if (err) {
        console.log("getAgentById:", err);
        next(boom.boomify(err));
      } else {
        console.log("getAgentById:", "Success");
        res.json({
          statusCode: 200,
          data,
        });
      }
    });
  }
};

// get most recent log entry for a given object
exports.getObjectById = async (req, res, next) => {
  req.query.type = "object";
  req.query.id = req.params.id;
  this.getEntriesByName(req, res, next);
};

// the most recent log entry for a given agent
exports.getAgentById = async (req, res, next) => {
  req.query.type = "agent";
  req.query.id = req.params.id;
  this.getEntriesByName(req, res, next);
};

// get most recent log entry for a given teleporter
exports.getTeleporterById = async (req, res, next) => {
  req.query.type = "teleporter";
  req.query.id = req.params.id;
  this.getEntriesByName(req, res, next);
};

// limit the log entries through query parameters
exports.getEntriesByName = async (req, res, next) => {
  console.log("getLogData");
  const name = req.params.trialName;
  let exists = await logModel.exists({ name });
  query = req.query;

  if (!exists) {
    console.log("getLogData:", `${name} not found.`);
    next(boom.notFound("Log not found."));
  } else {
    logModel.filterLog(name, { ...req.query }, (err, data) => {
      if (err) {
        console.log("getLogData:", err);
        next(boom.boomify(err));
      } else {
        console.log("getLogData:", "Success");
        res.json({
          statusCode: 200,
          data: data || null,
        });
      }
    });
  }
};

exports.getRecentTrial = (req, res, next) => {
  console.log("getRecentTrial");

  logModel.getRecentLogName((err, data) => {
    if (err) {
      console.log("getRecentTrial:", err);
      next(boom.boomify(err));
    } else if (!data) {
      console.log("getRecentTrial:", "No logs found.");
      next(boom.notFound("No logs found."));
    } else {
      console.log("getRecentTrial:", "Success");
      res.json({
        statusCode: 200,
        data,
      });
    }
  });
};

// POST Requests
exports.sendActionToBot = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    next(boom.badRequest("Request body required."));
    return;
  }
  if (!req.body.actionType) {
    next(boom.badRequest("Request requires an actionType."));
    return;
  }
  const actionType = req.body.actionType.toUpperCase();
  if (
    actionType !== "MOVE" &&
    actionType !== "INTERACT" &&
    actionType !== "DROP" &&
    actionType !== "SPAWN"
  ) {
    next(boom.badRequest("Invalid actionType"));
    return;
  }
  if (req.body.actionType.toUpperCase() === "MOVE" && !req.body.teleporterID) {
    next(boom.badRequest("Move action requires a teleporterID."));
    return;
  } else if (
    req.body.actionType.toUpperCase() === "INTERACT" &&
    !req.body.objectID
  ) {
    next(boom.badRequest("Interact action requires an objectID."));
    return;
  } else if (
    req.body.actionType.toUpperCase() === "DROP" &&
    !req.body.position
  ) {
    req.body.position = { x: 0, y: 2, z: 0 };
  }

  try {
    server.broadcastMessage(`${JSON.stringify(req.body)}`);
  } catch (err) {
    next(boom.boomify(err));
    return;
  }
  res.json({
    statusCode: 200,
    message: `Command ${req.body.actionType} successfully sent.`,
  });
};
