interface Props {
  visibility: "public" | "private";
}

export function ReportVisibilityBadge({ visibility }: Props) {
  const isPublic = visibility === "public";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isPublic
          ? "bg-emerald-100 text-emerald-800"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {isPublic ? "Public" : "Private"}
    </span>
  );
}
