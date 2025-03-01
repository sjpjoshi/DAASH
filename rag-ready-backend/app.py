import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import openai
from flask import Flask, request, jsonify
from flask_cors import CORS
import json

# Initialize Flask app and CORS
app = Flask(__name__)
CORS(app)

openai.api_key = ''

# List of trusted domain extensions
TRUSTED_EXTENSIONS = ['.gov', '.org']

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
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract the main text content 
        paragraphs = soup.find_all('p')
        text = ' '.join([para.get_text() for para in paragraphs])

        return text
    except Exception as e:
        return f"Error extracting text: {e}"

# Function to interact with GPT and analyze the webpage content
def analyze_webpage_with_gpt(text):
    try:
        prompt = f"Please evaluate the following webpage content for factual accuracy, potential biases, and trustworthiness: {text}"
        
         # Send prompt to OpenAI's GPT
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # or another GPT model
            messages=[{"role": "system", "content": "You are a helpful assistant."},
                      {"role": "user", "content": prompt}]
        )
        
        return response.choices[0].text.strip()  # Return GPT's analysis
    except Exception as e:
        return f"Error communicating with GPT: {e}"

@app.route("/api/query", methods=["POST"])
def query_rag():
    try:
        data = request.json
        url = data.get("url")

        #Check if the webpage is from a trusted source
        trust_status = is_trusted_source(url)

        #If trusted, extract the text and analyze it with GPT
        if trust_status == "Trusted":
            webpage_text = extract_text_from_webpage(url)

            if "Error" in webpage_text:
                return jsonify({"error": webpage_text}), 500

            # Send the extracted text to GPT for analysis
            analysis = analyze_webpage_with_gpt(webpage_text)

            # Return the analysis result along with the trust status
            response = {
                "output": {
                    "Analysis": trust_status,
                    "GPT_Analysis": analysis
                }
            }

        else:
            # If the source is not trusted, just return that it's untrusted
            response = {
                "output": {
                    "Analysis": trust_status
                }
            }

        # Step 5: Save the response to a JSON file
        with open('output.json', 'w') as json_file:
            json.dump(response, json_file, indent=4)

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"})
