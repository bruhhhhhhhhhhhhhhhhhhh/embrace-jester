export type LegalPlaceholder = `TODO: ${string}`;

type TextValue = string | LegalPlaceholder;
type NumericValue = number | LegalPlaceholder;

type LegalConfig = {
  brandName: string;
  legalEntityName: TextValue;
  legalFooterName: string;
  supportEmail: string;
  privacyEmail: string;
  marketingSenderName: string;
  marketingFromEmail: string;
  mailingAddressLine1: TextValue;
  mailingAddressLine2: string;
  city: TextValue;
  region: TextValue;
  postalCode: TextValue;
  country: TextValue;
  governingLawRegion: TextValue;
  governingLawCountry: TextValue;
  lastUpdatedTerms: string;
  lastUpdatedPrivacy: string;
  lastUpdatedCookies: string;
  lastUpdatedReturns: string;
  lastUpdatedShipping: string;
  lastUpdatedAccessibility: string;
  lastUpdatedReviewPolicy: string;
  supportResponseWindowBusinessDays: NumericValue;
  privacyRequestResponseWindowBusinessDays: NumericValue;
  reviewContactEmail: string;
  unsubscribePath: string;
  privacyChoicesPath: string;
  accessibilityPath: string;
  reviewPolicyPath: string;
  returnPolicy: {
    sizeExchangeWindowDays: number;
    defectReportWindowDays: number;
    conditionSummary: string;
    sizeExchangeEligibilitySummary: string;
    issueEligibilitySummary: string;
    finalSaleSummary: string;
    returnShippingSummary: string;
  };
  shippingPolicy: {
    processingWindowBusinessDays: string;
    standardTransitBusinessDays: string;
    expressTransitBusinessDays: string;
    estimatesDisclaimer: string;
  };
  marketingEmailComplianceNote: string;
};

export const legal = {
  brandName: "EMBRACE JESTER",
  legalEntityName: "Embrace Jester (no registered legal entity yet)",
  legalFooterName: "Embrace Jester",
  supportEmail: "support@embracejester.com",
  privacyEmail: "support@embracejester.com",
  marketingSenderName: "Embrace Jester",
  marketingFromEmail: "support@embracejester.com",
  mailingAddressLine1: "353 Davisville Avenue",
  mailingAddressLine2: "",
  city: "Toronto",
  region: "Ontario",
  postalCode: "M4S 1H1",
  country: "Canada",
  governingLawRegion: "Ontario",
  governingLawCountry: "Canada",
  lastUpdatedTerms: "March 23, 2026",
  lastUpdatedPrivacy: "March 23, 2026",
  lastUpdatedCookies: "March 23, 2026",
  lastUpdatedReturns: "March 23, 2026",
  lastUpdatedShipping: "March 23, 2026",
  lastUpdatedAccessibility: "March 23, 2026",
  lastUpdatedReviewPolicy: "March 23, 2026",
  supportResponseWindowBusinessDays: 1,
  privacyRequestResponseWindowBusinessDays: 5,
  reviewContactEmail: "support@embracejester.com",
  unsubscribePath: "/unsubscribe",
  privacyChoicesPath: "/privacy-choices",
  accessibilityPath: "/accessibility",
  reviewPolicyPath: "/review-policy",
  returnPolicy: {
    sizeExchangeWindowDays: 0,
    defectReportWindowDays: 30,
    conditionSummary:
      "For approved order-issue claims, include your order number and clear photos of the item and packaging when relevant.",
    sizeExchangeEligibilitySummary:
      "Returns and exchanges are not supported for wrong size, wrong color, or change of mind.",
    issueEligibilitySummary:
      "Damage, defect, or wrong-item reports must be submitted within 30 days of delivery.",
    finalSaleSummary:
      "All sales are final except approved claims for damage, defect, or incorrect items.",
    returnShippingSummary:
      "Approved defect claims do not require a return. We cover the replacement or reprint when the item arrives damaged, defective, or incorrect.",
  },
  shippingPolicy: {
    processingWindowBusinessDays: "1-3 business days",
    standardTransitBusinessDays: "3-6 business days after fulfillment",
    expressTransitBusinessDays: "1-2 business days after fulfillment where available",
    estimatesDisclaimer:
      "Shipping and delivery windows are estimates, not guaranteed delivery dates.",
  },
  marketingEmailComplianceNote:
    "Outbound marketing emails should be sent under Embrace Jester, include the mailing address above, and include a working unsubscribe link.",
} satisfies LegalConfig;

export const isLegalPlaceholder = (value: string | number): value is LegalPlaceholder =>
  typeof value === "string" && value.startsWith("TODO:");

export const formatLegalResponseWindow = (value: NumericValue, unitLabel = "business day") => {
  if (isLegalPlaceholder(value)) return value;
  return `${value} ${unitLabel}${value === 1 ? "" : "s"}`;
};

export const getMailingAddressLines = () => {
  const lines = [
    legal.legalFooterName,
    legal.mailingAddressLine1,
    legal.mailingAddressLine2,
    [legal.city, legal.region, legal.postalCode].filter(Boolean).join(", "),
    legal.country,
  ].filter(Boolean);

  return lines;
};

// Reminder for outbound marketing email templates and providers:
// include sender identity, a valid physical mailing address, and a working unsubscribe link.
