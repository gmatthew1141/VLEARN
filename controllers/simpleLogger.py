# import argparse
import json

# parser = argparse.ArgumentParser()
# parser.add_argument('--logFile', required=True, help='Full Log File')
# args = parser.parse_args()

file = json.load(open(args.logFile))

time = []
actions = []
states = []
alphabet = []
empty_action = {
                    "actionID": "",
                    "teleporterID": "",
                    "objectID": "",
                    "position" : {"x" : 0, "y" : 0, "z" : 0}
                }
            

def get_action(teleporter, object):
    return object if object != "" else teleporter

def get_alphabet(agent, action, object):
    return agent[0].upper() + action[0].upper() + object[0].upper() + object[-1].upper()

for event in file:
    if "agentID" in event and event["agentID"] == "":
        continue

    if "action" in event and event["action"] == empty_action:
        continue

    if "action" in event:
        actions.append("{} {} {}".format( event["id"], event["action"]["actionID"], get_action(event["action"]["objectID"], event["action"]["teleporterID"])))
        alphabet.append(get_alphabet(event["id"], event["action"]["actionID"], get_action(event["action"]["objectID"], event["action"]["teleporterID"])))
        time.append(event["timestamps"]["sceneTimer"])

    if "state" in event:
        states.append("{} {} {}".format(event["agentID"], event["id"], event["state"]))

jsonData = []

for t, al, ac, s in zip(time, alphabet, actions, states):
    d = {"Time" : t, "Alphabet" : al, "Action" : ac, "State" : s}
    jsonData.append(d)


with open('temp.json', 'w') as f:
    json.dump(jsonData, f)