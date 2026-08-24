import ToolCard from "@/components/shared/ToolCard";

const tools = [
  {
    title: "Payment Matcher",
    description:
      "Automatically match supplier payments using FIFO logic and calculate delayed payment interest.",
    status: "Available" as const,
    href: "/payment-matcher",
  },
  {
    title: "GSTR-2B Reconciliation",
    description:
      "Compare Purchase Register with GSTR-2B and identify mismatches instantly.",
    status: "Coming Soon" as const,
    href: "/reconciliation",
  },
  {
    title: "Return Filing Checker",
    description:
      "Check filing status of multiple GSTINs in one go and export the results.",
    status: "Coming Soon" as const,
    href: "/filing-checker",
  },
  {
    title: "GST Calculators",
    description:
      "Calculate GST late fees, interest, Rule 37 implications, and more.",
    status: "Coming Soon" as const,
    href: "/calculators",
  },
];

export default function Tools() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-slate-900">
            GST Automation Tools
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Powerful tools built for Chartered Accountants, GST Practitioners,
            Businesses and Finance Teams.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </div>
    </section>
  );
}