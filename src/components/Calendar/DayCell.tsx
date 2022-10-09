import { format } from "date-fns";
import { useAtom, useSetAtom } from "jotai";

import { selectedDayAtom } from "./Calendar";
import { Cell } from "./CalendarEntries";

export default function DayCell({ cell }: { cell: Cell }) {
  const setSelectedDayAtom = useSetAtom(selectedDayAtom);

  let dayCellClassnames =
    "flex justify-center items-center text-center h-6 w-6 m-0.5 rounded-full transition ";

  if (cell.isToday)
    dayCellClassnames += "bg-blue-600 text-white font-medium hover:bg-blue-700";
  else if (cell.isSelected)
    dayCellClassnames +=
      "bg-blue-200 text-blue-900 font-medium hover:bg-blue-300";
  else if (cell.isWithinSelectedMonth)
    dayCellClassnames += "text-gray-900 font-medium hover:bg-gray-100";
  else dayCellClassnames += "text-gray-700 hover:bg-gray-100";

  return (
    <div
      key={cell.index}
      className={dayCellClassnames}
      onClick={() => setSelectedDayAtom(() => cell.date)}
    >
      {format(cell.date, "d")}
    </div>
  );
}
