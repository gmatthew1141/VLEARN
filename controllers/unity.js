// routes to be called by unity
const xml2js = require("xml2js");
const fs = require("fs");
const path = require("path");

// GET Requests
exports.getTaskParams = (req, res) => {
  var trialName = req.trial;
  fs.readFile("trials.json", (err, data) => {
    if (err) {
      console.log(err);
      res.json({ status: 500, error: "ERROR: COULD NOT GET XML" });
    } else {
      var trials = JSON.parse(data);
      trials.forEach(function (trial) {
        //look for the trial that the user accessed most recently,
        //and load those parameters.
        if (trial.name.normalize() === trialName.normalize()) {
          //this is the trial we're trying to load parameters for.
          var builder = new xml2js.Builder();
          var toSend = {
            Params: {
              $: {
                "xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
                "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance%22%3E",
              },
              numBumps: trial.params.numBumps || 3,
              trashSize: trial.params.trashSize || 1,
              pipe1: trial.params.pipe1 || true,
              pipe2: trial.params.pipe2 || true,
              pipe3: trial.params.pipe3 || true,
              pipe4: trial.params.pipe4 || true,
            },
          };
          var xml = builder.buildObject(toSend);
          console.log("task-params toSend", xml);
          res.send(xml);
        }
      });
    }
  });
};

exports.getXML = (req, res) => {
  var taskName = req.task;
  fs.readFile("tasks.json", (err, data) => {
    if (err) {
      console.log(err);
      res.json({ status: 500, error: "ERROR: COULD NOT GET XML" });
    } else {
      var tasks = JSON.parse(data);
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].name.normalize() === taskName.normalize()) {
          console.log(path.join(__dirname, "xmls", tasks[i].xml));
          res.sendFile(path.join(__dirname, "xmls", tasks[i].xml));
        }
      }
    }
  });
};

// POST Requests
exports.postXML = (req, res) => {
  var builder = new xml2js.Builder();
  var xml = builder.buildObject(req.body);
  console.log(req.body);
  //write an xml file for the task and then tell the tasks.json that
  //this is what the xml is called for that task.

  fs.readFile("tasks.json", (err, data) => {
    if (err) {
      console.log(err);
      res.json({ status: 500, error: "ERROR! Could not write to XML File!" });
    } else {
      var tasks = JSON.parse(data);

      tasks = tasks.map(function (task) {
        if (task.name.normalize() == req.task.normalize()) {
          //if this task is the one that we are currently editing,
          //then we need to change its xml filename to this new xml.
          if (task.xml != "default.xml") {
            //delete the old xml file first, and then go on to write a new one.
            //don't want xmls to pile up on the vm.
            try {
              fs.unlinkSync(path.join(__dirname, "xmls", task.xml));
            } catch (err) {
              console.log(err);
            }
          }

          task.xml = req.body.ItemDatabase._ + ".xml";
        }

        return task;
      });

      fs.writeFile("tasks.json", JSON.stringify(tasks), (err) => {
        if (err) {
          console.log(err);
          res.json({
            status: 500,
            error: "ERROR! Could not write to XML File!",
          });
        } else {
          fs.writeFile(
            "./xmls/" + req.body.ItemDatabase._ + ".xml",
            xml,
            (err) => {
              if (err) {
                console.log(err);
                res.json({
                  status: 500,
                  error: "ERROR! Could not write to XML File!",
                });
              } else {
                res.json({
                  status: 200,
                  message: "Wrote Successfully to XML File!",
                });
              }
            }
          );
        }
      });
    }
  });
};

// Deprecated. Using routes in logController.js
exports.postOneLog = (req, res) => {
  if (req.currentUser.isAdmin) {
    // TODO we do want data for admins
    //don't store any data for admins, just send a 200 response.
    res.status(200).send("No Data Logged For Admin.");
  } else {
    var tmstmp = parseInt(req.timestamp);
    var date = new Date(tmstmp);
    var str = date.toISOString();
    console.log(date);
    str = str.split(".")[0];
    console.log(str);
    var filename =
      "subject" +
      req.currentUser.subject_id +
      "-" +
      req.task +
      "-" +
      str +
      ".txt";
    fs.appendFile("./logs/" + filename, req.body.data + "\n", (err) => {
      if (err) {
        console.log(err);
        res.json({ status: 500, error: "ERROR! Could not write to log file." });
      } else {
        fs.readFile("./users.json", (err, data) => {
          if (err) {
          } else {
            //after writing this log to file, we need to mark it as a log file for this user for use
            //in the file browser.  can do this by editing the trial in their user.trials array.
            var users = JSON.parse(data);
            var len = users.length;

            for (var i = 0; i < len; i++) {
              if (users[i].subject_id == req.currentUser.subject_id) {
                //this is the subject whose log file this is.
                //we should add this to the subject.
                if (!users[i].taskLogs.includes(filename)) {
                  users[i].taskLogs.push(filename);
                }
              }
            }

            fs.writeFile("./users.json", JSON.stringify(users), (err) => {
              if (err) {
                console.log(err);
                res.json({
                  status: 500,
                  error: "ERROR! Could not write to log file.",
                });
              } else {
                res.json({ status: 200, message: "Wrote To Log!" });
              }
            });
          }
        });
      }
    });
  }
};
