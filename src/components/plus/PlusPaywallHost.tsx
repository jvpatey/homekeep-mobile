import React from "react";
import { useSubscription } from "../../context/SubscriptionContext";
import { PlusPaywallSheet } from "./PlusPaywallSheet";

export function PlusPaywallHost() {
  const { paywallEmbeds } = useSubscription();
  if (paywallEmbeds > 0) return null;
  return <PlusPaywallSheet />;
}
