

from flask import Flask, render_template, request
import json
import subprocess
from ft_model.load_model import load_ft_model
app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')
@app.route('/make_move', ['POST'])
def make_move(response):
    data = json.loads(response.data) #[]
    
    moves= data.get('move') # array of positions of each piece
    color = data.get('color') # white or black
    result = subprocess.run(
        ["./llama-cli", "-m", "model.gguf", "-p", data],
        capture_output=True,
        text=True
    )
    send_response = {
        'type': 'move',
        'move': result
    }
    return json.dumps(send_response)
if __name__ == '__main__':
    app.run(debug=True)