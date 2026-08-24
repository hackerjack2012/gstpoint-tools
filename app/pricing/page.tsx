"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { CheckIcon } from "lucide-react";

export default function PricingPage() {
  const { data: session } = useSession();

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "₹0",
      period: "/month",
      description: "Get started with basic features",
      features: [
        "Up to 5 file processing per month",
        "Single Ledger Matching",
        "Basic support via email",
        "Standard processing speed",
      ],
      cta: "Get Started",
      popular: false,
      color: "slate",
    },
    {
      id: "pro",
      name: "Professional",
      price: "₹499",
      period: "/month",
      description: "For growing businesses and practitioners",
      features: [
        "Unlimited file processing",
        "Single & Multi Ledger Matching",
        "GSTR-2B Reconciliation",
        "Return Filing Checker",
        "GST Calculators",
        "Priority support",
        "Faster processing",
        "Download reports",
      ],
      cta: "Subscribe Now",
      popular: true,
      color: "blue",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "₹1499",
      period: "/month",
      description: "For large teams and organizations",
      features: [
        "Everything in Professional",
        "Team collaboration (up to 5 users)",
        "API access for custom integrations",
        "Custom report templates",
        "Dedicated account manager",
        "24/7 priority support",
        "Onboarding assistance",
        "Bulk processing",
      ],
      cta: "Contact Sales",
      popular: false,
      color: "purple",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          border: "border-blue-500",
          ring: "ring-blue-100",
          bg: "bg-blue-600",
          hover: "hover:bg-blue-700",
          text: "text-blue-700",
          bgLight: "bg-blue-50",
        };
      case "purple":
        return {
          border: "border-purple-500",
          ring: "ring-purple-100",
          bg: "bg-purple-600",
          hover: "hover:bg-purple-700",
          text: "text-purple-700",
          bgLight: "bg-purple-50",
        };
      default:
        return {
          border: "border-slate-300",
          ring: "ring-slate-100",
          bg: "bg-slate-600",
          hover: "hover:bg-slate-700",
          text: "text-slate-700",
          bgLight: "bg-slate-50",
        };
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-bold text-slate-900">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Choose the plan that fits your needs. All plans include our core GST automation tools.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            *All prices are in Indian Rupees (INR)
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {plans.map((plan) => {
            const colors = getColorClasses(plan.color);
            return (
              <div
                key={plan.id}
                className={`rounded-3xl bg-white p-8 shadow-lg border-2 ${
                  plan.popular
                    ? `${colors.border} ring-4 ${colors.ring}`
                    : "border-transparent"
                }`}
              >
                {plan.popular && (
                  <div className={`inline-flex items-center gap-2 rounded-full ${colors.bgLight} px-4 py-1 text-sm font-semibold ${colors.text} mb-4`}>
                    Most Popular
                  </div>
                )}

                <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                <p className="mt-2 text-slate-600">{plan.description}</p>

                <div className="mt-6">
                  <span className="text-5xl font-extrabold text-slate-900">
                    {plan.price}
                  </span>
                  <span className="text-lg text-slate-500">{plan.period}</span>
                </div>

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckIcon className="h-5 w-5 text-green-500 shrink-0" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {session ? (
                    <Link
                      href={plan.id === "enterprise" ? "/contact" : "/account"}
                      className={`w-full block text-center rounded-xl py-4 text-lg font-semibold transition ${
                        plan.popular
                          ? `${colors.bg} text-white ${colors.hover}`
                          : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <Link
                      href="/auth/signup"
                      className={`w-full block text-center rounded-xl py-4 text-lg font-semibold transition ${
                        plan.popular
                          ? `${colors.bg} text-white ${colors.hover}`
                          : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Methods */}
        <div className="mt-20 bg-white rounded-3xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-slate-900 text-center">
            Payment Methods
          </h2>
          <p className="mt-4 text-lg text-slate-600 text-center">
            We accept multiple payment methods for your convenience
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
                <span className="text-3xl">💳</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Credit/Debit Card</h3>
              <p className="mt-2 text-slate-600">
                Visa, Mastercard, Rupay, and more
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">UPI / QR Code</h3>
              <p className="mt-2 text-slate-600">
                Scan and pay instantly with any UPI app
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
                <span className="text-3xl">🏦</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Net Banking</h3>
              <p className="mt-2 text-slate-600">
                Direct bank transfer from your account
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-slate-900 text-center">
            Frequently Asked Questions
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Can I try before I buy?
              </h3>
              <p className="mt-2 text-slate-600">
                Yes! Our Free plan lets you process up to 5 files per month with basic features. No credit card required.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Can I upgrade or downgrade my plan?
              </h3>
              <p className="mt-2 text-slate-600">
                Absolutely! You can change your plan at any time from your account settings. Changes take effect immediately.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Is my data secure?
              </h3>
              <p className="mt-2 text-slate-600">
                Yes, we take data security seriously. All your files are processed securely and stored encrypted in our database.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Do you offer support?
              </h3>
              <p className="mt-2 text-slate-600">
                Yes! Free plan includes basic email support, Professional includes priority support, and Enterprise includes dedicated support.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                How do I pay using QR code?
              </h3>
              <p className="mt-2 text-slate-600">
                After selecting your plan, you'll see a QR code. Simply scan it with any UPI app (PhonePe, Google Pay, Paytm, etc.) to complete payment.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Can I get an invoice?
              </h3>
              <p className="mt-2 text-slate-600">
                Yes, GST invoices are automatically generated for all paid subscriptions and sent to your registered email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
