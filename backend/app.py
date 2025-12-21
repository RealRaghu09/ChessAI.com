from websocket_server import WebsocketServer
from GameManager import GameManager


PORT  = 8765
HOST = "0.0.0.0"
GameManager = GameManager()



# Equivalent to ws.on('connection')
def new_client(client, server):
    print(f"Client connected: {client['id']}")
    GameManager.addUser(client)



# Equivalent to ws.on('disconnect')
def client_left(client, server):
    print(f"Client disconnected: {client['id']}")
    GameManager.removeUser(client, server)


# Equivalent to ws.on('message')
def message_received(client, server, message):
    GameManager.handleMessage(client, server, message)


# Create WebSocket server
server = WebsocketServer(host=HOST, port=PORT)

# Register lifecycle callbacks
server.set_fn_new_client(new_client)
server.set_fn_client_left(client_left)
server.set_fn_message_received(message_received)

print("WebSocket server running on ws://localhost:8765")
server.run_forever()
