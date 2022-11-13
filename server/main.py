from fastapi import FastAPI
from Engine import Engine


app = FastAPI()
engine = Engine()

@app.get("/")
def read_root(fen: str, time_remaining: int):
    recommended_move = engine.get_move(fen, time_remaining)
    return {
        "recommended_move": recommended_move
        }

@app.get("/premove")
def read_premove(fen: str, moves_in_advance: int):
    moves = engine.get_premove(fen, moves_in_advance)
    return {
        "premoves": moves
    }

@app.get("/castlingRights")
def read_castling_rights(fen: str):
    castling_rights = engine.get_castling_rights(fen)
    return {
        "castling_rights": castling_rights
    }