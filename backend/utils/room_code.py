import random
import string

ALPHABET = string.ascii_uppercase + string.digits


def generate_room_code(length: int = 6) -> str:
    return "".join(random.choices(ALPHABET, k=length))
