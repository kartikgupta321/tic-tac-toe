import Cell from "./Cell";
import "../styles/Board.css";

type Props = {
  board: string[];
  onClick: (index: number) => void;
};

export default function Board({board, onClick}: Props) {
  return (
    <div className="board">
      {board.map((value, index) => (
        <Cell
          key={index}
          value={value}
          onClick={() => onClick(index)}
        />
      ))}
    </div>
  );
}