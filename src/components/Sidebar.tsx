import { HTMLProps } from "react";

export default function Sidebar(
  props: Omit<HTMLProps<HTMLDivElement>, "classNames">
) {
  return (
    <div
      {...props}
      className="w-64 h-full flex-shrink-0 px-6"
    />
  );
}
