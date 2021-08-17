// routes specific to the admin
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const logModel = require("../models/log");

// GET Requests
exports.getAssignTestSubject = (req, res) => {
  if (req.currentUser.isAdmin == true) {
    fs.readFile("users.json", (err, data) => {
      if (err) {
        console.log(err);
        res.json({ status: 500, error: "ERROR! Could not load users!" });
      } else {
        let users = JSON.parse(data);
        let len = users.length;

        let assignedtoTrial = [];
        let notAssignedtoTrial = [];
        let completedTrial = [];
        for (let i = 0; i < len; i++) {
          if (users[i].isAdmin != true) {
            //only add user to the list of subjects if they are not an admin.
            let assigned = false;
            let completed = false;
            for (let j = 0; j < users[i].trials.length; j++) {
              if (users[i].trials[j].name == req.params.trial_name) {
                assigned = true;
                if (users[i].trials[j].numTrials == 0) {
                  completed = true;
                }
                break;
              }
            }
            if (assigned == true && completed == false) {
              assignedtoTrial.push(users[i].subject_id);
            } else if (assigned == true && completed == true) {
              completedTrial.push(users[i].subject_id);
            } else {
              notAssignedtoTrial.push(users[i].subject_id);
            }
          }
        }

        res.render("assignTStoTrial", {
          trial: req.params.trial_name,
          assignedtoTrial: assignedtoTrial,
          notAssignedtoTrial: notAssignedtoTrial,
          completedTrial: completedTrial,
        });
      }
    });
  } else {
    res.redirect("401");
  }
};

exports.getCreateAccount = (req, res) => {
  if (req.currentUser.isAdmin == true) {
    res.render("createAccount");
  } else {
    res.redirect("401");
  }
};

exports.getTestSubjectView = (req, res) => {
  if (req.currentUser.isAdmin == true) {
    fs.readFile("users.json", (err, data) => {
      if (err) {
        console.log(err);
        res.json({
          status: 500,
          error: "ERROR! Unable to Locate Test Subject!",
        });
      } else {
        fs.readFile("trials.json", (err, trialsData) => {
          if (err) {
            console.log(err);
            res.json({ status: 500, error: "ERROR! Unable to Find Trials!" });
          } else {
            let users = JSON.parse(data);
            let trialData = JSON.parse(trialsData);
            let len = users.length;
            let subject = {};
            let trials = [];
            let publishedTrials = [];
            for (let i = 0; i < len; i++) {
              if (users[i].subject_id == req.params.subject_id) {
                //if this is the user we want to send their data.
                subject.id = users[i].subject_id;
                subject.username = users[i].username;
                subject.notes = users[i].notes;
                trials = users[i].trials;
                break;
              }
            }

            len = trialData.length;
            for (let i = 0; i < len; i++) {
              if (trialData[i].published == true) {
                publishedTrials.push(trialData[i].name);
              }
            }
            //console.log(subject);
            res.render("adminTSView", {
              ts: subject,
              trials: trials,
              publishedTrials: publishedTrials,
            });
          }
        });
      }
    });
  } else {
    res.redirect("401");
  }
};

exports.getFileBrowser = (req, res) => {
  fs.readFile("users.json", (err, data) => {
    if (err) {
      console.log(err);
      res.json({ status: 500, error: "ERROR! Could not locate log files." });
    } else {
      let users = JSON.parse(data);
      let subjects = [];
      let len = users.length;
      for (let i = 0; i < len; i++) {
        if (users[i].isAdmin == false) {
          //if the user is not an admin then they are a test subject.
          let newSubject = {
            id: users[i].subject_id,
            taskLogs: users[i].taskLogs,
          };
          //console.log(users[i].subject_id);
          subjects.push(newSubject);
        }
      }
      //console.log(subjects);
      res.render("fileBrowser", { testSubjects: subjects });
    }
  });
};

exports.getDownloadFile = (req, res) => {
  const files = req.params.files.split("=");
  logModel.find({  name: { $in: files }  }, (err, logs) => {
    const zip = new require("node-zip")();
    logs.forEach((log) => {
      zip.file(log.name + ".json", JSON.stringify(log.entries));
    });
    const data = zip.generate({ base64: false, compression: "DEFLATE" });

    fs.writeFileSync(path.join(__dirname, "logFiles.zip"), data, "binary");

    res.download(path.join(__dirname, "logFiles.zip"), (err) => {
      if (err) {
        console.log(err);
      } else {
        //delete the zip file.
        fs.unlinkSync(path.join(__dirname, "logFiles.zip"));
      }
    });
  });
};

exports.deleteFileBrowser = (req, res) => {
  const files = JSON.parse(req.body.files);
  console.log("deleting", files);

  fs.readFile("users.json", (err, data) => {
    if (err) {
      console.log(err);
      res.json({ status: 500, error: "ERROR! Could Not Delete Files!" });
    } else {
      let users = JSON.parse(data);

      files.forEach(function (file) {
        //for each file, filter it out of each users taskLogs.
        for (let i = 0; i < users.length; i++) {
          if (users[i].isAdmin == false) {
            //only test subjects have user logs.
            users[i].taskLogs = users[i].taskLogs.filter(function (el) {
              return el != file;
            });
          }
        }

        // remove log from mongodb
        logModel.deleteLog(file, (err, data) => {
          if (err) {
            console.log(err);
          }
        });
      });

      //now write the user data back to file.
      fs.writeFile("users.json", JSON.stringify(users), (err) => {
        if (err) {
          console.log(err);
          res.json({
            status: 500,
            error: "ERROR! Could Not Remove User Logs!",
          });
        } else {
          res.json({ status: 200, message: "Files Deleted!" });
        }
      });
    }
  });
};

// POST Requests
exports.editUser = (req, res) => {
  if (req.currentUser.isAdmin != true) {
    res.redirect("401");
  }
  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    if (err) {
      res.json({ status: 500, error: "Error! Could Not Reissue Password" });
    }
    fs.readFile("./users.json", (err, data) => {
      if (err) {
        res.json({ status: 500, error: "Error! Could Not Reissue Password." });
      } else {
        //first find the user.

        let users = JSON.parse(data);
        let len = users.length;
        for (let i = 0; i < len; i++) {
          if (users[i].subject_id == req.body.subject_id) {
            //only update users when user info is actually changed/sent
            if (req.body.password != "") {
              users[i].password = hash;
            }

            if (req.body.username != "") {
              users[i].username = req.body.username;
            }

            if (req.body.notes != "") {
              users[i].notes = req.body.notes;
            }
            break;
          }
        }

        fs.writeFile("./users.json", JSON.stringify(users), (err, data) => {
          if (err) {
            res.json({
              status: 500,
              error: "Error! Could Not Reissue Password.",
            });
          } else {
            res.json({
              status: 200,
              message: "User Password Successfully updated.",
            });
          }
        });
      }
    });
  });
};

exports.deleteUser = (req, res) => {
  if (req.currentUser.isAdmin != true) {
    res.redirect("401");
  }

  let user = req.body.user;

  fs.readFile("./users.json", (err, data) => {
    if (err) {
      res.json({ status: 500, error: "Error! Could Not Delete User" });
    } else {
      //first find the user.

      let users = JSON.parse(data);

      let userLogs = [];
      //find all the log files for that user.
      for (let i = 0; i < users.length; i++) {
        if (users[i].subject_id == user) {
          userLogs = [].concat(users[i].taskLogs);
        }
      }
      //filter the user out of the users json.
      users = users.filter(function (el) {
        return el.subject_id != user;
      });
      //delete all the log files for that user.
      for (let i = 0; i < userLogs.length; i++) {
        try {
          fs.unlinkSync("./logs/" + userLogs[i]);
        } catch (err) {
          console.log(err);
        }
      }

      fs.writeFile("users.json", JSON.stringify(users), (err) => {
        if (err) {
          res.json({ status: 500, error: "Error! Could Not Delete User" });
        } else {
          res.json({ status: 200, message: "USER SUCCESSFULLY DELETED!" });
        }
      });
    }
  });
};

exports.assignSubjectTestTrial = (req, res) => {
  if (req.currentUser.isAdmin != true) {
    res.redirect("401");
  } else {
    fs.readFile("users.json", (err, data) => {
      if (err) {
        console.log(err);
        res.json({
          status: 500,
          error: "ERROR! Could not assign user to trial!",
        });
      } else {
        let users = JSON.parse(data);
        let len = users.length;

        let newTrial = {
          name: req.body.trial,
        };
        for (let i = 0; i < len; i++) {
          if (users[i].subject_id == req.body.subject_id) {
            //desired user
            let assigned = false;
            for (let j = 0; j < users[i].trials.length; j++) {
              //make sure the user is not already assigned to this tria.
              if (
                users[i].trials[j].name.normalize() ===
                req.body.trial.normalize()
              ) {
                assigned = true;
                break; //this subject is already assigned to this trial.
              }
            }

            //do not allow users to be assigned to the same trial twice.
            if (assigned == false) {
              users[i].trials.push(newTrial);
            } else {
              res.json({
                status: 400,
                error: "User is already assigned to this trial.",
              });
            }

            break;
          }
        }

        fs.writeFile("users.json", JSON.stringify(users), (err) => {
          if (err) {
            console.log(err);
            res.json({
              status: 500,
              error: "ERROR! could not assign user to trial!",
            });
          } else {
            res.json({
              status: 200,
              message: "User Successfully assigned to trial!",
            });
          }
        });
      }
    });
  }
};

exports.removeSubjectFromTrial = (req, res) => {
  fs.readFile("users.json", (err, data) => {
    if (err) {
      console.log(err);
      res.json({ status: 500, error: "Could not update trial for users." });
    } else {
      let users = JSON.parse(data);
      let len = users.length;

      //update trial name for any users.
      for (let i = 0; i < len; i++) {
        let trial_len = users[i].trials.length;
        if (users[i].subject_id === req.body.subject_id) {
          //remove the trial from the user who was passed in as an argument.
          users[i].trials = users[i].trials.filter(function (el) {
            return el.name != req.body.trial;
          });
        }
      }

      fs.writeFile("users.json", JSON.stringify(users), (err) => {
        if (err) {
          console.log(err);
          res.json({
            status: 500,
            error: "ERROR! Could not update trial for users.",
          });
        } else {
          res.json({
            status: 200,
            message: "Trial successfully edited. Moved to Edit Mode.",
          });
        }
      });
    }
  });
};

exports.saveMeetingInfo = (req, res) => {
  /*"date": req.body.date, 
                        "time": req.body.time, 
                        "meeting_id": req.body.meeting_id, 
                        "numTrials": req.body.numTrials, */
  if (req.currentUser.isAdmin != true) {
    res.redirect("401");
  } else {
    fs.readFile("users.json", (err, data) => {
      if (err) {
        console.log(err);
        res.json({
          status: 500,
          error: "ERROR! Could not assign user to trial!",
        });
      } else {
        let users = JSON.parse(data);
        let len = users.length;

        for (let i = 0; i < len; i++) {
          if (users[i].subject_id == req.body.subject_id) {
            //this is the user we want to set meeting details for.
            for (let j = 0; j < users[i].trials.length; j++) {
              if (users[i].trials[j].name == req.body.trial) {
                //this is the trial we need to update meeting details for.
                users[i].trials[j].date = req.body.date;
                users[i].trials[j].time = req.body.time;
                users[i].trials[j].meeting_id = req.body.meeting_id;
                users[i].trials[j].numTrials = req.body.numTrials;
              }
            }

            break;
          }
        }

        fs.writeFile("users.json", JSON.stringify(users), (err) => {
          if (err) {
            console.log(err);
            res.json({
              status: 500,
              error: "ERROR! could not assign user to trial!",
            });
          } else {
            res.json({
              status: 200,
              message: "User Successfully assigned to trial!",
            });
          }
        });
      }
    });
  }
};
