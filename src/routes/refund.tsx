import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/SiteFooter";

export const refundHead = () => ({
    meta: [
      { title: "Refund Policy — NihongoLevel" },
      {
        name: "description",
        content:
          "30-day money-back guarantee for NihongoLevel Pro. Refunds are processed by Paddle, our Merchant of Record.",
      },
      { property: "og:title", content: "Refund Policy — NihongoLevel" },
      {
        property: "og:description",
        content:
          "30-day money-back guarantee. Refunds handled by Paddle as our Merchant of Record.",
      },
      { property: "og:url", content: "/refund-policy" },
    ],
    links: [{ rel: "canonical", href: "/refund-policy" }],
  });

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund — NihongoLevel" },
      {
        name: "description",
        content:
          "NihongoLevel refund summary. See the full Refund Policy for the 30-day guarantee and Paddle processing details.",
      },
      { property: "og:title", content: "Refund — NihongoLevel (short alias)" },
      {
        property: "og:description",
        content:
          "Short alias for NihongoLevel's Refund Policy. View the full policy at /refund-policy.",
      },
      { property: "og:url", content: "/refund-policy" },
    ],
    links: [{ rel: "canonical", href: "/refund-policy" }],
  }),
  component: RefundPage,
});

export function RefundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link to="/" className="font-bold text-lg">
          Nihongo<span className="text-primary">Level</span>
        </Link>
        <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Back
        </Link>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-10 prose prose-sm dark:prose-invert">
        <h1>Refund Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <h2>30-day money-back guarantee</h2>
        <p>
          We want you to be happy with NihongoLevel Pro. If you're not satisfied with your purchase, you can request a <strong>full refund within 30 days</strong> of your order date — no questions asked.
        </p>

        <h2>How to request a refund</h2>
        <p>
          NihongoLevel uses <strong>Paddle.com</strong> as our Merchant of Record. Paddle handles all payments, invoices, and refunds.
        </p>
        <ul>
          <li>
            Go to <a href="https://paddle.net" target="_blank" rel="noopener noreferrer">paddle.net</a> and look up your order with the email address you used at checkout.
          </li>
          <li>
            Or contact us through the Service and we'll forward your request to Paddle.
          </li>
        </ul>
        <p>
          Approved refunds are returned to the original payment method. Processing time depends on your bank or card issuer (typically 3–10 business days).
        </p>

        <h2>One-time purchase, no renewals</h2>
        <p>
          NihongoLevel Pro is sold as a one-time purchase that grants lifetime access. There are no recurring charges, no automatic renewals, and nothing to cancel. If you want a refund within the 30-day window above, just contact us and we'll forward the request to Paddle.
        </p>

        <h2>What is not refundable</h2>
        <p>
          Refund requests made <strong>more than 30 days</strong> after the order date are reviewed on a case-by-case basis by Paddle and may be declined. Refunds may also be declined where there is evidence of fraud or serious breach of our{" "}
          <Link to="/terms-of-service">Terms of Service</Link>.
        </p>

        <h2>Your statutory rights</h2>
        <p>
          Nothing in this policy limits any statutory consumer-protection rights you may have where you live (for example, the EU/UK right to withdraw from a distance contract). Where those rights apply, they apply in addition to this policy.
        </p>

        <h2>Questions</h2>
        <p>
          For order and refund questions, contact Paddle at{" "}
          <a href="https://paddle.net" target="_blank" rel="noopener noreferrer">paddle.net</a>. For anything else, reach out to zaenal mutaqin through the Service.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
