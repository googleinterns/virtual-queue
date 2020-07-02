from flask import Flask, jsonify, request
import requests
import re

app = Flask(__name__)
app.config.from_object('config.Config')


MAPS_SEARCH_URL = app.config["MAPS_SEARCH_URL"]
MAPS_DISTANCE_URL = app.config["MAPS_DISTANCE_URL"]


@app.route("/textsearch", methods=['GET'])
def textsearchResults():
    parameters = request.args
    nearWords = ["near", "nearby", "in"]
    searchWords = re.findall(r'\w+', parameters["query"]) 

    for word in nearWords:
        if word in searchWords:
            parameters = {
                "query": " ".join(searchWords),
                "key": parameters["key"]
            }
    search_req = requests.get(MAPS_SEARCH_URL, params=parameters)
    print(search_req)
    response = jsonify(search_req.json())
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route("/distancematrix", methods=['GET'])
def distancematrixResults():
    parameters = request.args
    distance_req = requests.get(MAPS_DISTANCE_URL, params=parameters)
    response = jsonify(distance_req.json())
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


if __name__ == "__main__":
    app.run(host='localhost', port=5000)
