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