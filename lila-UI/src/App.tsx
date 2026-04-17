import { useEffect, useRef, useState } from "react";
import "./styles/app.css";
import Board from "./components/Board";
import type { Socket } from "@heroiclabs/nakama-js";
import {
  connectToNakama,
  getUserId,
} from "./nakama/nakamaClient";
import UsernameScreen from "./components/UsernameScreen";
import Leaderboard from "./components/LeaderBoard";

export default function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [matchId, setMatchId] = useState<string | null>(null);
  const [currentTurn, setCurrentTurn] = useState<"X" | "O">("X");
  const [winner, setWinner] = useState<string | null>(null);
  const [myPlayer, setMyPlayer] = useState<"X" | "O" | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const started = useRef(false);
  const [leaderboardRefresh, setLeaderboardRefresh] =
    useState(0);

  const [username, setUsername] = useState(
    sessionStorage.getItem("username") || ""
  );

  const [players, setPlayers] = useState<
    Record<string, { mark: "X" | "O"; username: string }>
  >({});

  function resetGameState() {
    setBoard(Array(9).fill(null));
    setMatchId(null);
    setCurrentTurn("X");
    setWinner(null);
    setMyPlayer(null);
    setPlayers({});
  }

  async function startGame() {
    try {
      const socket = await connectToNakama();
      setSocket(socket);

      setLeaderboardRefresh(prev => prev + 1);

      await new Promise(r => setTimeout(r, 300));
      const response = await socket.rpc(
        "find_match_js",
        JSON.stringify({})
      );

      const data = JSON.parse(response.payload);
      const match = await socket.joinMatch(
        data.matchIds[0]
      );

      console.log("joined match", match.match_id);
      setMatchId(match.match_id);
      socket.onmatchdata = (msg) => {
        const data = JSON.parse(
          new TextDecoder().decode(msg.data)
        );
        console.log(
          "server msg",
          msg.op_code,
          data
        );

        switch (msg.op_code) {
          case 1:
            setBoard(data.board);
            setCurrentTurn(data.currentTurn);
            setPlayers(data.players);
            setMyPlayer(
              data.players[getUserId()].mark
            );
            setWinner(null);
            break;
          case 2:
            setBoard(data.board);
            setCurrentTurn(data.currentTurn);
            break;
          case 3:
            setBoard(data.board);
            setWinner(data.winner);

            // refresh leaderboard after win
            setLeaderboardRefresh(prev => prev + 1);
            break;
        }
      };
    } catch (error) {
      // handle duplicate username
      if (error?.status === 409) {
        alert("Username already taken. Try another one.");
        sessionStorage.removeItem("username");
        setUsername("");
        started.current = false;
        return;
      }
      console.log("startgame failed", error);
    }
  }

  useEffect(() => {
    // don't start until username exists
    if (!username) return;

    if (started.current) return;
    started.current = true;

    Promise.resolve().then(() => {
      startGame();
    });
  }, [username]);

  async function handleClick(index: number) {
    console.log("clicked - ", index, " by ", getUserId());
    if (!matchId || !myPlayer || !socket) return;
    if (board[index] !== null) return;
    if (currentTurn !== myPlayer) return;
    if (winner) return;
    await socket.sendMatchState(
      matchId,
      4,
      JSON.stringify({
        position: index
      })
    );
  }

  const playerList = Object.values(players);

  const playerX =
    playerList.find(p => p.mark === "X");

  const playerO =
    playerList.find(p => p.mark === "O");

  const myUsername =
    players[getUserId()]?.username;

  if (!username) {
    return (
      <UsernameScreen
        onSubmit={(name) => {
          sessionStorage.setItem("username", name);
          setUsername(name);
        }}
      />
    );
  }
  else {
    return (
      <div className="container">
        <h1>Tic Tac Toe</h1>

        <h3>
          {playerX?.username || "Waiting..."} (X)
          {" vs "}
          {playerO?.username || "Waiting..."} (O)
        </h3>

        <h4>
          Current turn:
          {" "}
          {
            currentTurn === "X"
              ? playerX?.username
              : playerO?.username
          }
        </h4>

        {myPlayer && (
          <h4>
            You are:
            {" "}
            {myUsername}
            {" (" + myPlayer + ")"}
          </h4>
        )}

        {winner && (
          <div>
            <h2>
              Winner:
              {" "}
              {
                winner === "X"
                  ? playerX?.username
                  : playerO?.username
              }
            </h2>
            <button
              onClick={async () => {
                resetGameState();
                await startGame();
              }}
            >
              Play Again
            </button>
          </div>
        )}


        {Object.keys(players).length < 2 && (
          <p>Waiting for opponent...</p>
        )}
        <Board board={board} onClick={handleClick} />

        {socket && (
          <Leaderboard
            socket={socket}
            refreshTrigger={leaderboardRefresh}
          />
        )}
      </div>
    );
  }
}