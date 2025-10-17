from flask import Flask, request

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def hello_world():
    if request.method == 'POST':
        return 'POST request received at root path!', 200
    return 'Hello from Cloud Run!'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
