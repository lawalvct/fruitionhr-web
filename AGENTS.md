<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# fruitionhr-web — Next.js frontend

All web surfaces of the FruitionHR multi-tenant HR & Payroll SaaS. Next.js 16 (App Router, Turbopack), TypeScript strict, Tailwind 4, shadcn/ui (**Base UI, not Radix** — components use `render={<X />}` instead of `asChild`), TanStack Query 5, React Hook Form + Zod 4. Sibling repo: `../fruitionhr-api` (Laravel). Cross-repo rules: `../CLAUDE.md`; architecture: `../fruitionhr_architecture_plan.md`.

## Known Next.js 16 gotchas (verified in this repo)

- `middleware.ts` is deprecated → this repo uses `src/proxy.ts` exporting `proxy()`.
- Zod 4: use `z.email()` (top-level), not `z.string().email()`.

## Commands

```
npm run dev      # http://localhost:3000 (localhost = tenant surface)
npm run build    # includes typecheck — run before committing
```

API must be running: `cd ../fruitionhr-api && php artisan serve --port=8010`.

## Surfaces & routing

`src/proxy.ts` rewrites by host, keeping the visible URL clean:

| Host | Internal prefix | Folder |
|---|---|---|
| fruitionhr.com / fruitionhr.test | (none) | `src/app/(marketing)/` |
| app.* + `localhost` (dev) | `/app` | `src/app/app/` |
| admin.* | `/admin` | `src/app/admin/` |

Local dev without hosts entries (browsers resolve `*.localhost` to loopback automatically): `localhost:3000` = marketing website, `app.localhost:3000` = tenant app, `admin.localhost:3000` = super admin. Any host that isn't `app.*`/`admin.*` falls through to marketing — which is also why the Vercel default domain shows the website.

Brand: `fruition-*` colour scale + per-surface themes are defined in `globals.css`; full spec in `../fruitionhr_brand_theme.md`. Marketing CTA links to the app come from `src/lib/site.ts` (`NEXT_PUBLIC_APP_URL`).

Inside a surface, always link with host-relative paths (`/dashboard`, `/login`) — never include the internal `/app` or `/admin` prefix.

## Structure & conventions

- `src/features/<module>/` mirrors the API's `app/Modules/<Module>` one-to-one (auth, employees, payroll, leave, …). Pages stay thin; logic lives in features.
- Server state only via TanStack Query hooks in features (`useMe`, etc.). Auth: `useMe()/useLogin()/useLogout()` in `features/auth/use-auth.ts`.
- API calls go through `src/lib/api.ts` (axios, `withCredentials`, CSRF via `ensureCsrf()` before the first mutation). Never call fetch/axios directly elsewhere.
- Protected layouts wrap in `<RequireAuth>` (`superAdminOnly` for admin). Permission-gate UI with `<Can permission="payroll.approve">` — UX only, the API enforces.
- Types in `src/types/` are hand-written until OpenAPI generation lands; API JSON is snake_case — keep types matching, no renaming.
- Money from the API is integer kobo — format for display only, never do arithmetic in floats.

