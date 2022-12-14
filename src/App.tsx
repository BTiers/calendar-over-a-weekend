import React, { useMemo } from "react";

import {
  addDays,
  addMinutes,
  format,
  getHours,
  getMinutes,
  isAfter,
  isBefore,
  isEqual,
  isSameDay,
  isToday,
  isWithinInterval,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { atom, PrimitiveAtom, useAtom, useAtomValue, useSetAtom } from "jotai";

import * as Popover from "@radix-ui/react-popover";

import { selectedDayAtom } from "./components/Calendar/Calendar";
import Layout, { selectedViewAtom } from "./components/Layout";

function GreenwichMeanTime({ day }: { day: Date }) {
  return (
    <div className="min-w-[48px] max-w-[80px] text-[10px] flex flex-col justify-end items-end h-full pr-2">
      <span className="text-gray-600">{format(day, "OOO")}</span>
    </div>
  );
}

function DayHeading({ date }: { date: Date }) {
  return (
    <div className="px-2">
      <div
        className={`uppercase font-medium text-xs text-center ${
          isToday(date) ? "text-blue-600" : "text-gray-600"
        }`}
      >
        {format(date, "EEE.")}
      </div>
      <div
        className={`text-gray-800 text-2xl flex items-center justify-center text-center rounded-full w-11 h-11 ${
          isToday(date) ? "text-white bg-blue-600" : ""
        }`}
      >
        {format(date, "d")}
      </div>
    </div>
  );
}

function AgendaDayHeader() {
  const selectedDay = useAtomValue(selectedDayAtom);

  return (
    <div className="flex flex-grow items-start h-[80px] items-center">
      <GreenwichMeanTime day={selectedDay} />
      <div className="w-[8px] h-full relative after:content-[''] after:absolute after:bottom-0 after:right-0 after:h-[20px] after:w-0 after:border-r after:border-1 after:border-gray-300" />
      <DayHeading date={selectedDay} />
    </div>
  );
}

export const monthEntriesAtom = atom<Date[]>((get) => {
  // Get the first day displayed
  let startOfWeekDate = startOfWeek(get(selectedDayAtom));

  const weekDaysEntries = Array.from({ length: 7 }).map((_, index) => {
    const daySettings = startOfWeekDate;

    startOfWeekDate = addDays(startOfWeekDate, 1);

    return daySettings;
  });

  return weekDaysEntries;
});

function AgendaWeekHeader() {
  const weekDaysEntries = useAtomValue(monthEntriesAtom);

  return (
    <div className="flex flex-grow items-start h-[80px] items-center">
      <GreenwichMeanTime day={weekDaysEntries[0]} />
      <div className="flex h-full flex-grow">
        {weekDaysEntries.map((date, index) => {
          return (
            <div
              className="min-w-[76px] flex flex-grow items-center justify-center relative pl-2"
              key={index}
            >
              <div className="w-[8px] h-full after:content-[''] after:absolute after:bottom-0 after:left-[7px] after:h-[20px] after:w-px after:bg-gray-300" />
              <DayHeading date={date} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

const HOUR_LABELS = [
  "",
  "1 AM",
  "2 AM",
  "3 AM",
  "4 AM",
  "5 AM",
  "6 AM",
  "7 AM",
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM",
  "6 PM",
  "7 PM",
  "8 PM",
  "9 PM",
  "10 PM",
  "11 PM",
  "",
];

function AgendaRowHours({ index }: { index: number }) {
  if (index === 24) return null;

  return (
    <div className="flex relative">
      <div className="relative min-w-[48px] h-12 max-w-[80px] text-[10px] top-[-8px] items-start h-full text-right pr-1">
        <span className="text-gray-600">{HOUR_LABELS[index]}</span>
      </div>
    </div>
  );
}

function AgendaHourRow({ hour }: { hour: number }) {
  return (
    <div className="relative w-full min-w-[76px] h-12 text-[10px] items-start h-full pr-2 text-right">
      <div className="w-[8px] border-r border-1 border-gray-300 h-full after:content-[''] after:absolute after:top-0 after:right-0 after:w-full after:h-px after:bg-gray-300" />
    </div>
  );
}

export const planningAtom = atom(false);

type AppointementBound = {
  click: { x: number; y: number };
  bounds: DOMRect;
  quarterSpan: number;
  quarterHit: number;
  date: Date;
};

type Appointement = [AppointementBound, AppointementBound];
type AppointementBoundWithCollision = AppointementBound & {
  collisionCount: number;
  offset: number;
};

type AppointementWithCollision = [
  AppointementBoundWithCollision,
  AppointementBoundWithCollision
];

type NullableAppointementBound = AppointementBound | null;
type UnderPlanningAppointement = [
  NullableAppointementBound,
  NullableAppointementBound
];

type AppointementBoundType = "upper" | "lower";
type AppointementBoundWithType = {
  bound: AppointementBound;
  type: AppointementBoundType;
};

export const underPlanningAppointementAtom = atom<UnderPlanningAppointement>([
  null,
  null,
]);

const addUnderPlanningAppointementBoundAtom = atom(
  null,
  (_get, set, update: AppointementBoundWithType) => {
    set(underPlanningAppointementAtom, (prev) => {
      if (update.type === "lower") return [update.bound, prev[1]];
      return [prev[0], update.bound];
    });
  }
);

function getClickInfos(
  click: React.MouseEvent<HTMLDivElement, MouseEvent>,
  day: Date,
  type: AppointementBoundType
) {
  const dayStart = startOfDay(day);

  let bounds = click.currentTarget.getBoundingClientRect();
  let x = click.clientX - bounds.left;
  let y = click.clientY - bounds.top;

  const quarterSpan = bounds.height / 24 / 4;
  const quarterHit =
    type === "lower" ? Math.floor(y / quarterSpan) : Math.ceil(y / quarterSpan);
  const clickAsDate = addMinutes(dayStart, 15 * quarterHit);

  return {
    click: { x, y },
    bounds,
    quarterSpan,
    quarterHit,
    date: clickAsDate,
  };
}

const handleMouseDownAtom = atom(
  null,
  (
    get,
    set,
    update: { click: React.MouseEvent<HTMLDivElement, MouseEvent>; day: Date }
  ) => {
    set(planningAtom, true);
    set(addUnderPlanningAppointementBoundAtom, {
      type: "lower",
      bound: getClickInfos(update.click, update.day, "lower"),
    });
    set(addUnderPlanningAppointementBoundAtom, {
      type: "upper",
      bound: getClickInfos(update.click, update.day, "upper"),
    });
  }
);

const handleMouseUpAtom = atom(
  null,
  (
    get,
    set,
    update: { click: React.MouseEvent<HTMLDivElement, MouseEvent>; day: Date }
  ) => {
    set(planningAtom, false);
    set(addUnderPlanningAppointementBoundAtom, {
      type: "upper",
      bound: getClickInfos(update.click, update.day, "upper"),
    });
  }
);

const handleMouseMoveAtom = atom(
  null,
  (
    get,
    set,
    update: { click: React.MouseEvent<HTMLDivElement, MouseEvent>; day: Date }
  ) => {
    if (get(planningAtom)) {
      let bounds = update.click.currentTarget.getBoundingClientRect();
      let y = update.click.clientY - bounds.top;

      const lowerBound = get(underPlanningAppointementAtom)[0];

      if (lowerBound) {
        const boundaryType = lowerBound.click.y > y ? "lower" : "upper";

        set(addUnderPlanningAppointementBoundAtom, {
          type: boundaryType,
          bound: getClickInfos(update.click, update.day, boundaryType),
        });
      }
    }
  }
);

function getAppointementPositionFromBoundary(bound: AppointementBound) {
  return bound.quarterHit * bound.quarterSpan;
}

function AppointementForm() {
  const [
    [lowerAppointementBound, upperAppointementBound],
    setAppointementBound,
  ] = useAtom(underPlanningAppointementAtom);
  const addAppointement = useSetAtom(addAppointementAtom);

  if (!lowerAppointementBound || !upperAppointementBound) return null;

  return (
    <Popover.Root open>
      <Popover.Anchor className="absolute top-0 left-0" />
      <Popover.Portal>
        <Popover.Content
          align="start"
          className="w-96 flex flex-col space-y-4 bg-white rounded z-30 relative p-2 shadow-lg"
          onInteractOutside={(e) => {
            e.stopPropagation();
            setAppointementBound([null, null]);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
          }}
        >
          <Popover.Close
            className="w-5 h-5 top-1 right-1 absolute"
            onClick={(e) => {
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              setAppointementBound([null, null]);
            }}
          />
          <div className="flex space-x-2">
            <div className="text-sm">
              {format(lowerAppointementBound.date, "PPP")}
            </div>
            <div className="text-sm">
              {format(lowerAppointementBound.date, "H:mm")}
            </div>
            <div className="text-sm">-</div>
            <div className="text-sm">
              {format(upperAppointementBound.date, "H:mm")}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                setAppointementBound([null, null]);
              }}
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
                setAppointementBound([null, null]);
                addAppointement([
                  lowerAppointementBound,
                  upperAppointementBound,
                ]);
              }}
            >
              Save
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function AppointementBuilder({ day }: { day: Date }) {
  const isPlanning = useAtomValue(planningAtom);
  const [lowerAppointementBound, upperAppointementBound] = useAtomValue(
    underPlanningAppointementAtom
  );

  const lowerBoundPosition = useMemo(() => {
    if (lowerAppointementBound)
      return getAppointementPositionFromBoundary(lowerAppointementBound);
    return 0;
  }, [lowerAppointementBound]);

  const upperBoundPosition = useMemo(() => {
    if (upperAppointementBound)
      return getAppointementPositionFromBoundary(upperAppointementBound);
    return 0;
  }, [upperAppointementBound]);

  if (!lowerAppointementBound) return null;

  if (!isSameDay(day, lowerAppointementBound.date)) return null;

  return (
    <div
      className="absolute inset-x-0 z-20 select-none pointer-events-none"
      style={{
        top: lowerBoundPosition,
        height: upperBoundPosition - lowerBoundPosition - 2,
      }}
    >
      <div className="relative h-full px-2 py-px flex flex-col bg-sky-600 rounded select-none drop-shadow-[0_3px_3px_rgba(0,0,0,0.50)]">
        {!isPlanning && <AppointementForm />}
        <span className="text-xs text-white">(Untitled)</span>
        <span className="text-xs text-white">
          {format(lowerAppointementBound.date, "h:mm")}
          &nbsp;to&nbsp;
          {upperAppointementBound &&
            format(upperAppointementBound?.date, "h:mm")}
        </span>
      </div>
    </div>
  );
}

const appointementAtomsAtom = atom<PrimitiveAtom<AppointementWithCollision>[]>(
  []
);

function computeCollisions(
  appointements: AppointementWithCollision[]
): AppointementWithCollision[] {
  const columns: AppointementWithCollision[][] = [];
  let lastAppointementEnding: Date | null = null;

  let columnIndex = 0;

  appointements.forEach((appointement) => {
    const [{ date: startDate }, { date: endDate }] = appointement;

    let isAppointementPlaced = false;

    for (const column of columns) {
      if (
        (isWithinInterval(startDate, {
          start: column[column.length - 1][0].date,
          end: column[column.length - 1][1].date,
        }) ||
          isWithinInterval(endDate, {
            start: column[column.length - 1][0].date,
            end: column[column.length - 1][1].date,
          })) &&
        !isEqual(startDate, column[column.length - 1][1].date)
      ) {
        column.push(appointement);
        isAppointementPlaced = true;
        break;
      }
    }

    if (!isAppointementPlaced) columns.push([appointement]);

    if (!lastAppointementEnding || isAfter(endDate, lastAppointementEnding))
      lastAppointementEnding = endDate;
  });

  // console.log(columns);

  return columns.flatMap((column) => {
    return column.map((a, index): AppointementWithCollision => {
      return [
        { ...a[0], collisionCount: column.length, offset: index },
        { ...a[1], collisionCount: column.length, offset: index },
      ];
    });
  });
}

const createAppointementWithCollisionAtom = (
  appointement: AppointementWithCollision
) => atom<AppointementWithCollision>(appointement);
export const addAppointementAtom = atom(
  null,
  (get, set, update: Appointement) => {
    set(appointementAtomsAtom, (prev) => {
      let insertIndex = prev.length;

      for (let i = 0; i < prev.length; i++) {
        const [{ date: startingDate }, { date: endingDate }] = get(prev[i]);

        if (
          isBefore(update[0].date, startingDate) ||
          (isEqual(update[0].date, startingDate) &&
            isAfter(update[1].date, endingDate))
        ) {
          insertIndex = i;
        }
      }

      const newAppointements = [...prev];

      newAppointements.splice(
        insertIndex,
        0,
        createAppointementWithCollisionAtom([
          { ...update[0], collisionCount: 0, offset: 0 },
          { ...update[1], collisionCount: 0, offset: 0 },
        ])
      );

      for (let i = 0; i < newAppointements.length; i++) {
        const [{ date: startingDate, collisionCount, offset, ...rest }] = get(
          newAppointements[i]
        );

        if (isBefore(update[0].date, startingDate)) {
          insertIndex = i;
        }
      }

      const withCollision = computeCollisions(
        newAppointements.map((appointement) => {
          // Reset collisions
          return [
            { ...get(appointement)[0], collisionCount: 0, offset: 0 },
            { ...get(appointement)[1], collisionCount: 0, offset: 0 },
          ];
        })
      );

      newAppointements.forEach((appointement, index) =>
        set(appointement, withCollision[index])
      );

      return newAppointements;
    });
  }
);

function Appointement({
  day,
  appointementAtom,
}: {
  day: Date;
  appointementAtom: PrimitiveAtom<AppointementWithCollision>;
}) {
  const [lowerBound, upperBound] = useAtomValue(appointementAtom);

  if (!isSameDay(day, lowerBound.date) || !isSameDay(day, upperBound.date))
    return null;

  const minutesInADay = 1440;

  const lowerBoundMinutes =
    getMinutes(lowerBound.date) + getHours(lowerBound.date) * 60;
  const lowerBoundPosition = (lowerBoundMinutes / minutesInADay) * 100;

  const upperBoundMinutes =
    getMinutes(upperBound.date) + getHours(upperBound.date) * 60;
  const upperBoundPosition = (upperBoundMinutes / minutesInADay) * 100;

  return (
    <div
      className="absolute z-20 rounded select-none pointer-events-none border border-white"
      style={{
        left: `calc((100% / ${lowerBound.collisionCount}) * ${lowerBound.offset})`,
        width: `calc(100% / ${lowerBound.collisionCount})`,
        zIndex: `${20 + lowerBound.collisionCount}`,
        top: `${lowerBoundPosition}%`,
        height: `calc(${upperBoundPosition - lowerBoundPosition}% - 2px)`,
      }}
    >
      <div className="relative h-full rounded px-2 py-px flex flex-col bg-sky-600 select-none">
        <span className="text-xs text-white">(Untitled)</span>
        <span className="text-xs text-white">
          {format(lowerBound.date, "h:mm")}
          &nbsp;to&nbsp;
          {format(upperBound.date, "h:mm")}
        </span>
      </div>
    </div>
  );
}

function Appointements({ day }: { day: Date }) {
  const appointements = useAtomValue(appointementAtomsAtom);

  return (
    <>
      {appointements.map((appointementAtom) => (
        <Appointement
          day={day}
          appointementAtom={appointementAtom}
          key={`${appointementAtom}`}
        />
      ))}
    </>
  );
}

function CurrenTimeIndicator({ day }: { day: Date }) {
  if (!isSameDay(new Date(), day)) return null;

  const minutesInADay = 1440;
  const minutes = getMinutes(new Date()) + getHours(new Date()) * 60;
  const position = (minutes / minutesInADay) * 100;

  return (
    <div
      className="h-[12px] w-full absolute left-[-2px] z-[300]"
      style={{ top: `calc(${position}% - 6px)` }}
    >
      <div className="h-[12px] w-[12px] ml-[-5px] rounded-full bg-red-500" />
      <div className="h-[2px] -mt-[7px] w-full bg-red-500" />
    </div>
  );
}

function AgendaDaySchedule({ day }: { day: Date }) {
  const handleMouseUp = useSetAtom(handleMouseUpAtom);
  const handleMouseDown = useSetAtom(handleMouseDownAtom);
  const handleMouseMove = useSetAtom(handleMouseMoveAtom);

  return (
    <div className="absolute inset-y-0 left-[8px] right-0">
      <div
        className="relative inset-0 h-full z-10"
        onMouseDown={(e) => handleMouseDown({ click: e, day })}
        onMouseMove={(e) => handleMouseMove({ click: e, day })}
        onMouseUp={(e) => handleMouseUp({ click: e, day })}
      >
        <CurrenTimeIndicator day={day} />
        <Appointements day={day} />
        <AppointementBuilder day={day} />
      </div>
    </div>
  );
}

function AgendaDay() {
  const selectedDay = useAtomValue(selectedDayAtom);

  return (
    <div className="items-start py-3 pr-4">
      <AgendaDayHeader />
      <div className="flex flex-grow">
        <div className="flex flex-grow">
          <div className="flex flex-col">
            {Array.from({ length: 25 }).map((_, index) => (
              <AgendaRowHours index={index} key={index} />
            ))}
          </div>
          <div className="flex flex-col flex-grow relative">
            <AgendaDaySchedule day={selectedDay} />
            {Array.from({ length: 24 }).map((_, index) => (
              <AgendaHourRow hour={index} key={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AgendaWeekDaySchedule({ day }: { day: Date }) {
  const handleMouseUp = useSetAtom(handleMouseUpAtom);
  const handleMouseDown = useSetAtom(handleMouseDownAtom);
  const handleMouseMove = useSetAtom(handleMouseMoveAtom);

  return (
    <div className="absolute inset-y-0 left-[8px] right-[-8px]">
      <div
        className="relative inset-0 h-full z-10"
        onMouseDown={(e) => handleMouseDown({ click: e, day })}
        onMouseMove={(e) => handleMouseMove({ click: e, day })}
        onMouseUp={(e) => handleMouseUp({ click: e, day })}
      >
        <CurrenTimeIndicator day={day} />
        <Appointements day={day} />
        <AppointementBuilder day={day} />
      </div>
    </div>
  );
}

function AgendaWeek() {
  const weekDaysEntries = useAtomValue(monthEntriesAtom);

  return (
    <div className="items-start py-3 pr-4">
      <AgendaWeekHeader />
      <div className="flex flex-grow">
        {weekDaysEntries.map((date, index) => {
          return (
            <div className="flex flex-grow" key={index}>
              {index === 0 && (
                <div className="flex flex-col">
                  {Array.from({ length: 25 }).map((_, index) => (
                    <AgendaRowHours index={index} key={index} />
                  ))}
                </div>
              )}
              <div className="flex flex-col flex-grow relative">
                <AgendaWeekDaySchedule day={date} />
                {Array.from({ length: 24 }).map((_, index) => (
                  <AgendaHourRow hour={index} key={index} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgendaMonth() {
  return <div className="flex flex-col flex-grow h-full bg-cyan-300"></div>;
}

function AgendaYear() {
  return <div className="flex flex-col flex-grow h-full bg-purple-300"></div>;
}

function App() {
  const selectedView = useAtomValue(selectedViewAtom);

  return (
    <Layout>
      {selectedView === "day" && <AgendaDay />}
      {selectedView === "week" && <AgendaWeek />}
      {selectedView === "month" && <AgendaMonth />}
      {selectedView === "year" && <AgendaYear />}
    </Layout>
  );
}

export default App;
