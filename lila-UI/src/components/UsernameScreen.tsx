import { useState } from "react";

type Props = {
  onSubmit: (username: string) => void;
};

export default function UsernameScreen({ onSubmit }: Props) {
  const [name, setName] = useState("");
  return (
    <div className="container">
      <h1>Tic Tac Toe</h1>
      <h3>Enter username</h3>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="username"
      />

      <button
        onClick={() => {
          if (name.trim().length < 3) {
            alert("min 3 characters");
            return;
          }

          onSubmit(name.trim());
        }}
      >
        Start Game
      </button>
    </div>
  );
}