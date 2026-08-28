import Link from "next/link";

import { site } from "@/lib/site";
import { LegalList, LegalPage } from "@/features/marketing/legal-page";

export const metadata = {
  title: "Privacy Policy",
  description:
    "How FruitionHR collects, uses, stores and protects personal data — for customers, their employees and job applicants, under the Nigeria Data Protection Act 2023.",
};

/*
 * Privacy notice covering both roles we play: controller for our own customer
 * and marketing data, processor for the employee data a tenant puts into its
 * workspace. Keep that distinction — it is the part customers' own counsel
 * checks first.
 *
 * TODO(legal): add the registered entity name, office address and a dedicated
 * privacy@ mailbox once they exist, and register with the NDPC if the platform
 * crosses the data-controller thresholds.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updatedAt="28 August 2026"
      intro={
        <>
          <p>
            FruitionHR handles some of the most sensitive information a business
            holds — salaries, bank details, health-related leave, performance
            notes. This policy explains what we collect, why, how long we keep
            it, and the choices you have.
          </p>
          <p>
            It is written to meet the Nigeria Data Protection Act 2023 (NDPA)
            and is intended to be readable by the people it describes, not only
            by lawyers.
          </p>
        </>
      }
      sections={[
        {
          id: "roles",
          heading: "Two different roles we play",
          body: (
            <>
              <p>
                <strong className="font-semibold text-slate-800">
                  We are the data controller
                </strong>{" "}
                for information about our own customers: the person who signs
                up, billing contacts, support conversations and website
                visitors. We decide why and how that data is used.
              </p>
              <p>
                <strong className="font-semibold text-slate-800">
                  We are a data processor
                </strong>{" "}
                for the employee and payroll data inside a company&rsquo;s
                workspace. That company is the controller: it decides what to
                store and why, and we only act on its instructions. If you are
                an employee asking about your own records, please contact your
                employer&rsquo;s HR team first — we will refer your request to
                them.
              </p>
            </>
          ),
        },
        {
          id: "what-we-collect",
          heading: "What we collect",
          body: (
            <>
              <p className="font-medium text-slate-800">
                Account and billing data (we are the controller)
              </p>
              <LegalList
                items={[
                  "Company name, your name, work email and phone number, given at registration.",
                  "Plan, subscription status, invoices and payment references. Card details are handled by our payment providers — we never see or store full card numbers.",
                  "Support messages, and email you send us.",
                  "Technical data: IP address, device and browser type, pages viewed, and security logs such as sign-in attempts.",
                ]}
              />
              <p className="mt-2 font-medium text-slate-800">
                Workspace data (your employer is the controller)
              </p>
              <LegalList
                items={[
                  "Employee records: names, contact details, next of kin, employment history, job and department, documents you upload.",
                  "Payroll data: salary structures, allowances, deductions, loans, statutory numbers (TIN, pension PIN, NHF) and bank account details for payment.",
                  "Attendance, leave (including the reason where your employer records one), approvals, performance reviews and disciplinary records.",
                  "Recruitment data: applications, CVs and interview notes submitted through career pages.",
                ]}
              />
            </>
          ),
        },
        {
          id: "why",
          heading: "Why we use it, and our lawful basis",
          body: (
            <LegalList
              items={[
                "To provide the service — running payroll, attendance, leave and the rest. Basis: performance of our contract with your company, and its instructions to us.",
                "To bill and collect payment, and to keep accounting records. Basis: contract and legal obligation.",
                "To keep the platform secure — detecting suspicious sign-ins, preventing abuse, keeping audit trails. Basis: legitimate interest, and legal obligation.",
                "To support you, respond to questions, and send service notices such as maintenance or security alerts. Basis: contract and legitimate interest.",
                "To improve the product using aggregated, non-identifying usage patterns. Basis: legitimate interest.",
                "To send marketing about FruitionHR to business contacts, with an unsubscribe link in every message. Basis: consent or legitimate interest, as applicable.",
              ]}
            />
          ),
        },
        {
          id: "never",
          heading: "What we never do",
          body: (
            <LegalList
              items={[
                "We never sell personal data, and we never rent or trade it.",
                "We never use employee or payroll data from one company to serve another, or to train third-party models.",
                "We never use workspace data for advertising.",
              ]}
            />
          ),
        },
        {
          id: "sharing",
          heading: "Who we share data with",
          body: (
            <>
              <p>
                We share personal data only with service providers who help us
                run the platform, each bound by contract to protect it and to
                use it only for our instructions:
              </p>
              <LegalList
                items={[
                  "Hosting and infrastructure providers that run our servers, databases and backups.",
                  "Payment providers (such as Paystack and Nomba) to process subscription payments.",
                  "Email and messaging providers used to deliver notifications, invitations and payslip alerts.",
                  "Error-monitoring and analytics tools that help us find and fix faults.",
                ]}
              />
              <p>
                We also disclose data where the law requires it — a valid court
                order or a lawful request from a regulator — and, if FruitionHR
                is ever acquired or merged, to the acquiring entity under the
                same protections set out here.
              </p>
            </>
          ),
        },
        {
          id: "isolation",
          heading: "Separation between companies",
          body: (
            <p>
              Every company&rsquo;s workspace is isolated: records carry the
              owning company&rsquo;s identifier and every query, background job
              and report is scoped to it. Access inside a workspace is
              controlled by roles, and salary visibility is a permission of its
              own so that payroll figures are not exposed to every HR user by
              default.
            </p>
          ),
        },
        {
          id: "security",
          heading: "How we protect data",
          body: (
            <LegalList
              items={[
                "Encrypted in transit over HTTPS; sensitive fields and credentials are stored hashed or encrypted at rest.",
                "Role-based access control, with an audit trail of significant actions inside a workspace.",
                "Automated daily backups, held securely and tested for restore.",
                "Least-privilege access for our own staff: production data is reachable only by the few engineers who need it, and only for support and maintenance.",
                "If a breach affects your data, we will notify the NDPC and affected customers without undue delay and tell you what happened and what we are doing about it.",
              ]}
            />
          ),
        },
        {
          id: "retention",
          heading: "How long we keep data",
          body: (
            <>
              <LegalList
                items={[
                  "Workspace data is kept while your subscription is active, and for 30 days after termination so you can export it. After that it is deleted or irreversibly anonymised.",
                  "Payroll records and payslips are retained for as long as your company needs them for statutory record-keeping, and are never altered retroactively.",
                  "Invoices and accounting records are kept for the period tax law requires.",
                  "Security and audit logs are kept for up to 12 months.",
                  "Recruitment data is retained according to your company's own settings on its career page.",
                ]}
              />
              <p>
                A company can ask us to delete its workspace sooner; we will do
                so unless the law requires us to keep specific records.
              </p>
            </>
          ),
        },
        {
          id: "location",
          heading: "Where data is stored",
          body: (
            <p>
              Data is hosted on servers we control, with backups held in the
              same or an equivalent environment. Where a provider processes data
              outside Nigeria, we only use providers that offer protection
              comparable to the NDPA, under contractual safeguards.
            </p>
          ),
        },
        {
          id: "your-rights",
          heading: "Your rights",
          body: (
            <>
              <p>Under the NDPA you may ask to:</p>
              <LegalList
                items={[
                  "Access the personal data held about you, and get a copy.",
                  "Correct data that is inaccurate or incomplete.",
                  "Delete data where there is no lasting legal reason to keep it.",
                  "Object to or restrict certain processing, including direct marketing.",
                  "Receive your data in a portable, machine-readable format.",
                  "Withdraw consent at any time, where we relied on consent.",
                ]}
              />
              <p>
                Write to{" "}
                <a
                  href={`mailto:${site.contactEmail}`}
                  className="font-medium text-fruition-700 underline underline-offset-4"
                >
                  {site.contactEmail}
                </a>{" "}
                and we will respond within 30 days. If your data sits in an
                employer&rsquo;s workspace, we will pass your request to that
                employer, who decides on it. You may also complain to the
                Nigeria Data Protection Commission.
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          heading: "Cookies",
          body: (
            <p>
              We use cookies that are necessary for the service to work: keeping
              you signed in, protecting forms against cross-site request
              forgery, and remembering basic preferences. We keep any analytics
              lightweight and do not use advertising or cross-site tracking
              cookies. Blocking essential cookies will stop sign-in from
              working.
            </p>
          ),
        },
        {
          id: "children",
          heading: "Children",
          body: (
            <p>
              FruitionHR is a workplace product and is not intended for anyone
              under 18. We do not knowingly collect data from children; where an
              employer records a dependant&rsquo;s details, that data is
              processed on the employer&rsquo;s instructions for HR purposes
              only.
            </p>
          ),
        },
        {
          id: "changes",
          heading: "Changes to this policy",
          body: (
            <p>
              We update this policy when our practices or the law change. The
              date at the top shows the current version, and we notify workspace
              owners by email before material changes take effect.
            </p>
          ),
        },
      ]}
      footer={
        <p>
          Privacy questions, requests, or a concern about how data is handled?
          Email{" "}
          <a
            href={`mailto:${site.contactEmail}`}
            className="font-medium text-fruition-700 underline underline-offset-4"
          >
            {site.contactEmail}
          </a>
          . See also our{" "}
          <Link
            href="/terms"
            className="font-medium text-fruition-700 underline underline-offset-4"
          >
            Terms of Service
          </Link>
          .
        </p>
      }
    />
  );
}
