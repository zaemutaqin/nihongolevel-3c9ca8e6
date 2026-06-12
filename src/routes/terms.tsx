import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter } from "@/components/SiteFooter";

export const termsHead = () => ({
    meta: [
      { title: "Terms of Service — NihongoLevel" },
      {
        name: "description",
        content:
          "Terms of Service for NihongoLevel: rules for using the service, payment terms, and Paddle as Merchant of Record.",
      },
      { property: "og:title", content: "Terms of Service — NihongoLevel" },
      {
        property: "og:description",
        content:
          "The rules and conditions for using NihongoLevel, operated by zaenal mutaqin.",
      },
      { property: "og:url", content: "/terms-of-service" },
    ],
    links: [{ rel: "canonical", href: "/terms-of-service" }],
  });

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — NihongoLevel" },
      {
        name: "description",
        content:
          "NihongoLevel terms summary. See the full Terms of Service for usage rules and Paddle payment details.",
      },
      { property: "og:title", content: "Terms — NihongoLevel (short alias)" },
      {
        property: "og:description",
        content:
          "Short alias for NihongoLevel's Terms of Service. View the full document at /terms-of-service.",
      },
      { property: "og:url", content: "/terms-of-service" },
    ],
    links: [{ rel: "canonical", href: "/terms-of-service" }],
  }),
  component: TermsPage,
});

export function TermsPage() {
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
        <h1>Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <h2>1. Who we are</h2>
        <p>
          NihongoLevel ("the Service") is provided by <strong>zaenal mutaqin</strong> ("we", "us", "our"). By using the Service you are entering into a contract with zaenal mutaqin.
        </p>

        <h2>2. Acceptance of these terms</h2>
        <p>
          By creating an account or continuing to use the Service you agree to these Terms. If you do not agree, do not use the Service. We may update these Terms; continued use after an update means you accept the new Terms.
        </p>

        <h2>3. Eligibility and your account</h2>
        <p>
          You must be of legal age in your jurisdiction (or have permission from a parent/guardian) to use the Service. You are responsible for keeping your login credentials confidential and for any activity under your account. You must provide accurate information and keep it up to date.
        </p>

        <h2>4. What the Service is</h2>
        <p>
          NihongoLevel is a Japanese-language learning tool that lets you look up natural Japanese expressions, save favorites, review your history, and practice. Pro plans unlock additional features such as unlimited searches, full history, favorites, dashboard, and daily practice.
        </p>

        <h2>5. Acceptable use</h2>
        <p>You must not:</p>
        <ul>
          <li>Use the Service for any unlawful purpose, fraud, or to send spam.</li>
          <li>Infringe anyone's intellectual property or privacy.</li>
          <li>Interfere with the security of the Service — no malware, probing, scraping, reverse engineering, or attempting to bypass technical limits.</li>
          <li>Resell, redistribute, or sublicense the Service or its content.</li>
        </ul>

        <h2>6. Intellectual property</h2>
        <p>
          We retain all rights, title, and interest in the Service, including the software, content, branding, and documentation. We grant you a limited, non-exclusive, non-transferable right to use the Service within the plan you have signed up for.
        </p>

        <h2>7. Payments and Merchant of Record</h2>
        <p>
          Our order process is conducted by our online reseller <strong>Paddle.com</strong>. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns. Payment, billing, tax, and refund mechanics are governed by Paddle's{" "}
          <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer">Buyer Terms</a>.
        </p>
        <p>
          NihongoLevel Pro is sold as a one-time purchase that grants lifetime access to Pro features for the purchasing account. There are no recurring charges, no renewals, and no automatic billing. Prices, fees, and applicable taxes are shown at checkout.
        </p>

        <h2>8. Refunds</h2>
        <p>
          See our <Link to="/refund-policy">Refund Policy</Link>. Refunds are processed by Paddle.
        </p>

        <h2>9. Service availability and content accuracy</h2>
        <p>
          We work hard to keep the Service running, but we do not guarantee that it will be uninterrupted, error-free, or always accurate. Translations and example sentences are provided for learning purposes and may contain mistakes — please verify with a native speaker for anything important. To the fullest extent permitted by law we disclaim all implied warranties, including merchantability and fitness for a particular purpose.
        </p>

        <h2>10. AI-generated content</h2>
        <p>
          The Service uses AI models to generate Japanese expressions, translations, and explanations. Outputs may be inaccurate or inappropriate and are not a substitute for professional advice. You are responsible for how you use outputs and for verifying anything you rely on. Do not use the Service to generate illegal content, hate speech, deepfakes, malware, or to jailbreak the AI. We may remove content, filter outputs, or suspend accounts that violate these rules.
        </p>

        <h2>11. Suspension and termination</h2>
        <p>
          We may suspend or terminate your access if you materially breach these Terms, fail to pay, pose a security or fraud risk, or seriously or repeatedly violate our policies. You may stop using the Service at any time. When access ends, your locally-stored data on your device remains yours; cloud-stored data will be deleted in accordance with our <Link to="/privacy-policy">Privacy Policy</Link>.
        </p>

        <h2>12. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, our aggregate liability arising out of or relating to the Service is limited to the fees you paid us in the 12 months before the claim. We are not liable for indirect, incidental, special, or consequential damages, including loss of profits, data, or goodwill. Nothing in these Terms limits liability that cannot be limited by law (e.g. fraud, death, or personal injury caused by negligence).
        </p>

        <h2>13. Indemnity</h2>
        <p>
          You agree to indemnify and hold us harmless from any claim arising out of your content, your unlawful use of the Service, or your breach of these Terms.
        </p>

        <h2>14. Governing law</h2>
        <p>
          These Terms are governed by the laws of Indonesia. Disputes will be submitted to the competent courts in Indonesia, without prejudice to mandatory consumer-protection rights you may have where you live.
        </p>

        <h2>15. Changes and assignment</h2>
        <p>
          We may update these Terms from time to time. You may not assign your rights under these Terms without our consent; we may assign our rights in connection with a merger, acquisition, or sale of assets.
        </p>

        <h2>16. Contact</h2>
        <p>
          Questions about these Terms? For order and billing questions, contact Paddle via{" "}
          <a href="https://paddle.net" target="_blank" rel="noopener noreferrer">paddle.net</a>. For everything else, reach out to zaenal mutaqin through the Service.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
