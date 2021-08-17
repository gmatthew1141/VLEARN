const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const pug = require('pug')
const path = require('path')
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const fs = require("fs"); 
const boom = require("@hapi/boom")
const auth = require('./middleware/auth.js'); 
const adminOnly = require("./middleware/adminOnly.js"); 
const task = require('./middleware/task.js'); 
const trial = require('./middleware/trial.js'); 
const saltRounds = 10; 

const taskController = require("./controllers/task");
const trialController = require("./controllers/trial");
const adminController = require("./controllers/admin");
const unityController = require("./controllers/unity");
const botController = require("./controllers/botController");
const loggerController = require("./controllers/logController");

require('dotenv').config();
require('body-parser-xml')(bodyParser); 
app.set('view engine', 'pug');
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(__dirname + "/views"));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.xml());

const mongoose = require("mongoose");

let databaseName = process.env.NODE_ENV === "production" ? "prod" : "dev";

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@vlearn-0.cfzd9.mongodb.net/${databaseName}?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((error) => console.log("Database connection error occurred", error)); 

const customLogger = require("./middleware/customLogger");
app.use(customLogger.requestLogger);

// =====
// tasks
// =====
//loads the tasks for the test subjects.
app.get("/tasks/:name?", auth, taskController.getTaskByName);
app.get("/tasks/edit/:name?", auth, taskController.getTaskEditor);
app.post("/saveTask", auth, taskController.saveTask);
app.post("/editTask", auth, taskController.editTask); 

// FIXME these should be a route for the task and the trial separately
app.post('/deleteTaskTrial', auth, taskController.deleteTaskTrial); 
//publish a task or trial.  This allows tasks to be assigned to trials and trials to be 
//assigned to users. 
app.post("/publishTaskTrial", auth, taskController.publishTaskTrial); 

// ======
// trials
// ======
app.get("/trials/edit/:trial_name?", auth, trialController.getTrialEditor);
app.get("/createTrial", auth, trialController.getTrialCreator);
app.get("/trialRepo", auth, trialController.getTrialRepo);
app.get("/trials/:trialName?", auth, trialController.getTestSubjectTrial);
app.post("/saveTrial", auth, trialController.saveTrial); 
app.post("/editTrial", auth, trialController.editTrial); 

// =====
// admin
// =====
app.get("/createAccount", auth, adminController.getCreateAccount);
app.get("/assignTStoTrial/:trial_name?", auth, adminController.getAssignTestSubject);
app.get('/adminTSView/:subject_id?', auth, adminController.getTestSubjectView);
app.get("/fileBrowser", auth, adminOnly, adminController.getFileBrowser); 
app.get('/fileBrowser/download/files=:files?', auth, adminOnly, adminController.getDownloadFile);
app.post("/fileBrowser/delete", auth, adminOnly, adminController.deleteFileBrowser);
app.post('/editUser', auth, adminController.editUser); 
app.post('/deleteUser', auth, adminController.deleteUser); 
app.post("/assignToTrial", auth, adminController.assignSubjectTestTrial); 
app.post('/removeFromTrial', auth, adminController.removeSubjectFromTrial);
app.post("/saveMeetingInfo", auth, adminController.saveMeetingInfo);

// =====
// unity
// =====
app.get("/task-params", auth, trial, unityController.getTaskParams);
app.get("/get-xml", auth, task, unityController.getXML);   
app.post("/log-endpoint", auth, task, unityController.postOneLog);
app.post("/store-xml", auth, task, unityController.postXML);

// =====
// bot
// =====
app.get("/api/trial/:trialName", auth, adminOnly, botController.getEntriesByName);
app.post("/api/trial/:trialName", auth, adminOnly, botController.sendActionToBot);
app.get("/api/trial/:trialName/objects", auth, adminOnly, botController.getObjectIds);
app.get("/api/trial/:trialName/objects/:id", auth, adminOnly, botController.getObjectById);
app.get("/api/trial/:trialName/agents", auth, adminOnly, botController.getAgentIds);
app.get("/api/trial/:trialName/agents/:id", auth, adminOnly, botController.getAgentById);
app.get("/api/trial/:trialName/teleporters", auth, adminOnly, botController.getTeleporterIds);
app.get("/api/trial/:trialName/teleporters/:id", auth, adminOnly, botController.getTeleporterById);
app.get("/api/trial", auth, adminOnly, botController.getRecentTrial);

// ======
// logger
// ======

app.get("/logger/:trialName", auth, adminOnly, loggerController.getLogByTrial);
app.post("/logger/:trialName", auth, adminOnly, loggerController.createLog);
app.put("/logger/:trialName", auth, loggerController.updateLogEntry);

app.get('/login', (req, res) => {
	var blurb = ''; 
	fs.readFile('./blurb.txt', (err, data) => {
		if(err) {
			console.log('ERROR! Could not read blurb.txt'); 
			console.log(err); 
			
		} else {
			blurb = data; 
			
		}
		
		res.render('login', {blurb: blurb}); 
	}); 
	
}); 

app.get('/', auth, (req, res) => {
	res.redirect('home')
}); 

app.get('/home', auth, (req,res) => {
	if(req.currentUser.isAdmin == true) {
		//get the test subject ids and pass them to adminHome. 
		fs.readFile('users.json', (err, data) => {
			if(err) {
				console.log(err); 
				res.json({status: 500, error: "ERROR! Could not Get Test Subjects"}); 
				
			} else {
				var users = JSON.parse(data); 
				var subjects = [];
				var len = users.length; 
				for(var i = 0; i < len; i++){
					if(users[i].isAdmin == false){
						//test subjects are not admins. 
						var newSubject = {}; 
						newSubject.id = users[i].subject_id; 
						
						//find the most upcoming appointment. 
						var next = Infinity;
						var idx = -1; 
						for(var j = 0; j < users[i].trials.length; j++){
							var d = users[i].trials[j].date + " " + users[i].trials[j].time; 
							d = Date.parse(d); 
							//console.log(d);
							if(d < next){
								next = d; 
								idx = j; 
							}
						}
						if(idx != -1){
							newSubject.trial = {};
							newSubject.trial.name = users[i].trials[idx].name; 
							newSubject.trial.date = users[i].trials[idx].date;
							newSubject.trial.time = users[i].trials[idx].time;
							newSubject.trial.meeting_id = users[i].trials[idx].meeting_id; 
							
						} else {
							newSubject.trial = {}; 
							newSubject.trial.name = ""; 
							newSubject.trial.date = "NO APPOINTMENT"; 
							newSubject.trial.time = ""; 
							newSubject.trial.meeting_id = ""; 
						}
						
						
						subjects.push(newSubject);
						
						
						
					}
					
				}
				
				subjects.sort(function(a,b) { return  Date.parse(a.date + " " + a.time) - Date.parse(b.date + " " + b.time) } );
				res.render('adminHome', {subjects: subjects}); 

			}
		}); 			
	} else { 
		var subject = {};
		subject.id = req.currentUser.subject_id; 
		subject.trials = req.currentUser.trials;
		
		res.render('tsHome', {subject: subject}); 
	
	}
}); 

//used when test subject users try to access pages that require admin status. 
app.get('/401', auth, (req, res) => {
	res.render('401');
});

app.post("/register", auth, (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    if (err) {
      console.log(err);
      res.json({ status: 500, error: "Error! Could Not Create User!" });
    } else {
      fs.readFile("users.json", (err, data) => {
        if (err) {
          console.log(err);
          res.json({ status: 500, error: "Error! Could Not Create User!" });
        } else {
          var users = JSON.parse(data);
          //first check whether or not this user already exists.

          var len = users.length;
          for (var i = 0; i < len; i++) {
            if (
              users[i].username.normalize() === req.body.username.normalize() ||
              users[i].subject_id == req.body.subject_id
            ) {
              //bad we found this user already.
              res.json({ status: 401, error: "Error! User Already Exists!" });
              return;
            }
          }

          var newUser = {
            username: req.body.username,
            subject_id: req.body.subject_id,
            password: hash,
            isAdmin: false,
            trials: [],
            notes: req.body.notes,
            taskLogs: [],
          };

          users.push(newUser);
          fs.writeFile("users.json", JSON.stringify(users), (err) => {
            if (err) {
              console.log(err);
              res.json({ status: 500, error: "Error! Could not Create User!" });
            } else {
              res.json({
                status: 201,
                message:
                  "User Successfully Created! Please send them an email with their login credentials.",
              });
            }
          });
        }
      });
    }
  });
});

app.post('/authenticate', (req, res, next) =>  {
	//find the user based on userName. 
	
	fs.readFile('./users.json', (err, data) => {
		if(err) {
			next(boom.boomify(err))
			return;
		} else { 
			//find the user in the users json. 
			var users = JSON.parse(data);
			//first check whether or not this user already exists. 
			
			var len = users.length; 
			var user = null; 
			for(var i = 0; i < len; i++){
				if(users[i].username.normalize() === req.body.username.normalize()){
					user = users[i]; 
					break; 
				}
			}
			
			if(user == null){
				next(boom.unauthorized("Authentication failed."))
				return;
			} else { 
				bcrypt.compare(req.body.password, user.password, (err, result) => {
					if(err){
						next(boom.boomify(err))
						return; 
					} else if(!result){ 
						next(boom.unauthorized("Authentication failed."))
						return;
					} else {
						//if the passwords match, then we need to issue a JWT.  
						var jwtToken = jwt.sign(
							{
								username: user.username,
								
							}, 
							process.env.JWT_KEY,
							{
								expiresIn: "6h"
							}
						);
					
						
						var userData = {
							username: user.username, 
							isAdmin: user.isAdmin,
						}
						
						//send back the token, expiration, and user data. 
						res.json({
							statusCode: 200,
							token: jwtToken, 
							expiresIn: 21600, 
							data: userData
						});
					}
				}); 
			}
		}
	}); 
	
});  

app.get("/advertisementPlan", (req, res) => {
  res.render("advertisementPlan");
}); 

app.get("/hello", auth, (req, res) => {
  res.json({
    statusCode: 200,
    message: `Hello, ${req.currentUser.username}!`,
  });
});

// catch boom errors and make their output nice
// needs to be after everything that uses it
app.use((err, req, res, next) => {
  if (err.isBoom) {
    return res.status(err.output.statusCode).json(err.output.payload);
  }
  next();
});

module.exports = app;