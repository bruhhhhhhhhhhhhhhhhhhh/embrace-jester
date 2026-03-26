import fs from 'node:fs';
import path from 'node:path';
import { legal, formatLegalResponseWindow, getMailingAddressLines } from '../src/config/legal';

type Section = {
  title?: string;
  paragraphs?: string[];
  bullets?: string[];
};

type PageDefinition = {
  route: string;
  title: string;
  description: string;
  intro?: string[];
  sections: Section[];
};

const repoRoot = process.cwd();
const distDir = path.join(repoRoot, 'dist');
const distIndexPath = path.join(distDir, 'index.html');

const legalLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/cookies', label: 'Cookies' },
  { href: '/terms', label: 'Terms' },
  { href: '/shipping', label: 'Shipping' },
  { href: '/returns', label: 'Returns & Exchanges' },
  { href: '/privacy-choices', label: 'Your Privacy Choices' },
  { href: '/accessibility', label: 'Accessibility' },
  { href: '/review-policy', label: 'Review Policy' },
  { href: '/contact', label: 'Contact' },
];

const addressLines = getMailingAddressLines();
const supportStatusNote = !legal.supportInboxOperational
  ? 'Mailbox activation is in progress. Confirm delivery before launch.'
  : '';

const pages: PageDefinition[] = [
  {
    route: '/cookies',
    title: 'Cookie Policy',
    description:
      'This policy explains which cookies and similar technologies are used, why they are used, and how to control them.',
    intro: [`Last updated: ${legal.lastUpdatedCookies}`],
    sections: [
      {
        title: 'What We Use',
        paragraphs: [
          'We use cookies and similar technologies, including local storage and session storage, to operate the site, maintain your cart and checkout state, remember consent choices, and measure performance when optional tracking is allowed.',
        ],
      },
      {
        title: 'Categories of Technologies',
        bullets: [
          'Essential technologies support site operation, cart state, checkout continuity, consent memory, and security.',
          'Optional analytics technologies support traffic measurement, funnel analysis, and campaign reporting when enabled.',
          'Optional advertising technologies support ad attribution, remarketing, and campaign performance reporting when enabled.',
        ],
      },
      {
        title: 'Consent Choices',
        bullets: [
          'You can choose Essential Only or allow optional tracking when prompted.',
          'Optional technologies are not required for cart, checkout, or order support.',
          'If your browser sends a Global Privacy Control signal and no saved choice exists, optional tracking defaults to off.',
          'You can revisit choices at any time at Your Privacy Choices.',
        ],
      },
      {
        title: 'Related Policies',
        paragraphs: [
          'See the Privacy Policy, Your Privacy Choices, and Terms of Service for related details.',
        ],
      },
    ],
  },
  {
    route: '/privacy',
    title: 'Privacy Policy',
    description:
      'This policy explains what information we collect, how we use it, when we share it, and what choices you have.',
    intro: [
      `Last updated: ${legal.lastUpdatedPrivacy}`,
      `This Privacy Policy applies to personal information collected through ${legal.brandName}, including when you browse the storefront, place an order, subscribe to email updates, request support, or submit a review.`,
    ],
    sections: [
      {
        title: 'Categories of Information We Collect',
        bullets: [
          'Identifiers and contact details such as name, email address, phone number, and shipping address.',
          'Order details including products, variants, quantities, shipping method, and transaction status.',
          'Payment metadata from our payment processor, such as payment intent or session references.',
          'Support and review information, including messages, ratings, review content, and any media you submit.',
          'Device, browser, referral, and usage information collected through essential site technologies and optional analytics tools.',
        ],
      },
      {
        title: 'Sources of Information',
        bullets: [
          'Directly from you through checkout, newsletter, support, and review forms.',
          'Automatically through cookies, local storage, and optional analytics or advertising tools when enabled.',
          'From service providers involved in payment processing, fulfillment, fraud prevention, and order delivery.',
        ],
      },
      {
        title: 'How We Use Information',
        bullets: [
          'Process payments, produce and deliver orders, and send service updates.',
          'Respond to support requests, review order issues, and prevent fraud or abuse.',
          'Operate and improve the storefront, catalog, checkout flow, and review systems.',
          'Send marketing emails if you subscribe, and honor unsubscribe requests.',
          'Measure traffic and campaign performance when optional tracking is allowed.',
        ],
      },
      {
        title: 'How We Share Information',
        bullets: [
          'Payment processors, shipping carriers, and service providers that help us process and deliver orders.',
          'Print-on-demand fulfillment providers that produce and ship made-to-order items through our fulfillment workflow via Printify.',
          'Infrastructure, analytics, email, support, and fraud-prevention vendors acting on our instructions.',
          'Authorities or legal counterparties when required by law or necessary to protect rights and safety.',
        ],
        paragraphs: [
          'We do not sell personal information for money. If optional advertising technologies are enabled, certain disclosures may be treated as sharing for cross-context behavioral advertising under some U.S. privacy laws.',
        ],
      },
      {
        title: 'Optional Analytics and Advertising',
        paragraphs: [
          'When enabled, optional technologies may include Google Analytics, Meta Pixel, and TikTok Pixel when those tools are configured for this storefront. They are used to understand traffic, campaign performance, and conversion.',
          'You can manage those choices at any time at Your Privacy Choices.',
        ],
      },
      {
        title: 'International Transfers',
        paragraphs: [
          'Some service providers, payment processors, carriers, and fulfillment partners may process information outside Canada. This can include providers involved in payment processing, analytics, customer communications, and made-to-order fulfillment.',
        ],
      },
      {
        title: 'Marketing Controls and Contact',
        paragraphs: [
          `Marketing emails can be stopped through the unsubscribe path at ${legal.unsubscribePath}.`,
          `Designated privacy contact: ${legal.privacyEmail}. Current privacy-request response window: ${formatLegalResponseWindow(legal.privacyRequestResponseWindowBusinessDays)}.`,
          supportStatusNote || '',
        ].filter(Boolean),
        bullets: addressLines,
      },
    ],
  },
  {
    route: '/terms',
    title: 'Terms Of Service',
    description: 'These terms govern your use of the storefront and any order placed through Embrace Jester.',
    intro: [
      `Last updated: ${legal.lastUpdatedTerms}`,
      `Store operator: ${legal.legalEntityName}`,
      'By using this site, creating an account, or placing an order, you agree to these Terms. If you do not agree, do not use the site.',
    ],
    sections: [
      {
        title: 'Products, Pricing, and Order Acceptance',
        bullets: [
          'Product images are illustrative. Color, print placement, and finish may vary.',
          'Prices, availability, and shipping options may change without notice.',
          'Orders may be refused or canceled for fraud risk, pricing error, configuration error, policy violation, or production constraints.',
        ],
      },
      {
        title: 'Made-To-Order Fulfillment',
        bullets: [
          'Products are made to order and fulfilled through third-party print providers via Printify.',
          'Fulfillment location may vary by product and customer destination.',
          'Products may ship in separate packages when produced at different facilities.',
          'Once production begins, edits or cancellations may no longer be available.',
        ],
      },
      {
        title: 'Shipping and Delivery',
        bullets: [
          `Current processing window: ${legal.shippingPolicy.processingWindowBusinessDays}.`,
          `Standard transit is typically ${legal.shippingPolicy.standardTransitBusinessDays}.`,
          `Express transit is typically ${legal.shippingPolicy.expressTransitBusinessDays}.`,
          legal.shippingPolicy.estimatesDisclaimer,
          'Cross-border shipments may involve international shipping charges, customs duties, or import taxes depending on origin and destination.',
        ],
      },
      {
        title: 'Returns, Exchanges, and Order Issues',
        bullets: [
          legal.returnPolicy.nonDefectReturnsSummary,
          legal.returnPolicy.defectIssueSummary,
          legal.returnPolicy.claimDocumentationSummary,
          legal.returnPolicy.approvedClaimsSummary,
          legal.returnPolicy.noReturnRequiredSummary,
        ],
      },
      {
        title: 'Governing Law and Contact',
        paragraphs: [
          `These Terms are governed by the laws of ${legal.governingLawRegion}, ${legal.governingLawCountry}, unless applicable consumer law requires otherwise.`,
          'Questions about these Terms should be directed through the Contact page or the support address listed there.',
        ],
      },
    ],
  },
  {
    route: '/shipping',
    title: 'Shipping',
    description: 'Products are made to order and fulfilled through third-party print providers. This page explains processing windows, transit estimates, and support options for delays.',
    intro: [`Last updated: ${legal.lastUpdatedShipping}`],
    sections: [
      {
        title: 'Processing Times',
        bullets: [
          'Products are made to order and fulfilled through third-party print providers via Printify.',
          'Fulfillment location may vary by product and destination.',
          `Most orders begin production within ${legal.shippingPolicy.processingWindowBusinessDays}.`,
          'Tracking updates are sent by email once the carrier scans the package.',
          'Large or high-volume drops may require longer production time.',
        ],
      },
      {
        title: 'Transit Estimates',
        bullets: [
          `Standard shipping: typically ${legal.shippingPolicy.standardTransitBusinessDays}.`,
          `Express shipping: typically ${legal.shippingPolicy.expressTransitBusinessDays}.`,
          'International transit varies by carrier, customs, and destination.',
        ],
        paragraphs: [legal.shippingPolicy.estimatesDisclaimer],
      },
      {
        title: 'Cross-Border Shipping',
        bullets: [
          'Because fulfillment location can vary, some orders may cross borders before delivery.',
          'International shipping charges, customs duties, import taxes, or brokerage fees may apply depending on origin and destination.',
        ],
      },
      {
        title: 'Delays and Support',
        bullets: [
          'Incorrect or incomplete addresses can delay delivery or require carrier correction.',
          'If a delay occurs before production starts, cancellation or refund requests are reviewed based on the order stage and applicable law.',
          'For delivery questions, use the Contact page or the support address listed there.',
        ],
      },
    ],
  },
  {
    route: '/returns',
    title: 'Returns & Exchanges',
    description: 'This policy explains how damage, defect, and wrong-item claims are handled for made-to-order apparel.',
    intro: [`Last updated: ${legal.lastUpdatedReturns}`],
    sections: [
      {
        title: 'Made-To-Order Products',
        paragraphs: ['Products are made to order. Returns and exchanges are not supported for wrong size, wrong color, or change of mind.'],
      },
      {
        title: 'Damaged, Defective, or Incorrect Items',
        bullets: [
          legal.returnPolicy.defectIssueSummary,
          legal.returnPolicy.claimDocumentationSummary,
          legal.returnPolicy.approvedClaimsSummary,
          legal.returnPolicy.noReturnRequiredSummary,
        ],
      },
      {
        title: 'Start A Request',
        paragraphs: ['Use the Contact page and include your order ID, request type, and any relevant photos.'],
      },
    ],
  },
  {
    route: '/privacy-choices',
    title: 'Your Privacy Choices',
    description: 'Manage optional analytics and advertising choices for this browser without affecting essential store functionality.',
    sections: [
      {
        title: 'Essential Site Functionality',
        paragraphs: ['Essential technologies keep your cart active, maintain checkout progress, remember consent choices, and support core account and security features. These functions remain available even if optional tracking is disabled.'],
      },
      {
        title: 'Optional Analytics and Advertising',
        paragraphs: ['Optional technologies may include analytics tools and advertising pixels for providers such as Google, Meta, and TikTok when configured. They are used to understand traffic, measure campaigns, and improve storefront performance.'],
        bullets: [
          'Essential Only disables optional analytics and advertising tracking for this browser.',
          'Allow Optional Tracking enables optional analytics and advertising tracking for this browser.',
          'Reset Saved Choice clears stored consent so you can decide again later.',
        ],
      },
      {
        title: 'Browser Preferences and Contact',
        paragraphs: [
          'If your browser sends a Global Privacy Control signal and no saved choice is present, optional tracking defaults to off in this browser.',
          `Designated privacy contact: ${legal.privacyEmail}. Current privacy-request response window: ${formatLegalResponseWindow(legal.privacyRequestResponseWindowBusinessDays)}.`,
          supportStatusNote || '',
        ].filter(Boolean),
      },
    ],
  },
  {
    route: '/accessibility',
    title: 'Accessibility',
    description: 'We are working to keep the storefront usable across keyboards, assistive technology, and a wide range of devices.',
    intro: [`Last updated: ${legal.lastUpdatedAccessibility}`],
    sections: [
      {
        title: 'Commitment',
        paragraphs: ['We want this storefront to be usable for as many people as possible. That includes people navigating by keyboard, screen reader, magnification tools, voice control, and other assistive technology.'],
      },
      {
        title: 'Ongoing Improvements',
        paragraphs: ['Accessibility work is ongoing. We review storefront interactions, text contrast, form controls, and navigation patterns as the site evolves.'],
      },
      {
        title: 'Report An Accessibility Issue',
        paragraphs: [
          `Designated accessibility contact: ${legal.supportEmail}. Current support response window: ${formatLegalResponseWindow(legal.supportResponseWindowBusinessDays)}.`,
          supportStatusNote || '',
        ].filter(Boolean),
      },
    ],
  },
  {
    route: '/review-policy',
    title: 'Review Policy',
    description: 'This policy explains what may be submitted, how reviews are moderated, and how review-related questions are handled.',
    intro: [`Last updated: ${legal.lastUpdatedReviewPolicy}`],
    sections: [
      {
        title: 'What You May Submit',
        paragraphs: ['Reviews should reflect your own experience with the product, order, or service. You may submit ratings, written comments, and any media the review flow allows.'],
      },
      {
        title: 'Moderation Standards',
        bullets: [
          'Spam, abuse, harassment, impersonation, illegal content, irrelevant content, manipulated media, or duplicated submissions may be rejected or removed.',
          'Content that discloses sensitive personal information may be removed.',
          'Truthful negative reviews are not removed only because they are negative.',
        ],
      },
      {
        title: 'Incentives, Editing, and Disputes',
        bullets: [
          'If a review is connected to an incentive, discount, or free product, that relationship must be disclosed clearly.',
          'Limited edits may be made for formatting, length, or privacy protection without changing the substance of a review.',
          'Questions about moderation decisions should be directed through the Contact page or the review contact listed there.',
        ],
        paragraphs: [supportStatusNote || ''].filter(Boolean),
      },
    ],
  },
  {
    route: '/contact',
    title: 'Contact',
    description: 'Use these channels for order support, fit questions, privacy requests, partnership requests, or wholesale inquiries.',
    sections: [
      {
        title: 'Customer Support',
        paragraphs: [
          `Designated support address: ${legal.supportEmail}.`,
          `Current response window: ${formatLegalResponseWindow(legal.supportResponseWindowBusinessDays)}.`,
          supportStatusNote || '',
        ].filter(Boolean),
      },
      {
        title: 'Privacy Requests',
        paragraphs: [
          `Designated privacy contact: ${legal.privacyEmail}.`,
          `Current privacy-request response window: ${formatLegalResponseWindow(legal.privacyRequestResponseWindowBusinessDays)}.`,
        ],
      },
      {
        title: 'Mailing Address',
        bullets: addressLines,
      },
      {
        title: 'Damage Claims',
        paragraphs: ['Please include order ID and supporting photos for damaged-item claims.'],
      },
    ],
  },
  {
    route: '/unsubscribe',
    title: 'Unsubscribe',
    description:
      'You can opt out of marketing emails at any time. Transactional order updates will still be sent when required.',
    sections: [
      {
        title: 'Marketing Email Preferences',
        paragraphs: [
          `Designated marketing sender: ${legal.marketingSenderName} via ${legal.marketingFromEmail}.`,
          'Use the live storefront form on this route to unsubscribe from marketing emails.',
          supportStatusNote || '',
        ].filter(Boolean),
      },
    ],
  },
];

const homepageFallback = {
  title: legal.brandName,
  description: 'Legal and support links are available below. Products are made to order and fulfilled through third-party print providers via Printify.',
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const anchor = (href: string, label: string) =>
  `<a href="${href}" style="color:#f3f4f6;text-decoration:underline;text-underline-offset:2px;">${escapeHtml(label)}</a>`;

const renderLegalNav = () =>
  `<nav aria-label="Legal links" style="display:flex;flex-wrap:wrap;gap:12px 18px;margin-top:20px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">${legalLinks
    .map((item) => anchor(item.href, item.label))
    .join('')}</nav>`;

const renderSections = (sections: Section[]) =>
  sections
    .map((section) => {
      const title = section.title
        ? `<h2 style="margin:24px 0 10px;font-size:15px;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;">${escapeHtml(section.title)}</h2>`
        : '';
      const paragraphs = (section.paragraphs ?? [])
        .filter(Boolean)
        .map(
          (paragraph) =>
            `<p style="margin:10px 0;color:#d4d4d4;line-height:1.7;">${escapeHtml(paragraph).replace(/Your Privacy Choices/g, '<a href="/privacy-choices" style="color:#f3f4f6;text-decoration:underline;text-underline-offset:2px;">Your Privacy Choices</a>').replace(/Contact page/g, '<a href="/contact" style="color:#f3f4f6;text-decoration:underline;text-underline-offset:2px;">Contact page</a>').replace(/Privacy Policy/g, '<a href="/privacy" style="color:#f3f4f6;text-decoration:underline;text-underline-offset:2px;">Privacy Policy</a>')}</p>`
        )
        .join('');
      const bullets = section.bullets?.length
        ? `<ul style="margin:10px 0 0;padding-left:20px;color:#d4d4d4;line-height:1.7;">${section.bullets
            .map((bullet) => `<li style="margin:8px 0;">${escapeHtml(bullet)}</li>`)
            .join('')}</ul>`
        : '';
      return `${title}${paragraphs}${bullets}`;
    })
    .join('');

const renderPageMarkup = (page: PageDefinition) => {
  const intro = (page.intro ?? [])
    .map((paragraph) => `<p style="margin:10px 0;color:#d4d4d4;line-height:1.7;">${escapeHtml(paragraph)}</p>`)
    .join('');

  return `
    <div style="min-height:100vh;background:#050505;color:#f3f4f6;font-family:ui-sans-serif,system-ui,sans-serif;">
      <div style="border-bottom:1px solid #262626;background:#000;padding:12px 20px;text-align:center;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">Legal Information</div>
      <main style="max-width:1040px;margin:0 auto;padding:32px 16px 64px;">
        <section style="border:1px solid #262626;background:#050505;padding:24px;">
          <p style="margin:0;color:#a3a3a3;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;">Legal</p>
          <h1 style="margin:16px 0 8px;color:#ffffff;font-size:34px;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(page.title)}</h1>
          <p style="margin:0;max-width:760px;color:#a3a3a3;line-height:1.7;">${escapeHtml(page.description)}</p>
        </section>
        <section style="margin-top:20px;border:1px solid #262626;background:#050505;padding:24px;">
          ${intro}
          ${renderSections(page.sections)}
          ${renderLegalNav()}
        </section>
      </main>
    </div>
  `;
};

const renderHomeFallback = () => `
  <div style="min-height:100vh;background:#050505;color:#f3f4f6;font-family:ui-sans-serif,system-ui,sans-serif;">
    <main style="max-width:1040px;margin:0 auto;padding:48px 16px 64px;">
      <section style="border:1px solid #262626;background:#050505;padding:24px;">
        <p style="margin:0;color:#a3a3a3;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;">${escapeHtml(legal.brandName)}</p>
        <h1 style="margin:16px 0 8px;color:#ffffff;font-size:34px;letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(homepageFallback.title)}</h1>
        <p style="margin:0;max-width:760px;color:#a3a3a3;line-height:1.7;">${escapeHtml(homepageFallback.description)}</p>
      </section>
      <section style="margin-top:20px;border:1px solid #262626;background:#050505;padding:24px;">
        <h2 style="margin:0 0 10px;font-size:15px;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;">Legal and Support Links</h2>
        <p style="margin:10px 0;color:#d4d4d4;line-height:1.7;">These pages are published as directly accessible static routes so their legal and support content remains publicly reachable even before the storefront app hydrates.</p>
        ${renderLegalNav()}
      </section>
    </main>
  </div>
`;

const withRootContent = (html: string, rootContent: string) =>
  html.replace('<div id="root"></div>', `<div id="root">${rootContent}</div>`);

const withHeadMeta = (html: string, title: string, description: string) => {
  const fullTitle = title === legal.brandName ? title : `${title} | ${legal.brandName}`;

  return html
    .replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(fullTitle)}</title>`)
    .replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/>/i,
      `<meta name="description" content="${escapeHtml(description)}" />`
    )
    .replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/i,
      `<meta property="og:title" content="${escapeHtml(fullTitle)}" />`
    )
    .replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/i,
      `<meta property="og:description" content="${escapeHtml(description)}" />`
    );
};

if (!fs.existsSync(distIndexPath)) {
  throw new Error(`Missing build output: ${distIndexPath}`);
}

const indexTemplate = fs.readFileSync(distIndexPath, 'utf8');
const homepageHtml = withHeadMeta(withRootContent(indexTemplate, renderHomeFallback()), homepageFallback.title, homepageFallback.description);
fs.writeFileSync(distIndexPath, homepageHtml);

for (const page of pages) {
  const routeDir = path.join(distDir, page.route.replace(/^\//, ''));
  fs.mkdirSync(routeDir, { recursive: true });
  const pageHtml = withHeadMeta(withRootContent(indexTemplate, renderPageMarkup(page)), page.title, page.description);
  fs.writeFileSync(path.join(routeDir, 'index.html'), pageHtml);
}

console.log(`Prerendered ${pages.length} legal routes plus homepage crawlable fallback.`);
