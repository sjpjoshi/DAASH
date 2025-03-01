import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import openai
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import re
import dotenv
import os
import psycopg2

# Load environment variables
dotenv.load_dotenv()

# Initialize Flask app and CORS
app = Flask(__name__)
CORS(app)

# Set the OpenAI API key from environment variables
openai.api_key = os.getenv("")

# Database connection string from environment
DATABASE_URL = os.getenv("")

# List of trusted domain extensions
TRUSTED_EXTENSIONS = [".gov", ".org"]

def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

@app.route('/get_data', methods=['GET'])
def get_data():
    try:
        # Establish connection to the database
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Unable to connect to the database"}), 500

        cursor = conn.cursor()
        
        # Sample query to retrieve all rows from a table
        cursor.execute('SELECT * FROM verification_table')
        rows = cursor.fetchall()
        
        # Convert rows to a list of dictionaries
        data = []
        for row in rows:
            data.append({"column1": row[0], "column2": row[1], "column3": row[2]})
        
        cursor.close()
        conn.close()
        
        return jsonify(data)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Function to check if a webpage is from a trusted source based on its domain
def is_trusted_source(url):
    try:
        # Parse the URL to extract the domain
        parsed_url = urlparse(url)
        domain = parsed_url.netloc
        # Check if the domain ends with a trusted extension
        if any(domain.endswith(ext) for ext in TRUSTED_EXTENSIONS):
            return "Trusted"
        else:
            return "Untrusted"
    except Exception as e:
        return f"Error checking source: {e}"

# Function to extract text from a webpage
def extract_text_from_webpage(url):
    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.text, "html.parser")

        # Remove common non-content elements like ads, navigation, scripts, etc.
        for element in soup.select(
            'nav, footer, header, aside, .ads, .advertisement, script, style, [class*="banner"], [class*="menu"], [id*="menu"], [class*="nav"], [id*="nav"]'
        ):
            element.decompose()

        # Look for main content containers first (such as <main>, <article>, etc.)
        main_content = soup.select_one(
            'main, article, [role="main"], .main-content, #main-content, .content, #content'
        )

        if main_content:
            # Extract from identified main content if found
            content = main_content
        else:
            # Fallback to the whole body if no main content container is found
            content = soup.body

        # Get text from semantic elements in the content area (e.g., paragraphs, headers, lists, etc.)
        text_elements = content.select(
            "p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, table, dl"
        )

        # Join the text with appropriate spacing and ensure no empty text nodes are included
        text = " ".join(
            [
                elem.get_text().strip()
                for elem in text_elements
                if elem.get_text().strip()
            ]
        )

        # Clean up excessive whitespace
        text = re.sub(r"\s+", " ", text).strip()

        return text
    except Exception as e:
        return f"Error extracting text: {e}"

@app.route("/api/query", methods=["POST"])
def query_rag():
    try:
        data = request.json
        url = data.get("url")

        # Check if the webpage is from a trusted source
        trust_status = is_trusted_source(url)

        # If trusted, extract the text and analyze it with GPT
        if trust_status == "Trusted":
            webpage_text = extract_text_from_webpage(url)

            if "Error" in webpage_text:
                return jsonify({"error": webpage_text}), 500

            # Return the analysis result along with the trust status
            response = {
                "output": {
                    "Analysis": trust_status
                }
            }

        else:
            # If the source is not trusted, just return that it's untrusted
            response = {"output": {"Analysis": trust_status}}

        # Step 5: Save the response to a JSON file
        with open("output.json", "w") as json_file:
            json.dump(response, json_file, indent=4)

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    app.run(debug=True)
