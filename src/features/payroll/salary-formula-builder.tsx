"use client";

import axios from "axios";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Beaker,
  Braces,
  CircleAlert,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AmountInput } from "@/components/amount-input";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MoneyText } from "@/components/money-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useCan } from "@/features/auth/use-auth";
import {
  type FormulaCatalog,
  type FormulaCatalogItem,
  type FormulaComparator,
  type FormulaCondition,
  type FormulaDefinition,
  type FormulaOperand,
  type FormulaRule,
  type FormulaToken,
  type SalaryComponent,
  useEvaluateFormula,
  useFormulaCatalog,
  usePublishFormula,
  useSalaryComponents,
  useSalaryFormula,
  useSaveFormulaDraft,
} from "@/features/payroll/use-payroll";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const emptyDefinition = (): FormulaDefinition => ({
  schema_version: 1,
  rules: [{ condition: null, calculation: [] }],
});

const defaultCondition = (): FormulaCondition => ({
  left: { type: "basic" },
  comparator: "gt",
  right: { type: "amount", value_kobo: 0 },
});

const selectClass =
  "h-9 min-w-0 rounded-md border bg-background px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50";

type FormulaConflictPayload = {
  code?: string;
  message?: string;
};

function formatToken(token: FormulaToken, components: Map<number, SalaryComponent>): string {
  if (token.type === "basic") return "Basic salary";
  if (token.type === "component") {
    const component = components.get(token.component_id);
    return component ? component.name : `Component #${token.component_id}`;
  }
  if (token.type === "amount") {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(token.value_kobo / 100);
  }
  if (token.type === "percentage") return `${token.basis_points / 100}%`;
  if (token.type === "operator") {
    if (token.value === "*") return "×";
    if (token.value === "/") return "÷";
    return token.value;
  }
  if (token.type === "left_parenthesis") return "(";
  return ")";
}

function comparatorLabel(comparator: FormulaComparator, catalog?: FormulaCatalog): string {
  return catalog?.comparators.find((item) => item.value === comparator)?.label
    ?? ({ eq: "equals", neq: "does not equal", gt: "is greater than", gte: "is at least", lt: "is less than", lte: "is at most" } as const)[comparator];
}

function definitionIssues(definition: FormulaDefinition): string[] {
  const issues: string[] = [];
  if (!definition.rules.length) return ["Add at least one calculation rule."];

  definition.rules.forEach((rule, index) => {
    if (!rule.calculation.length) issues.push(`Rule ${index + 1} needs a calculation.`);
    if (index < definition.rules.length - 1 && rule.condition === null) {
      issues.push(`Rule ${index + 1} needs a condition.`);
    }
  });

  if (definition.rules.at(-1)?.condition !== null) {
    issues.push("The final rule must be the Otherwise fallback.");
  }

  return issues;
}

function OperandEditor({
  value,
  onChange,
  components,
  idPrefix,
}: {
  value: FormulaOperand;
  onChange: (value: FormulaOperand) => void;
  components: SalaryComponent[];
  idPrefix: string;
}) {
  return (
    <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(8rem,0.8fr)_minmax(9rem,1.2fr)]">
      <select
        id={`${idPrefix}-type`}
        aria-label="Value type"
        className={selectClass}
        value={value.type}
        onChange={(event) => {
          const next = event.target.value;
          if (next === "basic") onChange({ type: "basic" });
          if (next === "component") onChange({ type: "component", component_id: components[0]?.id ?? 0 });
          if (next === "amount") onChange({ type: "amount", value_kobo: 0 });
          if (next === "percentage") onChange({ type: "percentage", basis_points: 0 });
        }}
      >
        <option value="basic">Basic salary</option>
        <option value="component">Salary component</option>
        <option value="amount">Fixed amount</option>
        <option value="percentage">Percentage</option>
      </select>

      {value.type === "basic" && (
        <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
          Employee basic salary
        </div>
      )}
      {value.type === "component" && (
        <select
          id={`${idPrefix}-component`}
          aria-label="Salary component"
          className={selectClass}
          value={value.component_id}
          onChange={(event) => onChange({ type: "component", component_id: Number(event.target.value) })}
        >
          {components.map((component) => (
            <option key={component.id} value={component.id}>
              {component.name} ({component.code})
            </option>
          ))}
        </select>
      )}
      {value.type === "amount" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">₦</span>
          <AmountInput
            id={`${idPrefix}-amount`}
            aria-label="Fixed amount in naira"
            value={value.value_kobo / 100}
            onValueChange={(amount) => onChange({ type: "amount", value_kobo: Math.round(amount * 100) })}
          />
        </div>
      )}
      {value.type === "percentage" && (
        <div className="relative">
          <Input
            id={`${idPrefix}-percentage`}
            type="number"
            min={0}
            step={0.01}
            aria-label="Percentage"
            className="pr-8"
            value={value.basis_points / 100}
            onChange={(event) => onChange({
              type: "percentage",
              basis_points: Math.round(Number(event.target.value) * 100),
            })}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
        </div>
      )}
    </div>
  );
}

function ConditionEditor({
  value,
  onChange,
  components,
  catalog,
  ruleIndex,
}: {
  value: FormulaCondition;
  onChange: (value: FormulaCondition) => void;
  components: SalaryComponent[];
  catalog?: FormulaCatalog;
  ruleIndex: number;
}) {
  const comparators = catalog?.comparators ?? [
    { value: "eq" as const, label: "Equals" },
    { value: "neq" as const, label: "Does not equal" },
    { value: "gt" as const, label: "Greater than" },
    { value: "gte" as const, label: "At least" },
    { value: "lt" as const, label: "Less than" },
    { value: "lte" as const, label: "At most" },
  ];

  return (
    <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_11rem_minmax(0,1fr)] lg:items-center">
      <OperandEditor
        value={value.left}
        onChange={(left) => onChange({ ...value, left })}
        components={components}
        idPrefix={`rule-${ruleIndex}-left`}
      />
      <select
        aria-label={`Rule ${ruleIndex + 1} comparison`}
        className={selectClass}
        value={value.comparator}
        onChange={(event) => onChange({ ...value, comparator: event.target.value as FormulaComparator })}
      >
        {comparators.map((comparator) => (
          <option key={comparator.value} value={comparator.value}>{comparator.label}</option>
        ))}
      </select>
      <OperandEditor
        value={value.right}
        onChange={(right) => onChange({ ...value, right })}
        components={components}
        idPrefix={`rule-${ruleIndex}-right`}
      />
    </div>
  );
}

function FormulaRuleCard({
  rule,
  index,
  total,
  active,
  components,
  catalog,
  canManage,
  onActivate,
  onChange,
  onRemove,
  onMove,
  onRemoveToken,
}: {
  rule: FormulaRule;
  index: number;
  total: number;
  active: boolean;
  components: SalaryComponent[];
  catalog?: FormulaCatalog;
  canManage: boolean;
  onActivate: () => void;
  onChange: (rule: FormulaRule) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onRemoveToken: (tokenIndex: number) => void;
}) {
  const componentMap = useMemo(
    () => new Map(components.map((component) => [component.id, component])),
    [components],
  );
  const isFallback = index === total - 1;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm transition",
        active && "border-fruition-500 ring-2 ring-fruition-500/15",
      )}
      onFocus={onActivate}
      onClick={onActivate}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={cn(
            "grid size-7 place-items-center rounded-full text-xs font-bold",
            isFallback ? "bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-fruition-100 text-fruition-800",
          )}>
            {index + 1}
          </span>
          <div>
            <h3 className="text-sm font-semibold">{isFallback ? "Otherwise" : `Rule ${index + 1}`}</h3>
            <p className="text-xs text-muted-foreground">
              {isFallback ? "Used when no condition above matches." : "First matching rule is used."}
            </p>
          </div>
        </div>
        {canManage && !isFallback && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Move rule ${index + 1} up`}
              disabled={index === 0}
              onClick={(event) => { event.stopPropagation(); onMove(-1); }}
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Move rule ${index + 1} down`}
              disabled={index >= total - 2}
              onClick={(event) => { event.stopPropagation(); onMove(1); }}
            >
              <ArrowDown className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete rule ${index + 1}`}
              onClick={(event) => { event.stopPropagation(); onRemove(); }}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-4 p-4">
        {!isFallback && rule.condition && (
          <div className="space-y-2">
            <Label>When</Label>
            <ConditionEditor
              value={rule.condition}
              onChange={(condition) => onChange({ ...rule, condition })}
              components={components}
              catalog={catalog}
              ruleIndex={index}
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Calculate</Label>
            {active && <Badge variant="secondary">Items add here</Badge>}
          </div>
          <div
            aria-label={`Rule ${index + 1} calculation`}
            className={cn(
              "flex min-h-20 flex-wrap content-start items-start gap-2 rounded-lg border border-dashed bg-muted/15 p-3",
              active && "border-fruition-400 bg-fruition-50/30 dark:bg-fruition-950/10",
            )}
          >
            {rule.calculation.length ? rule.calculation.map((token, tokenIndex) => (
              <button
                key={`${JSON.stringify(token)}-${tokenIndex}`}
                type="button"
                disabled={!canManage}
                onClick={(event) => { event.stopPropagation(); onRemoveToken(tokenIndex); }}
                className={cn(
                  "group inline-flex min-h-9 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-sm font-medium shadow-xs outline-none transition hover:border-destructive/50 hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/40 disabled:hover:border-border disabled:hover:text-foreground",
                  (token.type === "operator" || token.type === "left_parenthesis" || token.type === "right_parenthesis")
                    && "border-slate-300 bg-slate-100 font-mono text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                )}
                aria-label={canManage ? `Remove ${formatToken(token, componentMap)}` : formatToken(token, componentMap)}
                title={canManage ? "Click to remove" : undefined}
              >
                {formatToken(token, componentMap)}
                {canManage && <X className="size-3 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />}
              </button>
            )) : (
              <button
                type="button"
                disabled={!canManage}
                onClick={onActivate}
                className="flex min-h-12 w-full items-center justify-center rounded-md text-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {canManage ? "Choose values and operators from Available items." : "No calculation has been configured."}
              </button>
            )}
          </div>
          {rule.condition && (
            <p className="text-xs text-muted-foreground">
              Runs when the left value {comparatorLabel(rule.condition.comparator, catalog)} the right value.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function FormulaPalette({
  catalog,
  search,
  onSearch,
  onInsert,
}: {
  catalog?: FormulaCatalog;
  search: string;
  onSearch: (value: string) => void;
  onInsert: (token: FormulaToken) => void;
}) {
  const [fixedAmount, setFixedAmount] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const normalized = search.trim().toLowerCase();
  const showOperators = !normalized
    || "operators arithmetic parentheses plus minus multiply divide".includes(normalized)
    || (catalog?.operators ?? []).some((operator) =>
      operator.value === normalized || operator.label.toLowerCase().includes(normalized),
    );
  const showFixedAmount = !normalized || "fixed amount".includes(normalized);
  const showPercentage = !normalized || "percentage".includes(normalized);
  const groups = (catalog?.groups ?? []).map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      !["amount", "percentage", "operator", "left_parenthesis", "right_parenthesis"].includes(item.token.type)
      && (!normalized
        || group.label.toLowerCase().includes(normalized)
        || item.label.toLowerCase().includes(normalized)),
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          className="pl-9"
          placeholder="Search available items"
          aria-label="Search formula items"
        />
      </div>

      {showOperators && (
        <section className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Operators
          </h4>
          <div className="grid grid-cols-6 gap-2" aria-label="Formula operators">
            {(catalog?.operators ?? [
              { value: "+" as const, label: "Add" },
              { value: "-" as const, label: "Subtract" },
              { value: "*" as const, label: "Multiply" },
              { value: "/" as const, label: "Divide" },
            ]).map((operator) => (
              <button
                key={operator.value}
                type="button"
                title={operator.label}
                aria-label={operator.label}
                onClick={() => onInsert({ type: "operator", value: operator.value })}
                className="grid min-h-10 place-items-center rounded-lg border bg-slate-50 font-mono text-base font-semibold text-slate-800 shadow-xs outline-none transition hover:border-fruition-500 hover:bg-fruition-50 focus-visible:ring-3 focus-visible:ring-ring/40 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-fruition-950/20"
              >
                {operator.value === "*" ? "×" : operator.value === "/" ? "÷" : operator.value}
              </button>
            ))}
            <button
              type="button"
              title="Open parenthesis"
              aria-label="Open parenthesis"
              onClick={() => onInsert({ type: "left_parenthesis" })}
              className="grid min-h-10 place-items-center rounded-lg border bg-slate-50 font-mono text-base font-semibold text-slate-800 shadow-xs outline-none transition hover:border-fruition-500 hover:bg-fruition-50 focus-visible:ring-3 focus-visible:ring-ring/40 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-fruition-950/20"
            >
              (
            </button>
            <button
              type="button"
              title="Close parenthesis"
              aria-label="Close parenthesis"
              onClick={() => onInsert({ type: "right_parenthesis" })}
              className="grid min-h-10 place-items-center rounded-lg border bg-slate-50 font-mono text-base font-semibold text-slate-800 shadow-xs outline-none transition hover:border-fruition-500 hover:bg-fruition-50 focus-visible:ring-3 focus-visible:ring-ring/40 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-fruition-950/20"
            >
              )
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Build calculations in order, for example: ( Basic salary + Bonus ) × 10%.
          </p>
        </section>
      )}

      {showFixedAmount && (
        <div className="space-y-2 rounded-lg border p-3">
          <Label htmlFor="formula-fixed-amount">Fixed amount</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">₦</span>
            <AmountInput
              id="formula-fixed-amount"
              value={fixedAmount}
              onValueChange={setFixedAmount}
              placeholder="0"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={fixedAmount < 0}
              onClick={() => onInsert({ type: "amount", value_kobo: Math.round(fixedAmount * 100) })}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {showPercentage && (
        <div className="space-y-2 rounded-lg border p-3">
          <Label htmlFor="formula-percentage">Percentage</Label>
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Input
                id="formula-percentage"
                type="number"
                min={0}
                step={0.01}
                className="pr-8"
                value={percentage}
                onChange={(event) => setPercentage(Number(event.target.value))}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={percentage < 0}
              onClick={() => onInsert({ type: "percentage", basis_points: Math.round(percentage * 100) })}
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {groups.map((group) => (
        <section key={group.key} className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</h4>
          <div className="flex flex-wrap gap-2">
            {group.items.map((item: FormulaCatalogItem, itemIndex) => (
              <button
                key={`${group.key}-${item.label}-${itemIndex}`}
                type="button"
                disabled={!item.available}
                title={item.available ? item.label : item.unavailable_reason ?? "Unavailable"}
                onClick={() => onInsert(item.token)}
                className="min-h-9 rounded-lg border bg-background px-2.5 text-left text-sm font-medium shadow-xs outline-none transition hover:border-fruition-500 hover:bg-fruition-50 focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-fruition-950/20"
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>
      ))}

      {!groups.length && normalized && !showOperators && !showFixedAmount && !showPercentage && (
        <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          No formula items match “{search}”.
        </p>
      )}
    </div>
  );
}

function EvaluationPanel({
  componentId,
  definition,
  components,
}: {
  componentId: number;
  definition: FormulaDefinition;
  components: SalaryComponent[];
}) {
  const evaluate = useEvaluateFormula(componentId);
  const [basicSalary, setBasicSalary] = useState(0);
  const referencedIds = useMemo(
    () => [...new Set(definition.rules.flatMap((rule) => [
      ...(rule.condition?.left.type === "component" ? [rule.condition.left.component_id] : []),
      ...(rule.condition?.right.type === "component" ? [rule.condition.right.component_id] : []),
      ...rule.calculation
        .filter((token): token is Extract<FormulaToken, { type: "component" }> => token.type === "component")
        .map((token) => token.component_id),
    ]))],
    [definition],
  );
  const [componentValues, setComponentValues] = useState<Record<number, number>>({});

  async function runEvaluation() {
    try {
      await evaluate.mutateAsync({
        definition,
        basic_salary: Math.round(basicSalary * 100),
        component_values: referencedIds.map((salaryComponentId) => ({
          salary_component_id: salaryComponentId,
          amount: Math.round((componentValues[salaryComponentId] ?? 0) * 100),
        })),
      });
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200">
            <Beaker className="size-5" />
          </span>
          <div>
            <CardTitle>Evaluate calculation</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Test server-calculated results with sample payroll values before publishing.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="formula-basic-salary">Basic salary (₦ / month)</Label>
            <AmountInput
              id="formula-basic-salary"
              value={basicSalary}
              onValueChange={setBasicSalary}
              placeholder="0"
            />
          </div>
          {referencedIds.map((id) => {
            const component = components.find((item) => item.id === id);
            return (
              <div key={id} className="grid gap-2">
                <Label htmlFor={`formula-component-${id}`}>
                  {component?.name ?? `Component #${id}`} (₦)
                </Label>
                <AmountInput
                  id={`formula-component-${id}`}
                  value={componentValues[id] ?? 0}
                  onValueChange={(value) => setComponentValues((current) => ({ ...current, [id]: value }))}
                  placeholder="0"
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => void runEvaluation()}
            disabled={evaluate.isPending || basicSalary < 0 || definitionIssues(definition).length > 0}
          >
            <Beaker className="size-4" />
            {evaluate.isPending ? "Evaluating…" : "Evaluate"}
          </Button>
        </div>

        {evaluate.data && (
          <div
            className="rounded-xl border border-fruition-200 bg-fruition-50/60 p-4 dark:border-fruition-800 dark:bg-fruition-950/20"
            aria-live="polite"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-fruition-700 dark:text-fruition-300">Result</p>
                <p className="mt-1 text-2xl font-bold text-fruition-900 dark:text-fruition-100">
                  <MoneyText kobo={evaluate.data.result_kobo} />
                </p>
              </div>
              <Badge>Rule {evaluate.data.matched_rule_index + 1} matched</Badge>
            </div>
            <p className="mt-3 text-sm text-fruition-950/80 dark:text-fruition-100/80">{evaluate.data.summary}</p>
            {evaluate.data.dependencies.length > 0 && (
              <div className="mt-4 border-t border-fruition-200 pt-3 dark:border-fruition-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resolved dependencies</p>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {evaluate.data.dependencies.map((dependency) => (
                    <li key={dependency.id} className="flex justify-between gap-3 rounded-md bg-background/80 px-3 py-2 text-sm">
                      <span>{dependency.name}</span>
                      <MoneyText kobo={dependency.amount} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SalaryFormulaBuilder({
  componentId,
  onBack,
}: {
  componentId: number;
  onBack: () => void;
}) {
  const canManage = useCan("payroll.formulas.manage");
  const formula = useSalaryFormula(componentId, canManage);
  const catalog = useFormulaCatalog(canManage);
  const componentsQuery = useSalaryComponents(canManage);
  const saveDraft = useSaveFormulaDraft(componentId);
  const publish = usePublishFormula(componentId);
  const [workingDefinition, setWorkingDefinition] = useState<{
    componentId: number;
    definition: FormulaDefinition;
  } | null>(null);
  const [activeRule, setActiveRule] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [draftConflict, setDraftConflict] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const sourceRevision = formula.data?.draft ?? formula.data?.published ?? null;
  const savedDefinition = sourceRevision?.definition ?? emptyDefinition();
  const definition = workingDefinition?.componentId === componentId
    ? workingDefinition.definition
    : savedDefinition;
  const isDirty = JSON.stringify(definition) !== JSON.stringify(savedDefinition);

  const componentById = new Map(
    (componentsQuery.data ?? []).map((component) => [component.id, component]),
  );
  const authoringCatalog: FormulaCatalog | undefined = catalog.data
    ? {
        ...catalog.data,
        groups: catalog.data.groups.map((group) => ({
          ...group,
          items: group.items.map((item) => {
            if (item.token.type !== "component") return item;

            const dependency = componentById.get(item.token.component_id);
            const unavailableReason = item.token.component_id === componentId
              ? "A formula cannot reference its own salary component."
              : dependency?.calc_type === "formula" && !dependency.formula?.published_revision_id
                ? "Publish this component's formula before using it as a dependency."
                : null;

            return unavailableReason
              ? { ...item, available: false, unavailable_reason: unavailableReason }
              : item;
          }),
        })),
      }
    : undefined;

  const catalogComponentItems = (authoringCatalog?.groups ?? [])
    .flatMap((group) => group.items)
    .filter((item): item is FormulaCatalogItem & {
      token: Extract<FormulaToken, { type: "component" }>;
    } => item.token.type === "component");
  const eligibleCatalogIds = new Set(
    catalogComponentItems
      .filter((item) => item.available)
      .map((item) => item.token.component_id),
  );
  const catalogDefinesComponents = catalogComponentItems.length > 0;
  const components = (componentsQuery.data ?? []).filter((component) =>
    component.id !== componentId
    && component.is_active
    && component.calc_type !== "percent_of_gross"
    && (!catalogDefinesComponents || eligibleCatalogIds.has(component.id)),
  );

  const issues = definitionIssues(definition);

  useEffect(() => {
    if (!isDirty) return;

    const preventUnsavedExit = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", preventUnsavedExit);
    return () => window.removeEventListener("beforeunload", preventUnsavedExit);
  }, [isDirty]);

  function updateDefinition(
    next: FormulaDefinition | ((current: FormulaDefinition) => FormulaDefinition),
  ) {
    setWorkingDefinition((current) => {
      const base = current?.componentId === componentId ? current.definition : definition;
      return {
        componentId,
        definition: typeof next === "function" ? next(base) : next,
      };
    });
  }

  function updateRule(index: number, rule: FormulaRule) {
    updateDefinition((current) => ({
      ...current,
      rules: current.rules.map((item, itemIndex) => itemIndex === index ? rule : item),
    }));
  }

  function insertToken(token: FormulaToken) {
    updateDefinition((current) => ({
      ...current,
      rules: current.rules.map((rule, index) =>
        index === activeRule
          ? { ...rule, calculation: [...rule.calculation, structuredClone(token)] }
          : rule,
      ),
    }));
  }

  function addRule() {
    updateDefinition((current) => {
      const rules = [...current.rules];
      rules.splice(Math.max(0, rules.length - 1), 0, {
        condition: defaultCondition(),
        calculation: [],
      });
      return { ...current, rules };
    });
    setActiveRule(Math.max(0, definition.rules.length - 1));
  }

  async function refreshAfterDraftConflict(error: unknown): Promise<boolean> {
    if (!axios.isAxiosError<FormulaConflictPayload>(error)
      || error.response?.data?.code !== "SALARY_FORMULA_DRAFT_CONFLICT") {
      return false;
    }

    await formula.refetch();
    setServerError(null);
    setDraftConflict(true);
    toast.error("Formula draft changed in another session. Choose how to continue.");
    return true;
  }

  async function save() {
    setServerError(null);
    if (issues.length) {
      setServerError(issues[0]);
      return;
    }
    try {
      const saved = await saveDraft.mutateAsync({
        definition,
        expected_draft_id: formula.data?.draft?.id ?? null,
        expected_checksum: formula.data?.draft?.checksum ?? null,
      });
      setWorkingDefinition({
        componentId,
        definition: saved.draft?.definition ?? definition,
      });
      toast.success("Formula draft saved.");
    } catch (error) {
      if (await refreshAfterDraftConflict(error)) return;
      setServerError(apiErrorMessage(error));
    }
  }

  async function doPublish() {
    setServerError(null);
    const draft = formula.data?.draft;
    if (!draft?.checksum) {
      setServerError("Save a valid formula draft before publishing.");
      setPublishOpen(false);
      return;
    }

    try {
      await publish.mutateAsync({
        expected_draft_id: draft.id,
        expected_checksum: draft.checksum,
      });
      setPublishOpen(false);
      toast.success("Formula published.");
    } catch (error) {
      if (await refreshAfterDraftConflict(error)) {
        setPublishOpen(false);
        return;
      }
      setServerError(apiErrorMessage(error));
      setPublishOpen(false);
    }
  }

  function requestBack() {
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    onBack();
  }

  if (!canManage) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center">
        <Braces className="mx-auto size-8 text-muted-foreground" />
        <h2 className="mt-3 font-semibold">Formula access required</h2>
        <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">
          You need Manage payroll formulas access to create, evaluate, or publish salary calculations.
        </p>
        <Button className="mt-4" variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4" /> Back to salary setup
        </Button>
      </div>
    );
  }

  if (formula.isLoading || catalog.isLoading || componentsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_21rem] @min-[70rem]/formula-workspace:grid-cols-[minmax(0,1fr)_21rem]">
          <Skeleton className="h-[34rem] w-full rounded-xl" />
          <Skeleton className="h-[34rem] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (formula.isError || catalog.isError || componentsQuery.isError || !formula.data) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 size-5 text-destructive" />
          <div className="flex-1">
            <h2 className="font-semibold">Formula workspace could not be loaded</h2>
            <p className="mt-1 text-sm text-muted-foreground">Check your access and try again.</p>
          </div>
          <Button variant="outline" onClick={() => void Promise.all([formula.refetch(), catalog.refetch(), componentsQuery.refetch()])}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!formula.data.advanced_salary_formulas_enabled) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        <Sparkles className="size-7" />
        <h2 className="mt-3 font-heading text-xl font-semibold">Advanced salary formulas are off</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6">
          Enable this optional payroll feature in Organisation settings before building a custom calculation.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button render={<Link href="/settings/organisation?tab=features" />}>Open feature settings</Button>
          <Button variant="outline" onClick={onBack}>Back to salary setup</Button>
        </div>
      </div>
    );
  }

  const component = formula.data.component;

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-20 -mx-1 rounded-xl border bg-background/95 p-4 shadow-sm supports-backdrop-filter:backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Button type="button" variant="ghost" size="icon" aria-label="Back to salary setup" onClick={requestBack}>
              <ArrowLeft className="size-4" />
            </Button>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-fruition-100 text-fruition-800 dark:bg-fruition-900/40 dark:text-fruition-200">
              <Braces className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-heading text-xl font-semibold">Formula for {component.name}</h2>
                <Badge variant="secondary">{component.code}</Badge>
                {formula.data.published && <Badge>Published v{formula.data.published.version}</Badge>}
                {formula.data.draft && <Badge variant="outline">Draft v{formula.data.draft.version}</Badge>}
                {isDirty && <Badge variant="secondary">Unsaved changes</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Ordered rules run from top to bottom. The first match wins, with Otherwise as the safe fallback.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pl-11 lg:pl-0">
            <Button className="xl:hidden @min-[70rem]/formula-workspace:hidden" type="button" variant="outline" onClick={() => setPaletteOpen(true)}>
              <Plus className="size-4" /> Add formula item
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void save()}
              disabled={saveDraft.isPending || issues.length > 0 || !isDirty || draftConflict}
            >
              <Save className="size-4" /> {saveDraft.isPending ? "Saving…" : "Save draft"}
            </Button>
            <Button
              type="button"
              onClick={() => setPublishOpen(true)}
              disabled={publish.isPending
                || !formula.data.draft?.checksum
                || issues.length > 0
                || isDirty
                || draftConflict}
              title={isDirty ? "Save your current changes before publishing" : undefined}
            >
              <Send className="size-4" /> Publish
            </Button>
          </div>
        </div>
      </div>

      {draftConflict && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-2">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-semibold">This draft changed in another session</p>
                <p className="mt-1 max-w-3xl leading-6">
                  Your working rules remain protected on this page. Load the latest server draft, or keep your rules and deliberately replace that draft on your next save.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setWorkingDefinition(null);
                  setDraftConflict(false);
                  toast.success("Latest server draft loaded.");
                }}
              >
                Load latest draft
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setDraftConflict(false);
                  toast.message("Your rules are still unsaved. Save again to replace the server draft.");
                }}
              >
                Keep my rules
              </Button>
            </div>
          </div>
        </div>
      )}

      {(serverError || issues.length > 0) && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <div className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-semibold">Formula needs attention</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {(serverError ? [serverError] : issues).map((issue) => <li key={issue}>{issue}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_21rem] @min-[70rem]/formula-workspace:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-4">
          {definition.rules.map((rule, index) => (
            <FormulaRuleCard
              key={index}
              rule={rule}
              index={index}
              total={definition.rules.length}
              active={activeRule === index}
              components={components}
              catalog={authoringCatalog}
              canManage={canManage}
              onActivate={() => setActiveRule(index)}
              onChange={(next) => updateRule(index, next)}
              onRemove={() => {
                updateDefinition((current) => ({
                  ...current,
                  rules: current.rules.filter((_, itemIndex) => itemIndex !== index),
                }));
                setActiveRule(Math.max(0, index - 1));
              }}
              onMove={(direction) => {
                updateDefinition((current) => {
                  const rules = [...current.rules];
                  const target = index + direction;
                  [rules[index], rules[target]] = [rules[target], rules[index]];
                  return { ...current, rules };
                });
                setActiveRule(index + direction);
              }}
              onRemoveToken={(tokenIndex) => updateRule(index, {
                ...rule,
                calculation: rule.calculation.filter((_, itemIndex) => itemIndex !== tokenIndex),
              })}
            />
          ))}

          <Button type="button" variant="outline" className="w-full border-dashed py-5" onClick={addRule}>
            <Plus className="size-4" /> Add conditional rule
          </Button>

          <EvaluationPanel componentId={componentId} definition={definition} components={components} />
        </div>

        <aside className="sticky top-32 hidden max-h-[calc(100vh-9rem)] overflow-y-auto rounded-xl border bg-card p-4 shadow-sm xl:block @min-[70rem]/formula-workspace:block">
          <div className="mb-4 flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-fruition-50 text-fruition-700 dark:bg-fruition-950/30 dark:text-fruition-200">
              <Sparkles className="size-4" />
            </span>
            <div>
              <h3 className="font-heading font-semibold">Available items</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Adding to Rule {activeRule + 1}</p>
            </div>
          </div>
          <FormulaPalette
            catalog={authoringCatalog}
            search={paletteSearch}
            onSearch={setPaletteSearch}
            onInsert={insertToken}
          />
        </aside>
      </div>

      <Sheet open={paletteOpen} onOpenChange={setPaletteOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Available formula items</SheetTitle>
            <SheetDescription>Adding to Rule {activeRule + 1}. Select an item to add it to the calculation.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <FormulaPalette
              catalog={authoringCatalog}
              search={paletteSearch}
              onSearch={setPaletteSearch}
              onInsert={(token) => {
                insertToken(token);
                setPaletteOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        title="Publish this salary formula?"
        description="Publishing makes this draft available to salary structures. The published version is immutable so payroll results remain reproducible."
        confirmLabel="Publish formula"
        confirmVariant="default"
        isPending={publish.isPending}
        onConfirm={() => void doPublish()}
      />

      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard unsaved formula changes?"
        description="Your working changes have not been saved as a draft. Leaving now will discard them."
        confirmLabel="Discard changes"
        isPending={false}
        onConfirm={() => {
          setDiscardOpen(false);
          onBack();
        }}
      />

      <div className="sr-only" aria-live="polite">
        {saveDraft.isSuccess && "Formula draft saved."}
        {publish.isSuccess && "Formula published."}
        {issues.length ? issues.join(" ") : "Formula structure is valid."}
      </div>
    </div>
  );
}
