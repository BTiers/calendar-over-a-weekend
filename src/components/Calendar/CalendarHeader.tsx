import { addMonths, format, subMonths } from "date-fns";
import { atom, useAtom, useSetAtom } from "jotai";

import { selectedMonthAtom } from "./Calendar";

export const formattedSelectedMonthAtom = atom((get) =>
  format(get(selectedMonthAtom), "MMMM, yyy")
);

export default function CalendarHeader() {
  const [formattedSelectedMonth] = useAtom(formattedSelectedMonthAtom);
  const setSelectedMonthAtom = useSetAtom(selectedMonthAtom);

  return (
    <div className="text-sm font-medium text-gray-800 flex justify-between">
      {formattedSelectedMonth}
      <div>
        <button
          className="px-2"
          onClick={() => setSelectedMonthAtom((prev) => subMonths(prev, 1))}
        >
          -
        </button>
        <button
          className="px-2"
          onClick={() => setSelectedMonthAtom((prev) => addMonths(prev, 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}
