import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage, privacyHead } from "./privacy";

export const Route = createFileRoute("/privacy-policy")({
  head: privacyHead,
  component: PrivacyPage,
});