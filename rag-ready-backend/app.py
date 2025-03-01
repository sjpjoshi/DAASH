from flask import Flask, request, jsonify
from flask_cors import CORS
import requests 

app = Flask(__name__)
CORS(app)

# Placeholder bot function
def verify_webpage(url):
    response = requests.get(url) 
    if response.status_code == 200:
        return {"trusted": True, "score": 95}  
    else:
        return {"trusted": False, "score": 0}

@app.route("/api/query", methods=["POST"])
def query_rag():
    try:
        data = request.json
        query = data.get("query")
        verification_result = verify_webpage(query)
        response = {
            "answer": "Sample response",
            "sources": [
                {"url": query, "trusted": verification_result["trusted"], "score": verification_result["score"]}
            ]
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"})
