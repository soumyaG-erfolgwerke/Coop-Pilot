import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

const SortableHeader = ({ children, columnKey, requestSort, sortConfig }) => {
  const isSorted = sortConfig.key === columnKey;
  const Icon = isSorted
    ? sortConfig.direction === "ascending"
      ? ArrowUp
      : ArrowDown
    : ChevronsUpDown;
  return (
    <th
      onClick={() => requestSort(columnKey)}
      className="p-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer select-none dark:text-gray-400"
    >
      <div className="flex items-center">
        {children}
        <Icon
          size={14}
          className={`ml-2 ${
            isSorted ? "text-gray-800 dark:text-gray-200" : ""
          }`}
        />
      </div>
    </th>
  );
};

export default SortableHeader;
