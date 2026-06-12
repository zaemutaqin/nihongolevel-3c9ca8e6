import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/SiteFooter";

export const privacyHead = () => ({
  meta: [
    { title: "Privacy Policy — NihongoLevel" },
    {
      name: "description",
      content:
        "How NihongoLevel collects, uses, and shares your data, including Paddle as Merchant of Record, and your rights.",
    },
    { property: "og:title", content: "Privacy Policy — NihongoLevel" },
    {
      property: "og:description",
      content:
        "How NihongoLevel handles your personal data, including data sharing with Paddle as our Merchant of Record.",
    },
    { property: "og:url", content: "/privacy-policy" },
  ],
  links: [{ rel: "canonical", href: "/privacy-policy" }],
});

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — NihongoLevel" },
      {
        name: "description",
        content:
          "NihongoLevel privacy summary. See the full Privacy Policy for data collection, Paddle billing, and your rights.",
      },
      { property: "og:title", content: "Privacy — NihongoLevel (short alias)" },
      {
        property: "og:description",
        content:
          "Short alias for NihongoLevel's Privacy Policy. View the full policy at /privacy-policy.",
      },
      { property: "og:url", content: "/privacy-policy" },
    ],
    links: [{ rel: "canonical", href: "/privacy-policy" }],
  }),
  component: PrivacyPage,
});

export function PrivacyPage() {
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
        <h1>Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <h2>1. Who is the data controller</h2>
        <p>
          NihongoLevel ("the Service") is provided by <strong>zaenal mutaqin</strong>. zaenal mutaqin is the data controller for personal data processed through the Service and decides why and how it is processed.
        </p>

        <h2>2. What personal data we collect</h2>
        <ul>
          <li><strong>Account data</strong> — your name, email address, profile picture, and the Google account identifier when you sign in with Google.</li>
          <li><strong>Service content</strong> — the searches you make, expressions you save as favorites, your search history, your practice / review activity, and your Pro status.</li>
          <li><strong>Technical data</strong> — IP address, device and browser information, and timestamps, used for security, rate limiting, and abuse prevention.</li>
          <li><strong>Support messages</strong> — anything you send us when contacting us for help.</li>
          <li><strong>Analytics</strong> — aggregated usage information about pages visited and features used.</li>
        </ul>
        <p>
          Payment information (card number, billing address) is collected directly by Paddle, our Merchant of Record. We do not see or store your full payment details.
        </p>

        <h2>3. Why we use your data (purposes)</h2>
        <ul>
          <li><strong>Provide the Service</strong> — create your account, deliver translations and saved content, sync between devices, manage your Pro entitlement.</li>
          <li><strong>Security and abuse prevention</strong> — rate limit, detect fraud, keep audit logs.</li>
          <li><strong>Customer support</strong> — answer your questions.</li>
          <li><strong>Improve the product</strong> — analyse aggregated usage to make the Service better.</li>
          <li><strong>Legal compliance</strong> — meet our legal and tax obligations.</li>
        </ul>

        <h2>4. Legal basis</h2>
        <p>We process personal data under one or more of the following legal bases:</p>
        <ul>
          <li><strong>Performance of a contract</strong> — to provide the Service you signed up for.</li>
          <li><strong>Legitimate interests</strong> — to keep the Service secure, prevent abuse, and improve it.</li>
          <li><strong>Consent</strong> — for optional things like marketing communications, where applicable.</li>
          <li><strong>Legal obligation</strong> — to comply with applicable law.</li>
        </ul>

        <h2>5. Who we share data with</h2>
        <ul>
          <li><strong>Paddle.com</strong> — our Merchant of Record. Paddle receives data necessary to process payments, manage subscriptions, handle taxes, issue invoices, and provide order/refund support. See <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer">Paddle's Privacy Notice</a>.</li>
          <li><strong>Hosting and infrastructure providers</strong> — Lovable Cloud (database, authentication, file storage) and Cloudflare (edge network and serverless runtime).</li>
          <li><strong>AI providers</strong> — Google (Gemini) and the Lovable AI Gateway, which process the text of your searches to generate translations and explanations.</li>
          <li><strong>Analytics providers</strong> — to understand aggregated usage.</li>
          <li><strong>Professional advisers</strong> — legal, accounting, and tax advisers when reasonably necessary.</li>
          <li><strong>Authorities</strong> — where required by law, court order, or to protect rights, property, or safety.</li>
        </ul>
        <p>
          We do not sell your personal data.
        </p>

        <h2>6. International transfers</h2>
        <p>
          Some of our providers are based outside your country, including in the United States and the European Economic Area. Where personal data is transferred internationally, we rely on appropriate safeguards such as Standard Contractual Clauses or equivalent mechanisms used by our providers.
        </p>

        <h2>7. Data retention</h2>
        <p>
          We keep account and Service-content data for as long as your account is active. If you delete your account, we delete or anonymise associated personal data within a reasonable period, except where we must keep it longer to meet a legal, tax, or accounting obligation, to resolve disputes, or to enforce our agreements. Security and audit logs are kept for a limited period and then deleted.
        </p>

        <h2>8. Your rights</h2>
        <p>
          Subject to applicable law, you have the right to: access your personal data; correct it; request deletion; restrict or object to certain processing; receive a portable copy; and withdraw consent at any time where processing is based on consent. If you are in the UK or EEA, you also have the right to lodge a complaint with your local supervisory authority. We will respond to verified requests within the period required by applicable law (typically one month under GDPR).
        </p>
        <p>To exercise these rights, contact us through the Service.</p>

        <h2>9. Security</h2>
        <p>
          We use appropriate technical and organisational measures to protect personal data, including encryption in transit, access controls, audit logging, and row-level security on our database. No system is perfectly secure; please use a strong, unique password and protect your Google account.
        </p>

        <h2>10. Cookies and similar technologies</h2>
        <p>
          The Service uses cookies and local storage that are <strong>essential</strong> for it to work (for example, to keep you signed in and remember your language preference). We may also use limited analytics cookies to understand aggregated usage. You can manage cookies in your browser settings; disabling essential cookies will break parts of the Service.
        </p>

        <h2>11. Children</h2>
        <p>
          The Service is not directed at children under 13 (or the equivalent minimum age in your country). If you believe a child has provided us with personal data without parental consent, please contact us so we can delete it.
        </p>

        <h2>12. Changes</h2>
        <p>
          We may update this Privacy Policy from time to time. Material changes will be communicated through the Service. The "Last updated" date at the top shows when this policy was last revised.
        </p>

        <h2>13. Contact</h2>
        <p>
          For privacy questions or to exercise your rights, contact zaenal mutaqin through the Service. For order and billing privacy questions, contact Paddle at{" "}
          <a href="https://paddle.net" target="_blank" rel="noopener noreferrer">paddle.net</a>.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}

