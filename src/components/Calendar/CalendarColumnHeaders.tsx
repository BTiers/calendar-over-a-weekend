const DAYS_IN_WEEK = ["S", "M", "T", "W", "T", "F", "S"];

export default function CalendarColumnHeaders() {
  const columnHeaderClassnames =
    "flex justify-center items-center text-gray-600 text-center h-6 w-6";

  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => {
        if (index === 0)
          return <div key={index} className={columnHeaderClassnames} />;

        return (
          <div key={index} className={columnHeaderClassnames}>
            {DAYS_IN_WEEK[index - 1]}
          </div>
        );
      })}
    </>
  );
}
