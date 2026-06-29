from models.domain import ChatMessage, Reaction
from repositories.base import get_chat_repository


class ChatService:
    def __init__(self):
        self.chat_repo = get_chat_repository()

    def send_message(self, room_id: str, sender_id: str, username: str, content: str) -> ChatMessage:
        '''
        Send a message to a chat room
        '''
        message = ChatMessage(
            room_id=room_id,
            sender_id=sender_id,
            sender_username=username,
            content=content.strip()[:500],
        )
        return self.chat_repo.add_message(message)

    def get_history(self, room_id: str) -> list[ChatMessage]:
        '''
        Get the history of a chat room
        '''
        return self.chat_repo.get_messages(room_id)

    def add_reaction(self, room_id: str, user_id: str, username: str, emoji: str) -> Reaction:
        '''
        Add a reaction to a chat message
        '''
        if emoji not in {"👍", "👏", "🔥", "😮"}: # List of valid reactions
            raise ValueError("Invalid reaction")
        reaction = Reaction(room_id=room_id, user_id=user_id, username=username, emoji=emoji)
        return self.chat_repo.add_reaction(reaction) # Add the reaction to the chat message

    def get_reactions(self, room_id: str) -> list[Reaction]:
        '''
        Get all reactions for a chat message
        '''
        return self.chat_repo.get_reactions(room_id) # Get all reactions for a chat message
