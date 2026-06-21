
from openai import OpenAI
from flask import Flask, render_template, request
import json
import subprocess
from ft_model.load_model import load_ft_model
app = Flask(__name__)
PORT = 11432
MODEL_NAME = "unsloth/Llama-3.2-3B-Instruct"
SYSTEM_PROMPT = """
You are an expert chess analyst and coach.

You will receive:

- moves: a list of chess moves in Standard Algebraic Notation (SAN).
- color: either "white" or "black", indicating the player's side.

Your tasks:

1. Reconstruct the chessboard by applying all moves in order.
2. Determine whose turn it is to move.
3. Analyze the position from the perspective of the given color.
4. Consider:
   - Material balance
   - King safety
   - Piece activity
   - Pawn structure
   - Tactical opportunities and threats
   - Strategic plans

Return ONLY valid JSON in the following format:

{
  "side_to_move": "<white|black>",
  "position_evaluation": "<winning|better|equal|worse|losing>",
  "evaluation_score": "<numeric centipawn score or mate score>",
  "best_move": "<recommended move in SAN>",
  "reasoning": "<brief explanation>",
  "threats": [
    "<opponent threat 1>",
    "<opponent threat 2>"
  ],
  "plan": [
    "<short-term objective>",
    "<long-term objective>"
  ]
}

Rules:
- Evaluate the position strictly from the player's color perspective.
- Keep reasoning concise and actionable.
- If the game is over (checkmate, stalemate, draw, resignation, insufficient material), indicate the result and set best_move to null.
- If the moves are invalid or cannot be parsed, return:

{
  "error": "Invalid move sequence: <reason>"
}

Return only JSON and no additional text.
"""
@app.route('/')
def index():
    return render_template('index.html')
@app.route('/make_move', ['POST'])
def make_move(response):
    data = json.loads(response.data) #[]
    
    moves= data.get('move') # array of positions of each piece
    color = data.get('color') # white or black
    client = OpenAI(
    base_url=f"http://localhost:{PORT}/v1/", # runs the Finetuned Model
    api_key='ollama'
    )

    chat_completion = client.chat.completions.create(
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": f"moves={moves}\ncolor={color}"
        }
    ],
    model=MODEL_NAME
    )
    result = chat_completion.choices[0].message.content
    send_response = {
        'type': 'move',
        'move': result
    }
    return json.dumps(send_response)
if __name__ == '__main__':
    app.run(debug=True)