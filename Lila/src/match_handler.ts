const moduleName = "tic-tac-toe_js";
const tickRate = 1;

const winningPositions: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

enum OpCode {
  START = 1,
  UPDATE = 2,
  DONE = 3,
  MOVE = 4,
}

type Board = (Mark | null)[];

enum Mark {
  X = "X",
  O = "O",
}

interface State {
  board: Board;
  players: {
    [userId: string]: { mark: Mark; username: string };
  };
  currentTurn: Mark;
  winner: Mark | null;
  started: boolean;
}

let matchInit: nkruntime.MatchInitFunction<State> = function (
  ctx,
  logger,
  nk,
  params
) {
  logger.info("matchInit called", ctx.userId);
  const state: State = {
    board: [null, null, null, null, null, null, null, null, null],
    players: {},
    currentTurn: Mark.X,
    winner: null,
    started: false,
  };

  logger.info("match initialized");
  return {
    state,
    tickRate,
    label: "tic-tac-toe",
  };
};


let matchJoinAttempt: nkruntime.MatchJoinAttemptFunction<State> = function (
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state,
  presence
) {
  logger.info("join attempt user %s", presence.userId);
  const playerCount = Object.keys(state.players).length;
  if (playerCount >= 2) {
    return {
      state,
      accept: false,
      rejectMessage: "match full",
    };
  }

  if (state.started && playerCount === 0) {
    return {
      state,
      accept: false,
      rejectMessage: "match already ended",
    };
  }

  return {
    state,
    accept: true,
  };
};


let matchJoin: nkruntime.MatchJoinFunction<State> = function (
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state,
  presences
) {
  logger.info("players now: %v", state.players);
  presences.forEach(p => {
    if (Object.keys(state.players).length === 0) {
      state.players[p.userId] = { mark: Mark.X, username: p.username };
    } else {
      state.players[p.userId] = { mark: Mark.O, username: p.username };
    }
  });

  if (Object.keys(state.players).length === 2) {
    state.started = true;
    dispatcher.broadcastMessage(
      OpCode.START,
      JSON.stringify({
        board: state.board,
        currentTurn: state.currentTurn,
        players: state.players,
      })
    );
  }
  return { state };
};


let matchLoop: nkruntime.MatchLoopFunction<State> = function (
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state,
  messages
) {

  messages.forEach(message => {
    logger.info(
      "move received from %s",
      message.sender.userId
    );
    if (message.opCode !== OpCode.MOVE) {
      return;
    }
    const player = state.players[message.sender.userId];
    if (!player) {
      return;
    }
    const playerMark = player.mark;

    if (playerMark !== state.currentTurn) {
      return;
    }

    const data = JSON.parse(
      nk.binaryToString(message.data)
    );

    const position = data.position;
    if (
      state.board[position] !== null ||
      state.winner !== null
    ) {
      return;
    }

    state.board[position] = playerMark;

    const winner =
      checkWinner(state.board);

    if (winner) {

      logger.info("winner is %v", winner);

      state.winner = winner;

      dispatcher.broadcastMessage(
        OpCode.DONE,
        JSON.stringify({
          board: state.board,
          winner: winner,
        })
      );

      const winnerUserId =
        Object.keys(state.players)
          .find(id =>
            state.players[id].mark === winner
          );

      if (winnerUserId) {
        nk.leaderboardRecordWrite(
          "tic_tac_toe_wins",
          winnerUserId,
          state.players[winnerUserId].username,
          1
        );

        logger.info(
          "win recorded for %s",
          winnerUserId
        );
      }

      return {
        state: state,
        terminate: true
      };
    }

    state.currentTurn =
      playerMark === Mark.X
        ? Mark.O
        : Mark.X;

    dispatcher.broadcastMessage(
      OpCode.UPDATE,
      JSON.stringify({
        board: state.board,
        currentTurn: state.currentTurn,
      })
    );
  });
  return { state };
};


let matchLeave: nkruntime.MatchLeaveFunction<State> = function (
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state,
  presences
) {
  presences.forEach(p => {
    delete state.players[p.userId];
  });
  logger.info("players now %v", state.players);
  if (Object.keys(state.players).length === 0) {
    logger.info("terminating match because empty");
    return {
      state,
      terminate: true
    };
  }
  return { state };
};

let matchTerminate: nkruntime.MatchTerminateFunction<State> = function (
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state,
  graceSeconds
) {
  logger.info("match terminated");
  return { state };
};


let matchSignal: nkruntime.MatchSignalFunction<State> = function (
  ctx,
  logger,
  nk,
  dispatcher,
  tick,
  state,
  data
) {
  return { state };
};


function checkWinner(
  board: Board
): Mark | null {
  for (let pattern of winningPositions) {
    const [a, b, c] = pattern;
    if (
      board[a] &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return board[a];
    }
  }
  return null;
}