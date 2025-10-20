from flask import Flask, send_from_directory, jsonify
import os
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)

# Database connection configuration
def get_db_connection():
    """Create and return a database connection"""
    # Check if we have db_host from environment (Cloud Run with private IP)
    db_host = os.environ.get('db_host')
    
    if db_host:
        # Connect via private IP in Cloud Run VPC
        # Use postgres user/password for sarbuddy database
        conn = psycopg2.connect(
            user='postgres',
            password='pet123',
            database='sarbuddy',
            host=db_host,
            port=5432
        )
    else:
        # Fallback to DATABASE_URL for local development
        database_url = os.environ.get('DATABASE_URL', 'postgresql://postgres:pet123@34.69.23.190:5432/sarbuddy')
        conn = psycopg2.connect(database_url)
    
    return conn

@app.route('/pets')
def get_lost_pets():
    """Get all lost pets with their location and name"""
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT lat, long, name FROM pets WHERE status = 'lost'")
        pets = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(pets)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def serve_index():
    return send_from_directory('frontend', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('frontend', path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
