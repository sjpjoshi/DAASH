from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/api/query", methods=["POST"])
def query_rag():
    try:
        data = request.json
        query = data.get("query")

        # TODO: Implement logic here

        response = {"answer": "Sample response", "sources": []}

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"})


# Remove the if __name__ == '__main__' block since Vercel handles the execution
# if __name__ == '__main__':
#     app.run(debug=True, host='0.0.0.0', port=5000)
