from flask import Flask, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # This allows your React frontend to talk to this backend

@app.route('/log', methods=['POST'])
def log_work():
    data = request.get_json()
    print("Received data:", data)  # Just print the data to check it works
    return {"message": "Log received!"}, 200

if __name__ == '__main__':
    app.run(debug=True)