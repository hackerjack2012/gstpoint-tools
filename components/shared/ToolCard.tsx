import Link from "next/link";

type ToolCardProps = {
  title: string;
  description: string;
  status: "Available" | "Coming Soon";
  href: string;
};

export default function ToolCard({
  title,
  description,
  status,
  href,
}: ToolCardProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            status === "Available"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {status}
        </span>
      </div>

      <p className="mt-4 flex-grow text-sm leading-6 text-slate-600">
        {description}
      </p>

      <Link
        href={href}
        className={`mt-6 inline-flex items-center justify-center rounded-lg px-5 py-3 font-semibold transition ${
          status === "Available"
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "cursor-not-allowed bg-slate-200 text-slate-500"
        }`}
      >
        {status === "Available" ? "Launch Tool" : "Coming Soon"}
      </Link>
    </div>
  );
}