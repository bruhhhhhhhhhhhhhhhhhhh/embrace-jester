export type LegalPlaceholder = `TODO: ${string}`;

type TextValue = string | LegalPlaceholder;
type NumericValue = number | LegalPlaceholder;

type LegalConfig = {
  brandName: string;
  legalEntityName: TextValue;
  legalFooterName: string;
  supportEmail: string;
  privacyEmail: string;
  supportInboxOperational: boolean;
  supportInboxActivationTodo: string;
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
    defectReportWindowDays: number;
    nonDefectReturnsSummary: string;
    defectIssueSummary: string;
    claimDocumentationSummary: string;
    approvedClaimsSummary: string;
    noReturnRequiredSummary: string;
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
  brandName: "Embrace Jester",
  legalEntityName: "No registered legal entity yet. Operating under the brand name Embrace Jester.",
  legalFooterName: "Embrace Jester",
  supportEmail: "support@embracejester.com",
  privacyEmail: "support@embracejester.com",
  supportInboxOperational: false,
  supportInboxActivationTodo:
    "TODO: Confirm support@embracejester.com mailbox activation before public launch and replace mailbox-in-setup notes once live.",
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
  lastUpdatedTerms: "March 25, 2026",
  lastUpdatedPrivacy: "March 25, 2026",
  lastUpdatedCookies: "March 25, 2026",
  lastUpdatedReturns: "March 25, 2026",
  lastUpdatedShipping: "March 25, 2026",
  lastUpdatedAccessibility: "March 25, 2026",
  lastUpdatedReviewPolicy: "March 25, 2026",
  supportResponseWindowBusinessDays: 5,
  privacyRequestResponseWindowBusinessDays: 5,
  reviewContactEmail: "support@embracejester.com",
  unsubscribePath: "/unsubscribe",
  privacyChoicesPath: "/privacy-choices",
  accessibilityPath: "/accessibility",
  reviewPolicyPath: "/review-policy",
  returnPolicy: {
    defectReportWindowDays: 30,
    nonDefectReturnsSummary:
      "Returns and exchanges are not supported for wrong size, wrong color, or change of mind.",
    defectIssueSummary:
      "Damage, defect, or wrong-item reports must be submitted within 30 days of delivery.",
    claimDocumentationSummary:
      "For approved order-issue claims, include your order number and clear photos of the item and packaging when relevant.",
    approvedClaimsSummary:
      "Approved defect or wrong-item claims may be resolved with a replacement, reprint, or refund.",
    noReturnRequiredSummary:
      "No return is required for approved defect or wrong-item claims.",
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
// Support inbox status:
// support@embracejester.com is the designated public contact address, but mailbox activation
// should be confirmed before launch so customer-facing copy does not overstate inbox availability.
