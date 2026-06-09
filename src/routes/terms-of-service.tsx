import { createFileRoute } from "@tanstack/react-router";
import { TermsPage, termsHead } from "./terms";

export const Route = createFileRoute("/terms-of-service")({
  head: termsHead,
  component: TermsPage,
});