import array
from turtle import position
from flask import Flask, render_template, request
import json
from ft_model.load_model import load_ft_model
app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')
@app.route('/make_move', ['POST'])
def make_move(response):
    data = json.loads(response.data)
    moves= data.get('move') # array of positions of each piece
    color = data.get('color') # white or black
    response_move = make_move(moves , color)
    send_response = {
        'type': 'move',
        'move': response_move
    }
    return json.dumps(send_response)
if __name__ == '__main__':
    app.run(debug=True)