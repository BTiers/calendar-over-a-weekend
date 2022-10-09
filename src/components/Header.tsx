import { HTMLProps } from "react";

export default function Header(
  props: Omit<HTMLProps<HTMLDivElement>, "classNames">
) {
  return (
    <div
      {...props}
      className="h-16 w-screen flex items-center justify-between border-b border-gray-300 flex-shrink-0 px-4"
    />
  );
}
