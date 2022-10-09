import { HTMLProps, memo, useCallback, useMemo } from "react";

import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  format,
  getWeek,
} from "date-fns";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";

import Header from "./Header";
import Sidebar from "./Sidebar";
import Calendar, {
  selectedDayAtom,
  selectedMonthAtom,
} from "./Calendar/Calendar";

import { planningAtom, underPlanningAppointementAtom } from "../App";

type View = "day" | "week" | "month" | "year";
export const selectedViewAtom = atom<View>("day");

function TodayButton() {
  const setSelectedDay = useSetAtom(selectedDayAtom);
  const setSelectedMonth = useSetAtom(selectedMonthAtom);

  return (
    <button
      onClick={() => {
        setSelectedDay(new Date());
        setSelectedMonth(new Date());
      }}
    >
      Today
    </button>
  );
}

function ViewSelect() {
  const setSelectedView = useSetAtom(selectedViewAtom);

  return (
    <select
      onChange={({ target: { value } }) => setSelectedView(value as View)}
    >
      <option value="day">Day</option>
      <option value="week">Week</option>
      <option value="month">Month</option>
      <option value="year">Year</option>
    </select>
  );
}

function CurrentDateHeader() {
  const selectedDay = useAtomValue(selectedDayAtom);
  const selectedView = useAtomValue(selectedViewAtom);

  const formattedDate = useMemo(() => {
    switch (selectedView) {
      case "day":
        return format(selectedDay, "d MMMM yyyy");
      case "week":
        return format(selectedDay, "MMMM yyyy");
      case "month":
        return format(selectedDay, "MMMM yyyy");
      case "year":
        return format(selectedDay, "yyyy");
    }
  }, [selectedDay, selectedView]);

  return (
    <div className="text-xl flex items-center space-x-2">
      <span>{formattedDate}</span>
      <span className="bg-gray-200 text-xs p-1 rounded-sm">
        Week {getWeek(selectedDay, { firstWeekContainsDate: 7 })}
      </span>
    </div>
  );
}

function NavigationButtons() {
  const view = useAtomValue(selectedViewAtom);
  const setSelectedMonth = useSetAtom(selectedMonthAtom);
  const [selectedDay, setSelectedDay] = useAtom(selectedDayAtom);

  const getNextSelectedDay = useCallback(() => {
    switch (view) {
      case "day":
        return addDays(selectedDay, 1);
      case "week":
        return addWeeks(selectedDay, 1);
      case "month":
        return addMonths(selectedDay, 1);
      case "year":
        return addYears(selectedDay, 1);
    }
  }, [view, selectedDay]);

  const getPreviousSelectedDay = useCallback(() => {
    switch (view) {
      case "day":
        return subDays(selectedDay, 1);
      case "week":
        return subWeeks(selectedDay, 1);
      case "month":
        return subMonths(selectedDay, 1);
      case "year":
        return subYears(selectedDay, 1);
    }
  }, [view, selectedDay]);

  return (
    <div className="flex space-x-4 px-2">
      <button
        onClick={() => {
          const previousSelectedDay = getPreviousSelectedDay();

          setSelectedDay(previousSelectedDay);
          setSelectedMonth(previousSelectedDay);
        }}
      >
        -
      </button>
      <button
        onClick={() => {
          const nextSelectedDay = getNextSelectedDay();

          setSelectedDay(nextSelectedDay);
          setSelectedMonth(nextSelectedDay);
        }}
      >
        +
      </button>
    </div>
  );
}

function Planning() {
  const [lowerAppointementBound, upperAppointementBound] = useAtomValue(
    underPlanningAppointementAtom
  );

  return (
    <div className="space-x-4">
      <span className="text-green-500">
        {lowerAppointementBound
          ? format(lowerAppointementBound.date, "H m")
          : "No no"}
      </span>
      <span className="text-red-500">
        {upperAppointementBound
          ? format(upperAppointementBound.date, "H m")
          : "No no"}
      </span>
    </div>
  );
}

function Layout({
  children,
  ...rest
}: Omit<HTMLProps<HTMLDivElement>, "classNames">) {
  return (
    <div className="h-screen w-screen antialised" {...rest}>
      <Header>
        <div className="flex space-x-6">
          <Planning />
          <TodayButton />
          <ViewSelect />
          <NavigationButtons />
          <CurrentDateHeader />
        </div>
      </Header>
      <div className="overflow-hidden h-[calc(100vh-4rem)] w-screen flex">
        <Sidebar>
          <Calendar />
        </Sidebar>
        <div className="  flex flex-col flex-grow">{children}</div>
      </div>
    </div>
  );
}

export default memo(Layout);
