const boom = require("@hapi/boom");
const logModel = require("../models/log");
const fs = require("fs");
const path = require("path");

exports.getLogByTrial = (req, res, next) => {
  console.log("getLogByTrial");
  logModel.getLogByName(req.params.trialName, (err, data) => {
    if (err) {
      console.log("getLogByTrial:", err);
      next(boom.boomify(err));
    } else if (!data) {
      console.log("getLogByTrial:", `${req.params.trialName} not found.`);
      next(boom.notFound("Log not found."));
    } else {
      console.log("getLogByTrial:", "Success");
      res.json({
        statusCode: 200,
        data: data?.entries,
      });
    }
  });
};

exports.createLog = async (req, res, next) => {
  // create new log with desired name
  const name = req.params.trialName;
  console.log("createLog", name);

  let exists = await logModel.exists({ name });

  if (exists) {
    console.log("createLog:", "log exists", name);
    next(boom.badRequest("Log already exists."));
  } else {
    // add log to user "database"
    // TODO refactor users.json and trials.json to use mongodb
    const subjectId = req.query.subjectId;
    console.log("createLog:", "subjectId =", subjectId);
    fs.readFile("./users.json", (err, data) => {
      if (err) {
        next(boom.boomify(err));
      } else {
        let users = JSON.parse(data);
        for (let i = 0; i < users.length; i++) {
          if (users[i].subject_id == subjectId) {
            if (!users[i].taskLogs.includes(name)) {
              users[i].taskLogs.push(name);
            }
          }
        }
        fs.writeFile("./users.json", JSON.stringify(users), (err) => {
          if (err) {
            console.log(err);
            next(boom.boomify(err));
          }
        });
      }
    });
    // add log to logs database
    logModel.createLog(name, (err, data) => {
      if (err) {
        console.log("createLog:", err);
        next(boom.boomify(err));
      } else {
        console.log("createLog:", `New log created ${name}\n`);
        res.status(201).json({
          statusCode: 201,
          message: `Successfully created ${name}.json`,
          data,
        });
      }
    });
  }
};

exports.updateLogEntry = async (req, res, next) => {
  const name = req.params.trialName;
  console.log(`updateLogEntry ${name}`);
  // TODO validate body syntax
  let exists = await logModel.exists({ name });

  if (!exists) {
    console.log("updateLogEntry:", `${name} not found.`);
    next(boom.notFound("Log not found."));
  } else {
    const entry = req.body;
    logModel.addLogEntry(name, entry, (err, data) => {
      if (err) {
        console.log("updateLogEntry:", err);
        next(boom.boomify(err));
      } else {
        console.log("updateLogEntry:", `Successfully added ${entry.id}`);
        res.json({
          statusCode: 200,
          message: "Log entry Successfully added",
        });
      }
    });
  }
};
