const highlightText = (text, highlight) => {
  if (!text) return "";
  if (!highlight || !highlight.trim()) return <span>{text}</span>;
  const escaped = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200 px-0.5 rounded-sm font-semibold"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  );
};

export default highlightText;
