// routes affecting trials
const fs = require("fs");

// GET Requests
exports.getTrialEditor = (req, res) => {
  if (req.currentUser.isAdmin != true) {
    res.redirect("401");
  } else {
    fs.readFile("trials.json", (err, data) => {
      if (err) {
        console.log(err);
        res.json({ status: 500, error: "ERROR! Could not find trial!" });
      } else {
        var trials = JSON.parse(data);
        var len = trials.length;

        var trial = null;
        for (var i = 0; i < len; i++) {
          if (
            trials[i].name.normalize() === req.params.trial_name.normalize()
          ) {
            //this is our trial for this page and we want to send it to pug
            // to display its info.
            trial = {};
            trial.preSurveyURL = trials[i].prelim_survey;
            trial.mainSurveyURL = trials[i].main_survey;
            trial.postSurveyURL = trials[i].post_survey;
            trial.videoURL = trials[i].video;
            trial.task = trials[i].task;
            trial.name = trials[i].name;
            if (trials[i].params != undefined) {
              trial.trashSize = trials[i].params.trashSize;
              trial.numBumps = trials[i].params.numBumps;
              trial.pipe1 = trials[i].params.pipe1;
              trial.pipe2 = trials[i].params.pipe2;
              trial.pipe3 = trials[i].params.pipe3;
              trial.pipe4 = trials[i].params.pipe4;
            } else {
              trial.trashSize = "";
              trial.numBumps = "";
            }

            break;
          }
        }

        if (trial == null) {
          res.json({ status: 500, error: "ERROR! Could not find trial!" });
        }

        fs.readFile("tasks.json", (err, data) => {
          if (err) {
            console.log(err);
            res.json({
              status: 500,
              error: "ERROR! Could not find any published tasks",
            });
          } else {
            var tasks = JSON.parse(data);
            var len = tasks.length;

            var publishedTasks = [];
            for (var i = 0; i < len; i++) {
              if (tasks[i].published == true) {
                publishedTasks.push(tasks[i]);
              }
            }

            res.render("editTrial", {
              trial: trial,
              publishedTasks: publishedTasks,
            });
          }
        });
      }
    });
  }
};

exports.getTrialCreator = (req, res) => {
  if (req.currentUser.isAdmin == true) {
    fs.readFile("tasks.json", (err, data) => {
      if (err) {
        console.log(err);
        res.json({
          status: 500,
          error: "Error! No Published tasks to display!",
        });
      } else {
        var tasks = JSON.parse(data);
        var publishedTasks = [];

        for (var i = 0; i < tasks.length; i++) {
          if (tasks[i].published == true) {
            publishedTasks.push(tasks[i]);
          }
        }
      }
      res.render("createTrial", { publishedTasks: publishedTasks });
    });
  } else {
    res.render("401");
  }
};

exports.getTrialRepo = (req, res) => {
  if (req.currentUser.isAdmin == true) {
    fs.readFile("trials.json", (err, trialData) => {
      if (err) {
        console.log(err);
        res.json({ status: 500, error: "ERROR! Could not find trials!" });
      } else {
        fs.readFile("tasks.json", (err, taskData) => {
          if (err) {
            console.log(err);
            res.json({ status: 500, error: "ERROR! Could not find tasks!" });
          } else {
            var tasks = JSON.parse(taskData);
            var trials = JSON.parse(trialData);

            var publishedTrials = [];
            var publishedTasks = [];
            var developmentTrials = [];
            var developmentTasks = [];

            for (var i = 0; i < tasks.length; i++) {
              if (tasks[i].published == true) {
                publishedTasks.push(tasks[i].name);
              } else {
                developmentTasks.push(tasks[i].name);
              }
            }

            for (var i = 0; i < trials.length; i++) {
              if (trials[i].published == true) {
                publishedTrials.push(trials[i].name);
              } else {
                developmentTrials.push(trials[i].name);
              }
            }

            res.render("trialRepo", {
              publishedTasks: publishedTasks,
              publishedTrials: publishedTrials,
              developmentTasks: developmentTasks,
              developmentTrials: developmentTrials,
            });
          }
        });
      }
    });
  } else {
    res.redirect("401");
  }
};

exports.getTestSubjectTrial = (req, res) => {
  var trialName = req.params.trialName;
  var subject = {};
  subject.id = req.currentUser.subject_id;
  subject.isAdmin = req.currentUser.isAdmin;
  assignedSubject = req.query.subjectId;
  fs.readFile("trials.json", (err, data) => {
    if (err) {
      console.log(err);
      res.json({ status: 500, error: "ERROR! Could not locate trial!" });
    } else {
      var trials = JSON.parse(data);
      var trial = null;
      var len = trials.length;

      for (var i = 0; i < len; i++) {
        if (trials[i].name.normalize() === req.params.trialName.normalize()) {
          trial = {};
          trial.preSurveyURL = trials[i].prelim_survey;
          trial.mainSurveyURL = trials[i].main_survey;
          trial.postSurveyURL = trials[i].post_survey;
          trial.videoURL = trials[i].video;
          trial.task = trials[i].task;
          trial.name = trials[i].name;

          break;
        }
      }

      if (trial == null) {
        res.json({ status: 500, error: "ERROR! Could not locate trial!" });
      }

      res.render("tsTrial", { subject, trial, assignedSubject });
    }
  });
};

// POST Requests

exports.saveTrial = (req, res) => {
  fs.readFile("trials.json", (err, data) => {
    if (err) {
      console.log(err);
      res.json({ status: 500, error: "ERROR! Trial could not be created." });
    } else {
      var trials = JSON.parse(data);

      for (var i = 0; i < trials.length; i++) {
        if (req.body.name.normalize() === trials[i].name.normalize()) {
          res.json({
            status: 400,
            error: "ERROR! Trial with that name already exists.",
          });
        }
      }
      var newTrial = {
        name: req.body.name,
        prelim_survey: req.body.prelim_survey,
        main_survey: req.body.main_survey,
        post_survey: req.body.post_survey,
        video: req.body.video,
        task: req.body.task,
        published: false, //tasks aren't published when they're created.
        params: {
          numBumps: req.body.numBumps,
          trashSize: req.body.trashSize,
          pipe1: req.body.pipe1,
          pipe2: req.body.pipe2,
          pipe3: req.body.pipe3,
          pipe4: req.body.pipe4,
        },
      };

      trials.push(newTrial);

      fs.writeFile("trials.json", JSON.stringify(trials), (err) => {
        if (err) {
          console.log(err);
          res.json({
            status: 500,
            error: "ERROR! Trial could not be created.",
          });
        } else {
          res.json({ status: 201, message: "Trial successfully created!" });
        }
      });
    }
  });
};

exports.editTrial = (req, res) => {
  if (req.currentUser.isAdmin != true) {
    res.redirect("401");
  }
  fs.readFile("trials.json", (err, data) => {
    if (err) {
      console.log(err);
      res.json({ status: 500, error: "ERROR! Could not edit trial." });
    } else {
      var ts = JSON.parse(data);
      var len = ts.length;

      for (var i = 0; i < len; i++) {
        if (ts[i].name.normalize() === req.body.name.normalize()) {
          //locate task/trial by name and change its "published" variable to true.

          ts[i].name = req.body.newName;
          ts[i].prelim_survey = req.body.prelim_survey;
          ts[i].main_survey = req.body.main_survey;
          ts[i].post_survey = req.body.post_survey;
          ts[i].video = req.body.video;
          ts[i].task = req.body.task;
          ts[i].published = false;
          ts[i].params = {
            numBumps: req.body.numBumps,
            trashSize: req.body.trashSize,
            pipe1: req.body.pipe1,
            pipe2: req.body.pipe2,
            pipe3: req.body.pipe3,
            pipe4: req.body.pipe4,
          };
          break;
        }
      }

      //write this change back to file.

      fs.writeFile("trials.json", JSON.stringify(ts), (err) => {
        if (err) {
          console.log(err);
          res.json({ status: 500, error: "ERROR! Could not edit trial. " });
        } else {
          fs.readFile("users.json", (err, data) => {
            if (err) {
              console.log(err);
              res.json({
                status: 500,
                error: "Could not update trial for users.",
              });
            } else {
              var users = JSON.parse(data);

              //unassign users who were assigned to this trial.
              users.forEach(function (user) {
                user.trials = user.trials.filter(function (el) {
                  return el.name != req.body.name;
                });
              });

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
                    message:
                      "Trial successfully edited. Moved to Development Mode.",
                  });
                }
              });
            }
          });
        }
      });
    }
  });
};
