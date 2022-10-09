import { startOfMonth } from "date-fns";
import { atom } from "jotai";

import CalendarEntries from "./CalendarEntries";
import CalendarHeader from "./CalendarHeader";
import CalendarColumnHeaders from "./CalendarColumnHeaders";

export const selectedDayAtom = atom(new Date());
export const selectedMonthAtom = atom(startOfMonth(new Date()));

export default function Calendar() {
  return (
    <div className="flex flex-col space-y-2 text-[10px]">
      <CalendarHeader />
      <div className="grid grid-cols-8 gap-0">
        <CalendarColumnHeaders />
        <CalendarEntries />
      </div>
    </div>
  );
}
