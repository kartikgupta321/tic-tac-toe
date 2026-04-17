import { useEffect, useState } from "react";
import type { Socket } from "@heroiclabs/nakama-js";
import "../styles/app.css";

interface LeaderboardRecord {
  username: string;
  score: number;
  rank: number;
}

interface Props {
  socket: Socket | null;
  refreshTrigger: number;
}

export default function Leaderboard({
  socket,
  refreshTrigger,
}: Props) {
  const [records, setRecords] =
    useState<LeaderboardRecord[]>([]);

  useEffect(() => {
    if (!socket) return;

    async function loadLeaderboard() {
      try {
        const res = await socket.rpc(
          "get_leaderboard",
          JSON.stringify({})
        );

        const data = JSON.parse(res.payload);
        setRecords(data.records || []);
      } catch (error) {
        console.log(
          "leaderboard load failed",
          error
        );
      }
    }

    loadLeaderboard();
  }, [socket, refreshTrigger]);

  return (
    <div className="leaderboard">
      <h2>Leaderboard</h2>
      {records.length === 0 && (
        <p>No matches played yet</p>
      )}
      {records.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Wins</th>
            </tr>
          </thead>
          <tbody>
            {records.map(player => (
              <tr key={player.username}>
                <td>{player.rank}</td>
                <td>{player.username}</td>
                <td>{player.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}