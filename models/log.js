const mongoose = require("mongoose");

const agentSchema = new mongoose.Schema({
  type: String,
  id: String,
  timestamps: [{ timer: String, sceneTimer: String }],
  teleporterID: String,
  toolID: String,
  action: [
    {
      actionType: String,
      teleporterID: String,
      objectID: String,
      position: [{ x: Number, y: Number, z: Number }],
    },
  ],
});

const objectSchema = new mongoose.Schema({
  type: String,
  id: String,
  position: [{ x: Number, y: Number, z: Number }],
  timestamps: [{ timer: String, sceneTimer: String }],
  state: String,
  collisionCount: Number,
  agentID: String,
});

const teleporterSchema = new mongoose.Schema({
  type: String,
  id: String,
  position: [{ x: Number, y: Number, z: Number }],
  timestamps: [{ timer: String, sceneTimer: String }],
  state: String,
  collisionCount: Number,
  agentID: String,
});

// FIXME the agent and object schema might need to be validated on the
// controller level. This isn't working right now.
const logSchema = new mongoose.Schema({
  name: String,
  //   entries: [agentSchema | objectSchema],
  entries: [Object],
  modified: Date,
});

const logAgentSchema = new mongoose.Schema({ agent: [agentSchema] });
const logObjectSchema = new mongoose.Schema({ object: [objectSchema] });
const logTeleporterSchema = new mongoose.Schema({
  teleporter: [teleporterSchema],
});

const isAgent = (doc) => {
  return doc?.type === "agent";
};
const isObject = (doc) => {
  return doc?.type === "object";
};
const isTeleporter = (doc) => {
  return doc?.type === "teleporter";
};

const logModel = (module.exports = mongoose.model("Log", logSchema));
const logAgent = logModel.discriminator("logAgent", logAgentSchema);
const logObject = logModel.discriminator("logObject", logObjectSchema);
const logTeleporter = logModel.discriminator(
  "logTeleporter",
  logTeleporterSchema
);

// Model functions

module.exports.getLogByName = (name, callback) => {
  logModel.findOne({ name }, callback);
};

module.exports.createLog = (name, callback) => {
  const log = new logModel({
    name,
    modified: new Date(),
    entries: [],
  });
  log.save(callback);
};

module.exports.deleteLog = (name, callback) => {
  logModel.deleteOne({ name }, callback);
};

module.exports.addLogEntry = (name, newEntry, callback) => {
  logModel.findOneAndUpdate(
    { name },
    { $push: { entries: newEntry }, modified: new Date() },
    { useFindAndModify: false },
    callback
  );
};

module.exports.getIdsByType = async (name, type, callback) => {
  try {
    const { entries } = await logModel.findOne({ name });
    callback(null, [
      ...new Set(entries.filter((e) => e.type === type).map((e) => e.id)),
    ]);
  } catch (err) {
    if (err instanceof TypeError) {
      callback();
    } else {
      callback(err);
    }
  }
};

module.exports.getAgentIds = async (name, callback) => {
  try {
    const { entries } = await logModel.findOne({ name });
    agents = [
      ...new Set(
        entries
          .filter((e) => {
            return e.type === "agent" && !e.id.includes("Bot");
          })
          .map((e) => e.id)
      ),
    ];
    callback(null, agents);
  } catch (err) {
    if (err instanceof TypeError) {
      callback();
    } else {
      callback(err);
    }
  }
};

module.exports.filterLog = async (name, filters, callback) => {
  try {
    const { entries } = await logModel.findOne({ name });
    const filterKeys = Object.keys(filters);
    let limit = filters?.limit;
    // use limit and remove it from the filters if defined
    // -1 is the oldest log and 1 is the newest log
    if (limit) {
      delete filters.limit;
    } else {
      limit = 1;
    }
    const filtered = entries
      .filter((entry) => {
        return filterKeys.every((key) => filters[key] === entry[key]);
      })
      .reverse();
    // make the response an array if more than 1 entry was requested
    if (limit == -1) {
      callback(null, filtered.slice(limit)[0]);
    } else if (limit == 1) {
      callback(null, filtered.slice(0, limit)[0]);
    } else {
      callback(null, filtered.slice(0, Math.abs(limit)));
    }
  } catch (err) {
      callback(err);
  }
};

module.exports.getRecentLogName = (callback) => {
  logModel.findOne({}, "name modified", { sort: { modified: -1 } }, callback);
};