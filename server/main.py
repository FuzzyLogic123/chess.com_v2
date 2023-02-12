from fastapi import FastAPI
from Engine import Engine
import time

app = FastAPI()
engine = Engine()

@app.get("/")
def read_root(fen: str, time_remaining: int):
    t0 = time.time()
    recommended_move = engine.get_move(fen, time_remaining)
    t1 = time.time()
    print(t1 - t0)
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