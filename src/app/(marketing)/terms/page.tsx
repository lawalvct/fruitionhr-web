import Link from "next/link";

import { site } from "@/lib/site";
import { LegalList, LegalPage } from "@/features/marketing/legal-page";

export const metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of FruitionHR — subscriptions, trials, billing, data ownership, acceptable use and support.",
};

/*
 * Plain-language commercial terms for the SaaS subscription. Keep the section
 * ids stable — support replies and the registration consent checkbox link
 * straight to them.
 *
 * TODO(legal): replace "FruitionHR" with the registered entity name and RC
 * number once incorporation details are confirmed, and have counsel review
 * before the first paid customer signs.
 */
export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      updatedAt="28 August 2026"
      intro={
        <>
          <p>
            These terms are an agreement between FruitionHR
            (&ldquo;FruitionHR&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) and
            the company that creates a workspace on our platform
            (&ldquo;you&rdquo;, &ldquo;your company&rdquo;). They cover how the
            service is provided, what you pay, and what each of us is
            responsible for.
          </p>
          <p>
            By creating an account, or by using FruitionHR on behalf of your
            employer, you accept these terms and confirm you are authorised to
            accept them for that company.
          </p>
        </>
      }
      sections={[
        {
          id: "service",
          heading: "The service",
          body: (
            <>
              <p>
                FruitionHR is a hosted HR and payroll platform. Depending on
                your plan it covers employee records, attendance, leave, payroll
                with Nigerian statutory calculations (PAYE, Pension, NHF,
                NSITF), approvals, recruitment, performance and reporting.
              </p>
              <p>
                We improve the platform continuously. Features may be added,
                changed or retired; where a change materially reduces
                functionality you rely on, we will tell you in advance.
              </p>
            </>
          ),
        },
        {
          id: "accounts",
          heading: "Your workspace and users",
          body: (
            <>
              <p>
                The person who registers your company becomes the workspace
                owner and can invite users and assign roles. Your company is
                responsible for everything done under its workspace, including
                actions by its employees and administrators.
              </p>
              <LegalList
                items={[
                  "Keep credentials confidential — accounts are personal and must not be shared.",
                  "Remove access promptly when someone leaves your organisation.",
                  <>
                    Tell us immediately at{" "}
                    <a
                      href={`mailto:${site.contactEmail}`}
                      className="font-medium text-fruition-700 underline underline-offset-4"
                    >
                      {site.contactEmail}
                    </a>{" "}
                    if you suspect unauthorised access.
                  </>,
                  "Salary visibility is a separate permission — grant it deliberately.",
                ]}
              />
            </>
          ),
        },
        {
          id: "trial-and-fees",
          heading: "Trial, subscriptions and fees",
          body: (
            <>
              <p>
                Every plan begins with a 30-day free trial — long enough to run
                a full monthly payroll cycle. No card is required to start.
              </p>
              <LegalList
                items={[
                  "Subscriptions are billed monthly in Naira, per employee on your books during that billing month, subject to your plan's minimum seat count.",
                  "Employees who have exited stop counting from the following billing month; their records remain archived and accessible.",
                  "Prices exclude any applicable taxes or levies, which are added where the law requires.",
                  "We may change pricing with at least 30 days' notice; changes take effect at your next renewal.",
                ]}
              />
              <p>
                Current plans and prices are on the{" "}
                <Link
                  href="/pricing"
                  className="font-medium text-fruition-700 underline underline-offset-4"
                >
                  pricing page
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          id: "non-payment",
          heading: "Late payment and suspension",
          body: (
            <p>
              If an invoice is unpaid after its due date, your workspace becomes
              read-only: you can still sign in, view every record, and export
              your data including payslips, but changes are paused until the
              balance is settled. We do not delete your records because of
              non-payment, and the billing page always stays reachable.
            </p>
          ),
        },
        {
          id: "cancellation",
          heading: "Cancellation and termination",
          body: (
            <>
              <p>
                You may cancel at any time. Cancellation takes effect at the end
                of the period you have already paid for, and you keep full
                access until then. Fees already paid are not refunded for the
                unused part of a period unless the law requires otherwise.
              </p>
              <p>
                We may suspend or terminate a workspace that breaches these
                terms, poses a security risk, or is used unlawfully. Except in
                urgent cases we will give notice and a chance to put things
                right.
              </p>
            </>
          ),
        },
        {
          id: "your-data",
          heading: "Your data stays yours",
          body: (
            <>
              <p>
                All employee, payroll and company data you put into FruitionHR
                remains your property. We process it only to provide and support
                the service, as described in our{" "}
                <Link
                  href="/privacy"
                  className="font-medium text-fruition-700 underline underline-offset-4"
                >
                  Privacy Policy
                </Link>
                . We do not sell it and we do not use it to advertise to you or
                to anyone else.
              </p>
              <p>
                You can export your data at any time while your workspace is
                active. After termination you have 30 days to export, after
                which we delete or irreversibly anonymise your data on the
                schedule set out in the Privacy Policy.
              </p>
            </>
          ),
        },
        {
          id: "acceptable-use",
          heading: "Acceptable use",
          body: (
            <LegalList
              items={[
                "Do not upload unlawful content, malware, or data you have no right to process.",
                "Do not attempt to reach another company's workspace or data, probe or bypass our security controls, or run load or penetration tests without written permission.",
                "Do not resell, sublicense or white-label the service without our written agreement.",
                "Do not use the platform to break employment, tax or data-protection law in your jurisdiction.",
              ]}
            />
          ),
        },
        {
          id: "compliance",
          heading: "Payroll and statutory calculations",
          body: (
            <>
              <p>
                We build Nigerian statutory rules into the payroll engine and
                update them centrally when regulations change. Historical
                payslips are kept exactly as they were calculated, so past runs
                remain reproducible.
              </p>
              <p>
                FruitionHR is software, not a tax, legal or accounting adviser.
                You remain responsible for the accuracy of the data you enter,
                for reviewing and approving each payroll run, and for filing and
                remitting to the relevant authorities. Please verify the figures
                before you approve a run.
              </p>
            </>
          ),
        },
        {
          id: "availability",
          heading: "Availability and support",
          body: (
            <p>
              We aim to keep FruitionHR available at all times and monitor it
              continuously, but no online service is perfect. Planned
              maintenance is scheduled outside Nigerian business hours where
              practical and announced in advance. Support is available by email
              at {site.contactEmail}; response targets depend on your plan.
            </p>
          ),
        },
        {
          id: "liability",
          heading: "Liability",
          body: (
            <>
              <p>
                To the fullest extent permitted by law, neither party is liable
                for indirect or consequential loss, including lost profits, lost
                business or lost goodwill. Our total liability in any 12-month
                period is limited to the fees you paid us in the 12 months
                before the claim arose.
              </p>
              <p>
                Nothing in these terms limits liability for fraud, wilful
                misconduct, death or personal injury, or anything else that
                cannot lawfully be limited.
              </p>
            </>
          ),
        },
        {
          id: "changes",
          heading: "Changes to these terms",
          body: (
            <p>
              We may update these terms as the service and the law evolve. The
              date at the top always reflects the current version, and we notify
              workspace owners by email before material changes take effect.
              Continuing to use FruitionHR after that date means you accept the
              updated terms.
            </p>
          ),
        },
        {
          id: "governing-law",
          heading: "Governing law",
          body: (
            <p>
              These terms are governed by the laws of the Federal Republic of
              Nigeria, and the Nigerian courts have exclusive jurisdiction over
              any dispute. We will always try to resolve a dispute with you
              directly first.
            </p>
          ),
        },
      ]}
      footer={
        <p>
          Questions about these terms? Email{" "}
          <a
            href={`mailto:${site.contactEmail}`}
            className="font-medium text-fruition-700 underline underline-offset-4"
          >
            {site.contactEmail}
          </a>{" "}
          and a person — not a bot — will reply.
        </p>
      }
    />
  );
}
