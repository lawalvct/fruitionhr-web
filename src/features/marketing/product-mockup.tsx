import { CheckCircle2, Clock3 } from "lucide-react";

const rows = [
  { name: "Adaeze Okafor", role: "Operations", net: "₦486,250", status: "Approved" },
  { name: "Ibrahim Musa", role: "Engineering", net: "₦712,400", status: "Approved" },
  { name: "Funke Adeyemi", role: "Finance", net: "₦598,000", status: "Pending" },
  { name: "Chinedu Eze", role: "Sales", net: "₦431,800", status: "Approved" },
];

/**
 * Pure-CSS payroll dashboard mockup for the hero — reads as a product
 * screenshot without shipping image assets.
 */
export function ProductMockup() {
  return (
    <div className="relative">
      {/* soft glow behind the card */}
      <div className="absolute -inset-6 rounded-3xl bg-linear-135 from-fruition-300/40 via-fruition-500/20 to-transparent blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl border border-fruition-100 bg-white shadow-2xl shadow-fruition-900/10">
        {/* window chrome */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-red-300" />
          <span className="size-2.5 rounded-full bg-amber-300" />
          <span className="size-2.5 rounded-full bg-fruition-400" />
          <span className="ml-3 rounded-md bg-white px-2 py-0.5 text-[10px] text-slate-400 ring-1 ring-slate-200">
            app.fruitionhr.com/payroll
          </span>
        </div>

        <div className="flex">
          {/* mini sidebar */}
          <div className="hidden w-36 shrink-0 flex-col gap-1 bg-fruition-900 p-3 sm:flex">
            <div className="mb-2 h-2 w-16 rounded bg-white/30" />
            {["Dashboard", "Employees", "Attendance", "Leave"].map((item) => (
              <div key={item} className="rounded px-2 py-1.5 text-[11px] text-fruition-100/70">
                {item}
              </div>
            ))}
            <div className="rounded bg-fruition-500 px-2 py-1.5 text-[11px] font-semibold text-fruition-950">
              Payroll
            </div>
            <div className="rounded px-2 py-1.5 text-[11px] text-fruition-100/70">
              Reports
            </div>
          </div>

          {/* main panel */}
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium text-slate-400">
                  Payroll run
                </p>
                <p className="text-sm font-bold text-slate-800">July 2026</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-600 ring-1 ring-amber-200">
                <Clock3 className="size-3" /> Awaiting approval
              </span>
            </div>

            {/* stat tiles */}
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {[
                { label: "Employees", value: "128" },
                { label: "Gross pay", value: "₦68.4M" },
                { label: "Net pay", value: "₦52.9M" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                >
                  <p className="text-[10px] text-slate-400">{stat.label}</p>
                  <p className="text-sm font-bold text-fruition-800">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* employee rows */}
            <div className="mt-4 overflow-hidden rounded-lg border border-slate-100">
              {rows.map((row, i) => (
                <div
                  key={row.name}
                  className={`flex items-center justify-between gap-2 px-3 py-2 ${
                    i > 0 ? "border-t border-slate-100" : ""
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-fruition-100 text-[9px] font-bold text-fruition-800">
                      {row.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-slate-700">
                        {row.name}
                      </p>
                      <p className="text-[9px] text-slate-400">{row.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-700">
                      {row.net}
                    </span>
                    {row.status === "Approved" ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-fruition-50 px-1.5 py-0.5 text-[9px] font-semibold text-fruition-600">
                        <CheckCircle2 className="size-2.5" /> {row.status}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600">
                        {row.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* statutory strip */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {["PAYE", "Pension", "NHF", "NSITF"].map((item) => (
                <span
                  key={item}
                  className="rounded-md bg-fruition-50 px-2 py-1 text-[9px] font-semibold text-fruition-700 ring-1 ring-fruition-100"
                >
                  {item} ✓
                </span>
              ))}
              <span className="ml-auto text-[9px] text-slate-400">
                Statutory deductions auto-calculated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* floating approval toast */}
      <div className="absolute -right-3 -bottom-5 hidden items-center gap-2 rounded-xl border border-fruition-100 bg-white px-3.5 py-2.5 shadow-lg sm:flex">
        <span className="flex size-7 items-center justify-center rounded-full bg-fruition-500 text-white">
          <CheckCircle2 className="size-4" />
        </span>
        <div>
          <p className="text-[11px] font-bold text-slate-800">Leave approved</p>
          <p className="text-[9px] text-slate-400">Workflow: Manager → HR</p>
        </div>
      </div>
    </div>
  );
}
