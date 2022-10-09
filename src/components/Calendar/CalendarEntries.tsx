import {
  addDays,
  getDay,
  getMonth,
  getWeek,
  isEqual,
  isSameDay,
  previousSunday,
  startOfMonth,
} from "date-fns";
import { atom, useAtom } from "jotai";

import { selectedDayAtom, selectedMonthAtom } from "./Calendar";
import DayCell from "./DayCell";
import WeekCell from "./WeekCell";

export type Cell = {
  isWeek: boolean;
  isSelected: boolean;
  isWithinSelectedMonth: boolean;
  isToday: boolean;
  index: number;
  date: Date;
};

export const monthEntriesAtom = atom<Cell[]>((get) => {
  const startOfMonthDate = startOfMonth(get(selectedMonthAtom));
  // Get the first day displayed
  let currentDay = previousSunday(startOfMonthDate);

  const monthDaysEntries = Array.from({ length: 48 }).map((_, index) => {
    // It's a week
    if (index % 8 === 0)
      return {
        isWeek: true,
        isSelected: false,
        isWithinSelectedMonth: false,
        isToday: false,
        index: getWeek(currentDay, { firstWeekContainsDate: 7 }),
        date: currentDay,
      };

    const daySettings = {
      isWeek: false,
      isSelected: isSameDay(get(selectedDayAtom), currentDay),
      isWithinSelectedMonth:
        getMonth(get(selectedMonthAtom)) === getMonth(currentDay),
      isToday: isSameDay(new Date(), currentDay),
      index: getDay(currentDay),
      date: currentDay,
    };

    currentDay = addDays(currentDay, 1);

    return daySettings;
  });

  return monthDaysEntries;
});

export default function CalendarEntries() {
  const [monthEntries] = useAtom(monthEntriesAtom);

  return (
    <>
      {monthEntries.map((entry, index) =>
        entry.isWeek ? (
          <WeekCell key={index} cell={entry} />
        ) : (
          <DayCell key={index} cell={entry} />
        )
      )}
    </>
  );
}
