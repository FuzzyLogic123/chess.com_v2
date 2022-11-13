import random
import time
import chess
import chess.engine
from rich.pretty import pprint
from rich.console import Console
import chime

console = Console()


class Engine:
    def __init__(self):
        self._move_counter = 0
        self.engine = chess.engine.SimpleEngine.popen_uci("/usr/games/stockfish")
        self.smart_level = 6
        self.dumb_level = 3

    def get_move(self, fen, time_remaining):
        board = self.create_board(fen)

        best_move, is_capture = self.get_best_move(board)

        actual_best_move, is_actual_best_move_capture = self.get_best_move(board, True)

        if is_actual_best_move_capture:
            best_move = actual_best_move
            is_capture = is_actual_best_move_capture
    
        if time_remaining < 5000: # if there is really low time start playing better
            best_move = actual_best_move

        delay = self.get_delay(time_remaining)
        if not is_capture: # if it is not a recapture
            time.sleep(delay)
        elif time_remaining < 5000:
            time.sleep(0.2)
        else:
            time.sleep(max(delay, 0.7)) # so people don't get salty when I take their free queen immediately

        self._move_counter += 1
        return best_move

    def get_best_move(self, board, is_smart=False):
        is_capture = False
        if is_smart:
            self.engine.configure({"Skill Level": self.smart_level})
            info = self.engine.analyse(board, chess.engine.Limit(depth=10))
            best_move = info["pv"][0]
        else:
            self.engine.configure({"Skill Level": self.dumb_level})
            info = self.engine.analyse(board, chess.engine.Limit(depth=10))
            best_move = info["pv"][0]

        best_move_uci = best_move.uci()
        is_capture = board.is_capture(best_move)
        return best_move_uci, is_capture

    def get_delay(self, time_remaining):
        # if its a capture and every other move loses
        BULLET_GAME_TIME = 60000
        if self._move_counter < 5:
            time_factor = 0.3
        else:
            time_factor = 2.5

        if time_remaining < 10000:
            return 0
        return random.random() * time_factor * (time_remaining / BULLET_GAME_TIME)

    def set_move_count(self, new_move_count):
        self._move_counter = new_move_count

    def create_board(self, fen):
        print(fen)
        try:
            board = chess.Board(fen)
            if not board.is_valid():
                console.print("fen invalid", style="salmon1")
                chime.error()
            return board
        except ValueError:
            return None

    def get_premove(self, fen):
        board = self.create_board(fen)
        self.engine.configure({"Skill Level": self.smart_level})
        info = self.engine.analyse(board, chess.engine.Limit(depth=10))

        principle_variation = info.get("pv")
        if not principle_variation:
            return None
        
        moves = [ move.uci() for i, move in enumerate(principle_variation) if i % 2 == 0]
        moves = moves[:3]
        print(moves)

        return moves

    def get_castling_rights(self, fen):
        castling_rights = ""
        board = chess.Board(fen)

        if board.has_kingside_castling_rights(chess.WHITE):
            castling_rights += "K"
        if board.has_queenside_castling_rights(chess.WHITE):
            castling_rights += "Q"
        if board.has_kingside_castling_rights(chess.BLACK):
            castling_rights += "k"
        if board.has_queenside_castling_rights(chess.BLACK):
            castling_rights += "q"
        
        return castling_rights if castling_rights else "-"

