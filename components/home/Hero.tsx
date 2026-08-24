export default function Hero() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto flex min-h-[80vh] max-w-7xl flex-col items-center justify-center px-6 text-center">

        <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
          Professional GST Automation Platform
        </span>

        <h1 className="mt-8 max-w-4xl text-6xl font-extrabold leading-tight text-slate-900">
          Automate Your GST
          <br />
          Work in Minutes
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-slate-600">
          Upload Excel files and instantly perform Payment Matching,
          GSTR-2B Reconciliation, Filing Status Checks and GST Calculations.
        </p>

        <div className="mt-10 flex gap-4">
          <button className="rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-700">
            Start Free
          </button>

          <button className="rounded-xl border border-slate-300 bg-white px-8 py-4 font-semibold transition hover:bg-slate-100">
            Explore Tools
          </button>
        </div>

      </div>
    </section>
  );
}