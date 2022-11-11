import random
import time
from rich.pretty import pprint
from stockfish import Stockfish
from rich.console import Console
import chime

console = Console()

class Engine:
    def __init__(self):
        self._move_counter = 0
        self._stockfish = Stockfish(
            depth=10,
            parameters={
            "Slow Mover": 0,
            "Ponder": 'true',
            "Contempt": 100,
            "Skill Level": 2
            })
        self._stockfish_smart = Stockfish(
            depth=10,
            parameters={
            "Slow Mover": 0,
            "Ponder": 'true',
            "Contempt": 100,
            "Skill Level": 4
            })

    def get_move(self, fen, time_remaining):
        self._stockfish.set_fen_position(fen)
        self._stockfish_smart.set_fen_position(fen)
        if not self._stockfish.is_fen_valid(fen):
            console.print(fen, style="red")
            return None

        best_move, is_capture = self.get_best_move()

        actual_best_move, is_actual_best_move_capture = self.get_best_move(True)

        if is_actual_best_move_capture:
            if actual_best_move != best_move:
                chime.warning()
            best_move = actual_best_move
            is_capture = is_actual_best_move_capture
    
        if time_remaining < 5000: # if there is really low time start playing better
            best_move = actual_best_move

        delay = self.get_delay(time_remaining)
        if not is_capture: # if it is not a recapture
            time.sleep(delay)
        else:
            time.sleep(max(delay, 0.7)) # so people don't get salty when I take their free queen immediately

        self._move_counter += 1
        return best_move

    def get_best_move(self, is_smart=False):
        if is_smart:
            best_move = self._stockfish_smart.get_best_move_time(50)
        else:
            best_move = self._stockfish.get_best_move_time(50)
        is_capture = self._stockfish.will_move_be_a_capture(best_move) == Stockfish.Capture.DIRECT_CAPTURE
        return best_move, is_capture

    def get_delay(self, time_remaining):
        # if its a capture and every other move loses
        BULLET_GAME_TIME = 60000
        if self._move_counter < 5:
            time_factor = 0.7
        else:
            time_factor = 2.5

        if time_remaining < 10000:
            return 0
        return random.random() * time_factor * (time_remaining / BULLET_GAME_TIME)

    def set_move_count(self, new_move_count):
        self._move_counter = new_move_count
