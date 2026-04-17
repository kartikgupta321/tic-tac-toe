import "../styles/board.css";

type Props = {
  value: string;
  onClick: () => void;
};

export default function Cell({value, onClick}: Props) {
  return (
    <div
      className="cell"
      onClick={onClick}
    >
      {value}
    </div>
  );
}