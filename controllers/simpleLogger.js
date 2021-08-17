const fs = require("fs");
const path = require("path");
const logModel = require("../models/log");
const zip = new require("node-zip")();
const { Parser } = require('json2csv');

const getAction = (teleporter, object) => object != "" ? object : teleporter

const getAlphabet = (agent, action, object) => agent[0].toUpperCase() + action[0].toUpperCase() + object[0].toUpperCase() + object.slice(-1).toUpperCase()

const jsonToCSV = (logInput) => {   
    const fields = ['type', 'id', 'timestamps.sceneTimer'];   // define the columns here
    const opts = { fields };

    try {
      const parser = new Parser(opts);
      const csv = parser.parse(logInput);
      console.log(csv);
      return csv
    } catch (err) {
      console.error(err);
    }
}

const emptyAction = {
    actionID: "",
    teleporterID: "",
    objectID: "",
    position : {x : 0, y : 0, z : 0}
}

const simpleLogger = (files) => {
    return logModel.find({  name: { $in: files }  }, (err, logs) => {
        const data = logs.map((log) => {
            const entries = log.entries
            if (entries.agentID && entries?.action?.actionID) {   
                const temp = {
                    "Time": "", 
                    "Alphabet": "", 
                    "Action": "", 
                    "State": ""
                }
                    
                if (entries.action) {
                    temp.Actions = `${entries.id} ${entries?.action?.actionID} ${getAction(entries?.action?.objectID)} ${entries?.action?.teleporterID}`
    
                    temp.Alphabet = getAlphabet(entries.id, entries.action.actionID, getAction(entries.action.objectID, entries.action.teleporterID))
                    
                    temp.Time = entries.timestamps.sceneTimer
                }

                if (entries.state) {
                    temp.states = `${entries.agentID} ${entries.id} ${entries.state}`
                }
                return temp
            }
        });
        
        zip.file(log.name + ".json", JSON.stringify(log.entries));
        zip.file(log.name + ".csv", jsonToCSV(data));
        
        const zippedLogs = zip.generate({ base64: false, compression: "DEFLATE" });
        fs.writeFileSync(path.join(__dirname, "logFiles.zip"), zippedLogs, "binary");

        res.download(path.join(__dirname, "logFiles.zip"), (err) => {
        if (err) {
            console.log(err);
        } else {
            //delete the zip file.
            fs.unlinkSync(path.join(__dirname, "logFiles.zip"));
        }
        });
    })
}

module.exports = simpleLogger