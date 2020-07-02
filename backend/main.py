from flask import Flask, jsonify, request
import requests
import re

app = Flask(__name__)
# Obtain configuration settings from Config file
app.config.from_object('config.Config')

MAPS_SEARCH_URL = app.config["MAPS_SEARCH_URL"]
MAPS_DISTANCE_URL = app.config["MAPS_DISTANCE_URL"]

# Requests Places search Textsearch API to obtain list of nearby stores
@app.route("/textsearch", methods=['GET'])
def textsearchResults():
    parameters = request.args
    nearWords = ["near", "nearby", "in"]
    # Parses the string to eliminate non alphanumeric characters and obtain the words
    searchWords = re.findall(r'\w+', parameters["query"]) 

    for word in nearWords:
        # Checks if near type keywords are present in search query 
        if word in searchWords:
            # If keyword exists, location bias is removed
            parameters = {
                "query": " ".join(searchWords),
                "key": parameters["key"]
            }
    search_req = requests.get(MAPS_SEARCH_URL, params=parameters)
    response = jsonify(search_req.json())
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

# Requests Maps Distance Matrix URL with parameters obtained from frontend
@app.route("/distancematrix", methods=['GET'])
def distancematrixResults():
    parameters = request.args
    distance_req = requests.get(MAPS_DISTANCE_URL, params=parameters)
    response = jsonify(distance_req.json())
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

# Runs the app at port 5000
if __name__ == "__main__":
    app.run(host='localhost', port=5000)
