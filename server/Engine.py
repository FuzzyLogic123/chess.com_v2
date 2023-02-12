import random
import time
import chess
import chess.engine
from rich.pretty import pprint
from rich.console import Console
import chime

console = Console()

import logging

# Enable debug logging.
logging.basicConfig(level=logging.DEBUG)

class Engine:
    def __init__(self):
        # self.stockfish_path = "/usr/games/stockfish"
        self.stockfish_path = "../stockfish/stockfish-11-linux/src/stockfish"
        self.engine = chess.engine.SimpleEngine.popen_uci(self.stockfish_path)
        self._move_counter = 0
        self.dumb_level = 4
        self.smart_level = 10
        self._BULLET_GAME_TIME = 60000
        self.engine_parameters = { "Contempt": 100, "Slow Mover" : 10 }

    def get_move(self, fen, time_remaining):
        if self._BULLET_GAME_TIME - time_remaining < 1000: # if its a new game reset the move counter
            self._move_counter = 0

        board = self.create_board(fen)
        if not board:
            return

        best_move, is_capture = self.get_best_move(board)
        # actual_best_move, is_actual_best_move_capture = self.get_best_move(board, True)

        # if is_actual_best_move_capture:
        #     best_move = actual_best_move
        #     is_capture = is_actual_best_move_capture
    
        # if time_remaining < 10000: # if there is really low time start playing better
        #     best_move = actual_best_move

        # delay = self.get_delay(time_remaining, is_capture)
        # time.sleep(delay)

        self._move_counter += 1
        return best_move

    def get_best_move(self, board, is_smart=False):
        is_capture = False
        if is_smart:
            self.engine.configure({"Skill Level": self.smart_level } | self.engine_parameters )
            # engine.close()
        else:
            self.engine.configure({"Skill Level": self.dumb_level }| self.engine_parameters )
            # engine.close()

        result = self.engine.play(board, chess.engine.Limit(time=0.01))
        best_move = result.move

        if best_move:
            best_move_uci = best_move.uci()
            is_capture = board.is_capture(best_move)
        else:
            best_move_uci = None
            is_capture = None
        return best_move_uci, is_capture

    def get_delay(self, time_remaining, is_capture):
        if self._move_counter < 5:
            time_factor = 0.3
        else:
            time_factor = 2.5

        delay = random.random() * time_factor * (time_remaining / self._BULLET_GAME_TIME)

        if time_remaining < 13000:
            return 0

        if is_capture: # delays all captures
            return max(delay, 0.7)

        return delay

    def set_move_count(self, new_move_count):
        self._move_counter = new_move_count

    def create_board(self, fen):
        try:
            board = chess.Board(fen)
            if not board.is_valid():
                console.print("fen invalid", style="salmon1")
                console.print(fen)
                # chime.error()
                return None
            return board
        except ValueError:
            return None

    def get_premove(self, fen, moves_in_advance):
        board = self.create_board(fen)
        if not board:
            return

        engine = chess.engine.SimpleEngine.popen_uci(self.stockfish_path)
        info = engine.analyse(board, chess.engine.Limit(depth=10))
        engine.close()

        principle_variation = info.get("pv")
        if not principle_variation:
            return None
        
        moves = [ move.uci() for i, move in enumerate(principle_variation) if i % 2 == 0]
        moves = moves[:moves_in_advance]
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

