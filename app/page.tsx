import Hero from "@/components/home/Hero";
import Tools from "@/components/home/Tools";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

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

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
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

              <div className="mt-8 flex gap-4">
                <Link
                  href="#"
                  className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
                >
                  <span className="text-xl">f</span>
                </Link>
                <Link
                  href="#"
                  className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
                >
                  <span className="text-xl">in</span>
                </Link>
                <Link
                  href="#"
                  className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
                >
                  <span className="text-xl">X</span>
                </Link>
                <Link
                  href="#"
                  className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
                >
                  <span className="text-xl">ig</span>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-8">
              <h3 className="text-2xl font-bold text-slate-900">Send us a message</h3>
              <p className="mt-2 text-slate-600">
                Fill out the form and we'll get back to you as soon as possible.
              </p>

              <form className="mt-8 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block font-semibold text-slate-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="w-full rounded-xl border border-slate-200 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block font-semibold text-slate-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full rounded-xl border border-slate-200 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block font-semibold text-slate-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="w-full rounded-xl border border-slate-200 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Subject"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block font-semibold text-slate-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full rounded-xl border border-slate-200 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your message"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <h4 className="text-xl font-bold text-white mb-4">GSTPoint Tools</h4>
              <p className="text-slate-400">
                Professional GST Automation Platform for CAs, GST practitioners, and businesses.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Products</h4>
              <ul className="space-y-2">
                <li><Link href="/payment-matcher" className="text-slate-400 hover:text-white">Payment Matcher</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white">GSTR-2B Reconciliation</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white">Return Filing Checker</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white">GST Calculators</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link href="/pricing" className="text-slate-400 hover:text-white">Pricing</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white">Documentation</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white">Blog</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-slate-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white">Terms of Service</Link></li>
                <li><Link href="#" className="text-slate-400 hover:text-white">Refund Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-400">
            <p>© {new Date().getFullYear()} GSTPoint Tools. All rights reserved.</p>
            <p className="mt-2 text-sm">
              Made with ❤️ for GST professionals in India
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
