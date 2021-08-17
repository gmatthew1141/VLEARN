// routes affecting tasks
const fs = require("fs");

// GET Requests
exports.getTaskByName = (req, res) => {
  var taskName = req.params.name;
  fs.readFile("tasks.json", (err, data) => {
    if (err) {
      console.log(err);
      res.send("ERROR! Could Not Find Tasks!");
    } else {
      //Disk and Pipe are current hardocded so just display their unity pages and
      //dont look throug the tasks file.
      if (taskName === "Disk") {
        res.render("unityDisk",{
          user: req.currentUser,
        });
      } else if (taskName === "Pipe") {
        res.render("unityPipe",{
          user: req.currentUser,
        });
      } else if (taskName === "sceneCreator") {
        res.render("sceneCreator");
      }  else if(taskName === "Tower of Hanoi"){
        res.render("unityHanoi",{
          user: req.currentUser,
        });
      }
      else {
        res.render("taskLoader", {
          task: taskName,
          isAdmin: req.currentUser.isAdmin,
        });
      }
    }
  });
};

exports.getTaskEditor = (req, res) => {
  var taskName = req.params.name;
  fs.readFile("tasks.json", (err, data) => {
    if (err) {
      console.log(err);
      res.send("ERROR! Could Not Find Task!");
    } else {
      var tasks = JSON.parse(data);
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].name == taskName) {
          //if this is the task we want to load into the scene creator, then
          //we need to send its xml file along with it on page load.

          res.render("taskEditor", { task: taskName });
          return;
        }
      }
    }
  });
};

// POST Requests
exports.saveTask = (req, res) => {
  fs.readFile("tasks.json", (err, data) => {
    if (err) {
      console.log(err);
      res.json({ status: 500, error: "ERROR! Task could not be created." });
    } else {
      var tasks = JSON.parse(data);

      for (var i = 0; i < tasks.length; i++) {
        if (req.body.name.normalize() === tasks[i].name.normalize()) {
          res.json({
            status: 400,
            error: "ERROR! Task with that name already exists.",
          });
        }
      }
      var newTask = {
        name: req.body.name,
        xml: "default.xml",
        published: false, //tasks aren't published when they're created.
      };

      //need to do some extra stuff here as well to build the files.
      tasks.push(newTask);

      fs.writeFile("tasks.json", JSON.stringify(tasks), (err) => {
        if (err) {
          console.log(err);
          res.json({ status: 500, error: "ERROR! Task could not be created." });
        } else {
          res.json({ status: 201, message: "Task successfully created!" });
        }
      });
    }
  });
};

exports.editTask = (req, res) => {
  //when we edit a task, we need to unpublish it, and unpublish any trials with it.
  //any trials a user is in with this task should also be removed.
  if (req.currentUser.isAdmin != true) {
    res.redirect("401");
  }
  fs.readFile("./tasks.json", (err, data) => {
    //open the tasks file
    if (err) {
      console.log(err);
      res.json({ status: 500, error: "ERROR! Could not load tasks" });
    } else {
      fs.readFile("./trials.json", (err, trialData) => {
        //open the trials file.
        if (err) {
          console.log(err);
          res.json({ status: 500, error: "ERROR! Could not load trials" });
        } else {
          fs.readFile("./users.json", (err, userData) => {
            if (err) {
              console.log(err);
              res.json({ status: 500, error: "ERROR! Could Not load users. " });
            } else {
              var tasks = JSON.parse(data);
              var trials = JSON.parse(trialData);
              var users = JSON.parse(userData);

              //change the task to edit mode.
              tasks = tasks.map(function (el) {
                if (el.name.normalize() === req.body.name.normalize()) {
                  el.published = false;
                }
                return el;
              });

              //get a list of all trials that have this task.
              var trialsToUnassign = trials.filter(function (el) {
                if (el.task.normalize() === req.body.name.normalize()) {
                  //if this trial has is for this task, it needs to be unassigned from users.
                  return el.name; //return its name.
                }
              });

              //unpublish the trials associated with that task.
              trials = trials.map(function (el) {
                if (el.task.normalize() === req.body.name.normalize()) {
                  //if this trial has this task, unpublish the trial.
                  el.published = false;
                }
                return el;
              });

              //remove all appointsments for all users for trials associated with that task.
              users.forEach(function (user) {
                //for each user, if they have a trial that should be deleted
                //because it contains the task to delete, unassign them from the trial.
                trialsToUnassign.forEach(function (trial) {
                  user.trials = user.trials.filter(function (el) {
                    return el.name != trial;
                  });
                });
              });

              fs.writeFile("users.json", JSON.stringify(users), (err) => {
                if (err) {
                  console.log(error);
                  res.json({
                    status: 500,
                    error: "ERROR! Could not delete task",
                  });
                } else {
                  fs.writeFile("trials.json", JSON.stringify(trials), (err) => {
                    if (err) {
                      console.log(error);
                      res.json({
                        status: 500,
                        error: "ERROR! Could not delete task",
                      });
                    } else {
                      fs.writeFile(
                        "tasks.json",
                        JSON.stringify(tasks),
                        (err) => {
                          if (err) {
                            console.log(error);
                            res.json({
                              status: 500,
                              error: "ERROR! Could not delete task",
                            });
                          } else {
                            res.json({
                              status: 200,
                              message:
                                "Task Moved to Edit Mode.  All corresponding trials have been unpublished and users have been unassigned.",
                            });
                          }
                        }
                      );
                    }
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

exports.publishTaskTrial = (req, res) => {
  if (req.currentUser.isAdmin != true) {
    res.redirect("401");
  }
  var filename = "";
  if (req.body.type == "task") {
    filename = "tasks.json";
  } else {
    filename = "trials.json";
  }

  fs.readFile(filename, (err, data) => {
    if (err) {
      console.log(err);
      res.json({ status: 500, error: "ERROR! Could not publish task/trial." });
    } else {
      var ts = JSON.parse(data);
      var len = ts.length;

      for (var i = 0; i < len; i++) {
        if (ts[i].name.normalize() === req.body.name.normalize()) {
          //locate task/trial by name and change its "published" variable to true.
          ts[i].published = true;
          break;
        }
      }

      //write this change back to file.

      fs.writeFile(filename, JSON.stringify(ts), (err) => {
        if (err) {
          console.log(err);
          res.json({
            status: 500,
            error: "ERROR! Could not publish task/trial",
          });
        } else {
          res.json({
            status: 200,
            message: "Task/Trial successfully published.",
          });
        }
      });
    }
  });
};

exports.deleteTaskTrial = (req, res) => {
  if (req.currentUser.isAdmin != true) {
    res.redirect("401");
  }
  if (req.body.type == "task") {
    fs.readFile("tasks.json", (err, data) => {
      if (err) {
        console.log(err);
        res.json({ status: 500, error: "ERROR! Could not delete task/trial." });
      } else {
        //for deleting tasks, we need to delete the task from the tasks file,
        //then delete all trials from the trials folder with that task,
        //then unassign users from all trials with that task.

        fs.readFile("trials.json", (err, trialData) => {
          if (err) {
            console.log(err);
            res.json({
              status: 500,
              error: "ERROR! Could not delete task/trial.",
            });
          } else {
            fs.readFile("users.json", (err, userData) => {
              if (err) {
                console.log(err);
                res.json({
                  status: 500,
                  error: "ERROR! Could not delete task/trial.",
                });
              } else {
                var tasks = JSON.parse(data);
                var trials = JSON.parse(trialData);
                var users = JSON.parse(userData);

                tasks = tasks.filter(function (el) {
                  return el.name != req.body.name;
                });
                var trialsToUnassign = trials.filter(function (el) {
                  if (el.task.normalize() === req.body.name.normalize()) {
                    //if this trial has is for this task, it needs to be unassigned from users.
                    return el.name; //return its name.
                  }
                });

                users.forEach(function (user) {
                  //for each user, if they have a trial that should be deleted
                  //because it contains the task to delete, unassign them from the trial.
                  trialsToUnassign.forEach(function (trial) {
                    user.trials = user.trials.filter(function (el) {
                      return el.name != trial;
                    });
                  });
                });

                trials = trials.map(function (el) {
                  if (el.task.normalize() === req.body.name.normalize()) {
                    //if this trial has this task, unpublish the trial.
                    el.published = false;
                  }

                  return el;
                });

                try {
                  fs.writeFileSync("./users.json", JSON.stringify(users));
                  fs.writeFileSync("./trials.json", JSON.stringify(trials));
                  fs.writeFileSync("./tasks.json", JSON.stringify(tasks));
                } catch (err) {
                  console.log(err);
                  res.json({
                    status: 500,
                    error: "ERROR! Could not delete task/trial.",
                  });
                }

                res.json({ status: 200, message: "Task Deleted." });
              }
            });
          }
        });
      }
    });
  } else {
    fs.readFile("trials.json", (err, data) => {
      if (err) {
        console.log(err);
        res.json({ status: 500, error: "ERROR! Could not delete task/trial." });
      } else {
        //for deleting trials, we need to delete the trial from trials.json, then
        //unassign this trial from all users.

        //open the users file.
        fs.readFile("./users.json", (err, userData) => {
          if (err) {
            console.log(err);
            res.json({
              status: 500,
              error: "ERROR! Could not delete task/trial.",
            });
          } else {
            var trials = JSON.parse(data);
            var users = JSON.parse(userData);

            trials = trials.filter(function (el) {
              return el.name != req.body.name;
            });
            users.forEach(function (user) {
              user.trials = user.trials.filter(function (el) {
                return el.name != req.body.name;
              });
            });

            try {
              fs.writeFileSync("./trials.json", JSON.stringify(trials));
              fs.writeFileSync("./users.json", JSON.stringify(users));
            } catch (error) {
              console.log(err);
              res.json({
                status: 500,
                error: "ERROR! Could not delete task/trial.",
              });
            }
            res.json({ status: 200, message: "Trial Deleted." });
          }
        });
      }
    });
  }
};
