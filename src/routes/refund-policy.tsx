import { createFileRoute } from "@tanstack/react-router";
import { RefundPage, refundHead } from "./refund";

export const Route = createFileRoute("/refund-policy")({
  head: refundHead,
  component: RefundPage,
});