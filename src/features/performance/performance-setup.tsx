'use client';

import { Copy, Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useAppraisalTemplates,
  useCloneTemplate,
  useCreateCategory,
  useCreateKpi,
  useCreateRatingScale,
  useCreateTemplate,
  usePerformanceCategories,
  usePerformanceKpis,
  useRatingScales,
  useSeedPerformanceDefaults,
} from '@/features/performance/use-performance';
import { apiErrorMessage } from '@/lib/api';

const selectClass = 'h-9 rounded-md border bg-background px-2 text-sm';

export function PerformanceSetup() {
  const { data: categories = [] } = usePerformanceCategories();
  const { data: kpis = [] } = usePerformanceKpis();
  const { data: scales = [] } = useRatingScales();
  const { data: templates = [] } = useAppraisalTemplates();
  const createCategory = useCreateCategory();
  const createKpi = useCreateKpi();
  const createScale = useCreateRatingScale();
  const createTemplate = useCreateTemplate();
  const cloneTemplate = useCloneTemplate();
  const seedDefaults = useSeedPerformanceDefaults();
  const [categoryName, setCategoryName] = useState('');
  const [kpiName, setKpiName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [kpiDepartment, setKpiDepartment] = useState('');
  const [kpiType, setKpiType] = useState('qualitative');
  const [kpiMandatory, setKpiMandatory] = useState(true);
  const [descriptorLow, setDescriptorLow] = useState('');
  const [descriptorMid, setDescriptorMid] = useState('');
  const [descriptorHigh, setDescriptorHigh] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [scaleId, setScaleId] = useState('');
  const [minPassing, setMinPassing] = useState('50');
  const [weights, setWeights] = useState<Record<number, string>>({});

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      toast.success(success);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }

  const totalWeight = Object.values(weights).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const libraryEmpty = kpis.length === 0 && templates.length === 0;

  return (
    <div className='space-y-6'>
      {/* Sample library — mirrors the onboarding "default performance data" choice */}
      {libraryEmpty && (
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-md border border-fruition-200 bg-fruition-50/60 px-4 py-3'>
          <div>
            <p className='text-sm font-medium'>FruitionHR sample library</p>
            <p className='text-xs text-muted-foreground'>
              Load 70+ KPIs across 9 departments, a 5-band rating scale, and 3 ready-made templates.
            </p>
          </div>
          <Button
            size='sm'
            disabled={seedDefaults.isPending}
            onClick={() => run(() => seedDefaults.mutateAsync(), 'Sample KPI library and templates loaded.')}
          >
            <Sparkles className='size-4' /> {seedDefaults.isPending ? 'Loading...' : 'Load sample library'}
          </Button>
        </div>
      )}

      <div className='grid gap-8 xl:grid-cols-2'>
        <section className='space-y-4'>
          <div><h2 className='text-sm font-semibold'>Categories and KPIs</h2><p className='text-xs text-muted-foreground'>Build the reusable performance measure library.</p></div>
          <form className='flex gap-2' onSubmit={(event) => {
            event.preventDefault();
            run(() => createCategory.mutateAsync({ name: categoryName }), 'Category created.').then(() => setCategoryName(''));
          }}>
            <Input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder='Category name' required />
            <Button type='submit' size='icon' title='Add category'><Plus className='size-4' /></Button>
          </form>
          <form className='space-y-3 rounded-md border p-3' onSubmit={(event) => {
            event.preventDefault();
            run(() => createKpi.mutateAsync({
              performance_category_id: Number(categoryId),
              name: kpiName,
              department: kpiDepartment || null,
              type: kpiType,
              is_mandatory: kpiMandatory,
              descriptor_low: descriptorLow || null,
              descriptor_mid: descriptorMid || null,
              descriptor_high: descriptorHigh || null,
            }), 'KPI created.').then(() => { setKpiName(''); setDescriptorLow(''); setDescriptorMid(''); setDescriptorHigh(''); });
          }}>
            <div className='grid grid-cols-2 gap-2'>
              <select className={selectClass} value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required aria-label='KPI category'>
                <option value=''>Category</option>
                {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <Input value={kpiName} onChange={(event) => setKpiName(event.target.value)} placeholder='KPI name' required />
              <Input value={kpiDepartment} onChange={(event) => setKpiDepartment(event.target.value)} placeholder='Department tag (optional)' />
              <select className={selectClass} value={kpiType} onChange={(event) => setKpiType(event.target.value)} aria-label='Measurement type'>
                <option value='qualitative'>Qualitative</option>
                <option value='quantitative'>Quantitative</option>
              </select>
            </div>
            <div className='grid gap-2'>
              <Input value={descriptorLow} onChange={(event) => setDescriptorLow(event.target.value)} placeholder='Low (1) descriptor — what poor looks like' />
              <Input value={descriptorMid} onChange={(event) => setDescriptorMid(event.target.value)} placeholder='Mid (3) descriptor — what solid looks like' />
              <Input value={descriptorHigh} onChange={(event) => setDescriptorHigh(event.target.value)} placeholder='High (5) descriptor — what excellent looks like' />
            </div>
            <div className='flex items-center justify-between'>
              <label className='flex items-center gap-2 text-sm'>
                <input type='checkbox' checked={kpiMandatory} onChange={(event) => setKpiMandatory(event.target.checked)} className='size-4 accent-fruition-600' />
                Mandatory in reviews
              </label>
              <Button type='submit' size='sm'><Plus className='size-4' /> Add KPI</Button>
            </div>
          </form>
          <ul className='max-h-80 divide-y overflow-y-auto rounded-md border'>
            {kpis.map((kpi) => (
              <li key={kpi.id} className='px-3 py-2 text-sm'>
                <span className='font-medium'>{kpi.name}</span>
                <span className='ml-2 text-xs text-muted-foreground'>
                  {kpi.category.name}{kpi.department ? ` · ${kpi.department}` : ''} · {kpi.type}{kpi.is_mandatory ? '' : ' · optional'}
                </span>
              </li>
            ))}
            {kpis.length === 0 && <li className='px-3 py-6 text-center text-sm text-muted-foreground'>No KPIs configured.</li>}
          </ul>
        </section>

        <section className='space-y-4'>
          <div><h2 className='text-sm font-semibold'>Rating scale and templates</h2><p className='text-xs text-muted-foreground'>Weights must total exactly 100% before a template can be used.</p></div>
          <div className='flex items-center justify-between rounded-md border px-3 py-3'>
            <div><p className='text-sm font-medium'>Percentage grade scale</p><p className='text-xs text-muted-foreground'>Poor through Outstanding</p></div>
            <Button
              variant='outline'
              size='sm'
              disabled={scales.length > 0 || createScale.isPending}
              onClick={() => run(() => createScale.mutateAsync({
                name: 'Percentage grades',
                options: [
                  { label: 'Poor', min_score_basis_points: 0, max_score_basis_points: 4999 },
                  { label: 'Fair', min_score_basis_points: 5000, max_score_basis_points: 5999 },
                  { label: 'Good', min_score_basis_points: 6000, max_score_basis_points: 6999 },
                  { label: 'Very Good', min_score_basis_points: 7000, max_score_basis_points: 7999 },
                  { label: 'Excellent', min_score_basis_points: 8000, max_score_basis_points: 8999 },
                  { label: 'Outstanding', min_score_basis_points: 9000, max_score_basis_points: 10000 },
                ],
              }), 'Rating scale created.')}
            >
              {scales.length > 0 ? 'Configured' : 'Create scale'}
            </Button>
          </div>
          <form className='space-y-3 rounded-md border p-3' onSubmit={(event) => {
            event.preventDefault();
            const items = kpis.map((kpi) => ({ performance_kpi_id: kpi.id, weight: Number(weights[kpi.id] || 0), is_mandatory: kpi.is_mandatory })).filter((item) => item.weight > 0);
            run(() => createTemplate.mutateAsync({
              name: templateName,
              rating_scale_id: Number(scaleId),
              min_passing_basis_points: minPassing === '' ? null : Math.round(Number(minPassing) * 100),
              items,
            }), 'Appraisal template created.');
          }}>
            <div className='grid grid-cols-3 gap-3'>
              <div className='grid gap-2'><Label>Template name</Label><Input value={templateName} onChange={(event) => setTemplateName(event.target.value)} required /></div>
              <div className='grid gap-2'><Label>Rating scale</Label><select className={selectClass} value={scaleId} onChange={(event) => setScaleId(event.target.value)} required><option value=''>Select scale</option>{scales.map((scale) => <option key={scale.id} value={scale.id}>{scale.name}</option>)}</select></div>
              <div className='grid gap-2'><Label>Passing score %</Label><Input type='number' min={0} max={100} value={minPassing} onChange={(event) => setMinPassing(event.target.value)} placeholder='e.g. 50' /></div>
            </div>
            <p className='text-xs text-muted-foreground'>Scores below the passing floor automatically suggest a performance improvement plan.</p>
            <div className='max-h-64 divide-y overflow-y-auto rounded-md border'>
              {kpis.map((kpi) => (
                <div key={kpi.id} className='grid grid-cols-[1fr_90px] items-center gap-3 px-3 py-2'>
                  <span className='text-sm'>{kpi.name}<span className='ml-1 text-xs text-muted-foreground'>{kpi.department ? `(${kpi.department})` : ''}</span></span>
                  <Input type='number' min={0} max={100} value={weights[kpi.id] ?? ''} onChange={(event) => setWeights((current) => ({ ...current, [kpi.id]: event.target.value }))} placeholder='Weight %' />
                </div>
              ))}
            </div>
            <div className='flex items-center justify-between'>
              <span className={'text-sm font-medium ' + (totalWeight === 100 ? 'text-fruition-700' : 'text-amber-700')}>Total: {totalWeight}%</span>
              <Button type='submit' disabled={totalWeight !== 100 || createTemplate.isPending}>Create template</Button>
            </div>
          </form>
          <ul className='divide-y rounded-md border'>
            {templates.map((template) => (
              <li key={template.id} className='flex items-center justify-between px-3 py-2 text-sm'>
                <span>
                  <span className='font-medium'>{template.name}</span>
                  {template.target_role && <span className='ml-2 text-xs text-muted-foreground'>{template.target_role}</span>}
                </span>
                <span className='flex items-center gap-2'>
                  <span className='text-xs text-muted-foreground'>{template.items.length} KPIs{template.min_passing_basis_points !== null ? ` · pass ≥ ${(template.min_passing_basis_points / 100).toFixed(0)}%` : ''}</span>
                  <Button size='icon-sm' variant='ghost' title='Clone template' disabled={cloneTemplate.isPending} onClick={() => run(() => cloneTemplate.mutateAsync(template.id), 'Template cloned as a new draft.')}><Copy className='size-4' /></Button>
                </span>
              </li>
            ))}
            {templates.length === 0 && <li className='px-3 py-6 text-center text-sm text-muted-foreground'>No templates configured.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
