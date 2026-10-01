import Hero from "@/components/home/Hero";
import Tools from "@/components/home/Tools";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    return (
      <main className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-6 mb-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Welcome back, {session.user?.name || session.user?.email || "User"}! 👋
              </h1>
              <p className="mt-2 text-slate-600">
                Select a tool below to start automating your GST tasks.
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/account"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                My Account
              </Link>
            </div>
          </div>
        </div>
        <Tools />
      </main>
    );
  }

  return (
    <>
      <Hero />

      {/* Features Section */}
      <section id="features" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-slate-900">
              Powerful Features
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Everything you need to automate your GST work
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-2xl bg-slate-50 p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-xl">💰</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Payment Matching</h3>
              <p className="mt-2 text-sm text-slate-600">
                Automatically match supplier payments using FIFO logic and calculate delayed payment interest
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                <span className="text-xl">🔍</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">GST Bulk Search</h3>
              <p className="mt-2 text-sm text-slate-600">
                Search multiple GSTINs in bulk and download comprehensive taxpayer & return filing reports
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                <span className="text-xl">📊</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">GSTR-2B Reconciliation</h3>
              <p className="mt-2 text-sm text-slate-600">
                Compare Purchase Register with GSTR-2B and identify mismatches instantly
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                <span className="text-xl">📋</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Return Filing Checker</h3>
              <p className="mt-2 text-sm text-slate-600">
                Check filing status of multiple GSTINs in one go and export the results
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                <span className="text-xl">🧮</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">GST Calculators</h3>
              <p className="mt-2 text-sm text-slate-600">
                Calculate GST late fees, interest, Rule 37 implications, and more
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-slate-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Simple 3-step process to automate your GST work
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                <span className="text-2xl">📤</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Step 1: Upload</h3>
              <p className="mt-3 text-slate-600">
                Upload your Excel files (XLSX or XLS format). We support single ledger and multi-ledger formats.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mb-6">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Step 2: Process</h3>
              <p className="mt-3 text-slate-600">
                Our system automatically processes your files using FIFO matching logic and calculates interest if applicable.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-6">
                <span className="text-2xl">📥</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Step 3: Download</h3>
              <p className="mt-3 text-slate-600">
                Download the processed file with matched entries, interest calculations, and highlighted delays.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA for logged out users */}
      {!session && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              Ready to get started?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Create a free account to access all our GST automation tools.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-700"
              >
                Get Started Free
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-8 py-4 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      )}

      <Tools />

      {/* Testimonials Section */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-slate-900">
              What Our Users Say
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Trusted by thousands of CAs, GST practitioners, and businesses
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xl">👨‍💼</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Rajesh Sharma, CA</h4>
                  <p className="text-sm text-slate-500">Delhi</p>
                </div>
              </div>
              <p className="text-slate-600">
                "GSTPoint Tools has saved me hours of manual work every month. The payment matching is accurate and the interest calculation is a lifesaver."
              </p>
              <div className="mt-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-xl">👩‍💼</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Priya Mehta, GST Practitioner</h4>
                  <p className="text-sm text-slate-500">Mumbai</p>
                </div>
              </div>
              <p className="text-slate-600">
                "I was spending days on GSTR-2B reconciliation. Now it takes me minutes. The accuracy is impressive and the interface is very easy to use."
              </p>
              <div className="mt-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-xl">🏢</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">ABC Enterprises</h4>
                  <p className="text-sm text-slate-500">Bangalore</p>
                </div>
              </div>
              <p className="text-slate-600">
                "We've been using GSTPoint Tools for our monthly GST filing. It's reduced errors and saved us money on late fees. Highly recommended!"
              </p>
              <div className="mt-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-4xl font-bold text-slate-900">
                Get In Touch
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Have questions or need help? We're here to assist you.
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <span className="text-xl">✉️</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Email</h4>
                    <p className="text-slate-600">support@gstpoint-tools.com</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <span className="text-xl">📞</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Phone</h4>
                    <p className="text-slate-600">+91 98765 43210</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <span className="text-xl">📍</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Address</h4>
                    <p className="text-slate-600">
                      123 GST Street, Business District<br />
                      New Delhi, India - 110001
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-slate-50 p-8 border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Send Us a Message</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                  <textarea
                    rows={4}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
