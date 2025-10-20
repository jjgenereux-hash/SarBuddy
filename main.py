from flask import Flask, send_from_directory, jsonify
import os
import psycopg2
from psycopg2.extras import RealDictCursor

app = Flask(__name__)

# Database connection configuration
def get_db_connection():
    """Create and return a database connection"""
    # Check if running in Cloud Run with Cloud SQL Proxy
    cloud_sql_connection_name = os.environ.get('db_conn')
    
    if cloud_sql_connection_name:
        # Connect via Cloud SQL Unix socket (for Cloud Run)
        db_user = os.environ.get('db_user', 'postgres')
        db_password = os.environ.get('db_password', 'pet123')
        db_name = os.environ.get('db_name', 'sarbuddy')
        db_socket_dir = '/cloudsql'
        
        conn = psycopg2.connect(
            user=db_user,
            password=db_password,
            database=db_name,
            host=f'{db_socket_dir}/{cloud_sql_connection_name}'
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
