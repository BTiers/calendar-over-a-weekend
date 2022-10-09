import { Cell } from "./CalendarEntries";

export default function WeekCell({ cell }: { cell: Cell }) {
  const columnHeaderClassnames =
    "flex justify-center font-medium items-center text-gray-900 text-center bg-gray-100";

  return (
    <div key={cell.index} className={columnHeaderClassnames}>
      {cell.index}
    </div>
  );
}
