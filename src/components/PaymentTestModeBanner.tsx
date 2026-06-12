import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;
  return (
    <div className="w-full bg-orange-50 dark:bg-orange-950/30 border-b border-orange-200/60 dark:border-orange-900/40 px-4 py-1 text-center text-[11px] text-orange-700 dark:text-orange-300">
      Test mode — preview payments use sandbox cards.{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        Learn about test payments
      </a>
    </div>
  );
}
