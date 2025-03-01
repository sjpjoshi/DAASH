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
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load environment variables
dotenv.load_dotenv()

# Initialize Flask app and CORS
app = Flask(__name__)
CORS(app)

# Set the OpenAI API key from environment variables
openai.api_key = os.getenv("")

# Database connection string from environment
DATABASE_URL = os.getenv("")

# Function to establish database connection
def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

# Function to interact with GPT and analyze the webpage content
def analyze_webpage_with_gpt(text):
    try:
        if not text or len(text) < 100:  # Check if the extracted text is too short
            return "Error: The extracted text is too short for analysis."

        prompt = f"Please evaluate the following webpage content for factual accuracy, potential biases, and trustworthiness: {text[:4000]}"  # Trim the text if it's too long
    
        # Send prompt to OpenAI's GPT
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # or another GPT model
            messages=[{"role": "system", "content": "You are a citation evaluator."},
                      {"role": "user", "content": prompt}]
        )
        
        return response.choices[0].message['content'].strip()  # Return GPT's analysis
    except Exception as e:
        return f"Error communicating with GPT: {e}"
    
# Function to extract text from a webpage
def extract_text_from_webpage(url):
    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.text, "html.parser")
        
        for element in soup.select('nav, footer, header, aside, script, style'):
            element.decompose()
        
        main_content = soup.select_one('main, article, [role="main"], .content, #content')
        content = main_content if main_content else soup.body
        text_elements = content.select("p, h1, h2, h3, h4, h5, h6, li, blockquote")
        text = " ".join([elem.get_text().strip() for elem in text_elements if elem.get_text().strip()])
        text = re.sub(r"\s+", " ", text).strip()
        return text
    except Exception as e:
        return f"Error extracting text: {e}"

# Function to retrieve verified documents from the database
def get_verified_documents():
    conn = get_db_connection()
    if conn is None:
        return []
    
    cursor = conn.cursor()
    cursor.execute('SELECT common_query, content FROM content')
    documents = [row[1] for row in cursor.fetchall()]  # Retrieve only the content for similarity check
    cursor.close()
    conn.close()
    return documents

# Function to compute similarity between a webpage and verified documents
def compute_similarity(webpage_text, verified_docs, threshold=0.7, k=5):
    vectorizer = TfidfVectorizer()
    all_texts = [webpage_text] + verified_docs
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    similarities = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
    
    top_k_indices = similarities.argsort()[-k:][::-1]
    top_k_similarities = [(verified_docs[i], similarities[i]) for i in top_k_indices]
    
    max_similarity = max(similarities) if similarities.size > 0 else 0
    return max_similarity, top_k_similarities

@app.route("/api/query", methods=["POST"])
def query_rag():
    try:
        data = request.json
        url = data.get("url")
        
        # Step 1: Extract and analyze webpage content with GPT
        webpage_text = extract_text_from_webpage(url)
        if "Error" in webpage_text:
            return jsonify({"error": webpage_text}), 500
        
        gpt_analysis = analyze_webpage_with_gpt(webpage_text)
        if "Error" in gpt_analysis:
            return jsonify({"error": gpt_analysis}), 500
        
        # Step 2: Retrieve verified documents and perform similarity check
        verified_docs = get_verified_documents()
        max_similarity, top_matches = compute_similarity(webpage_text, verified_docs)
        
        if max_similarity >= 0.7:  # Document passes similarity check
            # Step 3: Check if it aligns with verified documents using LLM
            if gpt_analysis.lower().find("trustworthy") != -1:
                response = {"output": {"Analysis": "Trusted", "Matches": top_matches}}
            else:
                response = {"output": {"Analysis": "Untrusted", "Matches": top_matches}}
        else:
            response = {"output": {"Analysis": "Untrusted", "Matches": top_matches}}
        
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"})
