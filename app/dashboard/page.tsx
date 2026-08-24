import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function DashboardPage() {
  const tools = [
    {
      name: "Payment Matcher",
      href: "/payment-matcher",
      status: "Available",
      description: "Automatically match supplier payments using FIFO logic",
    },
    {
      name: "GSTR-2B Reconciliation",
      href: "/reconciliation",
      status: "Coming Soon",
      description: "Compare Purchase Register with GSTR-2B",
    },
    {
      name: "Bulk GST Return Checker",
      href: "/filing-checker",
      status: "Coming Soon",
      description: "Check filing status of multiple GSTINs",
    },
    {
      name: "GST Calculators",
      href: "/calculators",
      status: "Coming Soon",
      description: "Calculate GST late fees, interest, and more",
    },
  ];

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h1 className="text-4xl font-bold text-slate-900">
            GSTPoint Dashboard
          </h1>

          <p className="mt-3 text-slate-600">
            Select a tool to start your work.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {tools.map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg group"
              >
                <h2 className="text-xl font-bold text-slate-900">{tool.name}</h2>

                <p className="mt-3 text-sm text-slate-500 line-clamp-2">
                  {tool.description}
                </p>

                <p className="mt-4 text-sm text-slate-500">
                  {tool.status}
                </p>

                {tool.status === "Available" && (
                  <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Ready to use
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
