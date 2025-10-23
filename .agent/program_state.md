## Strategi Rendering

**Apa yang diterapkan:**
- Hybrid rendering dengan kombinasi Server-Side Rendering (SSR), Client-Side Rendering (CSR), dan Static Site Generation (SSG)
- Dynamic imports dengan code splitting untuk komponen-komponen berat
- Progressive rendering dengan loading states dan error boundaries
- Force-dynamic rendering untuk halaman user-specific
- React.memo pada komponen yang sering re-render untuk optimasi rendering
- useMemo untuk komputasi berat dan useCallback untuk event handlers
- Optimasi loading states dengan skeleton components

**Dimana diterapkan:**
- SSR: Layout utama ([`src/app/layout.tsx`](src/app/layout.tsx:1)), halaman auth ([`src/app/auth/page.tsx`](src/app/auth/page.tsx:1))
- CSR: Assessment ([`src/app/assessment/page.tsx`](src/app/assessment/page.tsx:1)), Profile ([`src/app/profile/page.tsx`](src/app/profile/page.tsx:1)), Results ([`src/app/results/[id]/page.tsx`](src/app/results/[id]/page.tsx:1))
- Dynamic imports: Dashboard components ([`src/components/dashboard/DashboardClient.tsx`](src/components/dashboard/DashboardClient.tsx:1)), Results charts ([`src/components/results/ResultsPageClient.tsx`](src/components/results/ResultsPageClient.tsx:22))
- Force-dynamic: Dashboard ([`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx:66))
- React.memo dan useCallback: AssessmentQuestionCard ([`src/components/assessment/AssessmentQuestionCard.tsx`](src/components/assessment/AssessmentQuestionCard.tsx:1)), AssessmentSidebar ([`src/components/assessment/AssessmentSidebar.tsx`](src/components/assessment/AssessmentSidebar.tsx:1))
- useMemo dan useCallback: DashboardClient ([`src/components/dashboard/DashboardClient.tsx`](src/components/dashboard/DashboardClient.tsx:1)), ResultsPageClient ([`src/components/results/ResultsPageClient.tsx`](src/components/results/ResultsPageClient.tsx:1))

**Konsep best practice yang jadi acuan development:**
- Next.js 15 App Router patterns dengan proper metadata dan SEO optimization
- Performance optimization dengan lazy loading dan code splitting
- Progressive enhancement dengan fallback UI dan error boundaries
- Accessibility compliance dengan semantic HTML dan proper ARIA labels

## Strategi Routing

**Apa yang diterapkan:**
- Next.js 15 App Router dengan file-based routing system
- Hybrid routing dengan kombinasi static dan dynamic routes
- Nested routes untuk hasil assessment dengan parameter `[id]`
- Client-side navigation dengan Next.js Link component
- Dynamic imports untuk code splitting pada route level

**Dimana diterapkan:**
- Static routes: Auth ([`src/app/auth/page.tsx`](src/app/auth/page.tsx:1)), Dashboard ([`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx:1))
- Dynamic routes: Results ([`src/app/results/[id]/page.tsx`](src/app/results/[id]/page.tsx:1)), Assessment ([`src/app/assessment/page.tsx`](src/app/assessment/page.tsx:1))
- Nested routes: Results sub-pages ([`src/app/results/[id]/chat/page.tsx`](src/app/results/[id]/chat/page.tsx:1), [`src/app/results/[id]/ocean/page.tsx`](src/app/results/[id]/ocean/page.tsx:1))
- Dynamic imports: Results components ([`src/app/results/[id]/page.tsx`](src/app/results/[id]/page.tsx:9))

**Konsep best practice yang jadi acuan development:**
- Next.js 15 App Router conventions dengan proper metadata dan SEO
- Route-based code splitting untuk optimal loading performance
- Consistent loading dan error states across all routes
- Proper route protection dengan authentication checks
- Responsive design dengan mobile-first approach pada routing

## Strategi State Management

**Apa yang diterapkan:**
- React Context API untuk global state management (AuthContext)
- Custom hooks untuk domain-specific state logic
- Local state dengan useState untuk component-level state
- localStorage untuk client-side persistence dengan debouncing optimization
- Session storage untuk temporary data sharing
- React.memo dan useCallback untuk mencegah re-render yang tidak perlu
- Proper cleanup pada useEffect hooks dengan abort controllers
- State colocation untuk mengurangi re-render global
- Optimistic updates untuk better UX

**Dimana diterapkan:**
- Global auth state: AuthContext ([`src/contexts/AuthContext.tsx`](src/contexts/AuthContext.tsx:1)) dengan useCallback dan cleanup
- Assessment state: useAssessmentData hook ([`src/hooks/useAssessmentData.ts`](src/hooks/useAssessmentData.ts:1)) dengan abort controller
- Flagged questions: useFlaggedQuestions hook ([`src/hooks/useFlaggedQuestions.tsx`](src/hooks/useFlaggedQuestions.tsx:1)) dengan useCallback
- Token management: TokenManager class ([`src/services/authService.ts`](src/services/authService.ts:166))
- Component state: DashboardClient ([`src/components/dashboard/DashboardClient.tsx`](src/components/dashboard/DashboardClient.tsx:147)) dengan useMemo
- Optimized components: AssessmentQuestionCard ([`src/components/assessment/AssessmentQuestionCard.tsx`](src/components/assessment/AssessmentQuestionCard.tsx:6)) dan AssessmentSidebar ([`src/components/assessment/AssessmentSidebar.tsx`](src/components/assessment/AssessmentSidebar.tsx:14))
- Debounced localStorage: localStorageUtils ([`src/utils/localStorageUtils.ts`](src/utils/localStorageUtils.ts:1))
- State colocation: AuthContext ([`src/contexts/AuthContext.tsx`](src/contexts/AuthContext.tsx:1)), useAssessmentData ([`src/hooks/useAssessmentData.ts`](src/hooks/useAssessmentData.ts:1)), useFlaggedQuestions ([`src/hooks/useFlaggedQuestions.tsx`](src/hooks/useFlaggedQuestions.tsx:1))

**Konsep best practice yang jadi acuan development:**
- Separation of concerns dengan domain-specific hooks
- State colocation dengan component yang membutuhkan
- Consistent error handling dan loading states
- Data persistence dengan proper fallback mechanisms
- Optimistic updates untuk better UX
- React.memo untuk komponen yang sering re-render tanpa perubahan props
- useMemo untuk komputasi berat dan useCallback untuk event handlers
- Proper cleanup dengan abort controllers dan isMounted flags
- Phase 1 Quick Wins optimization completed ([`docs/optimasi-strategi-implementasi.md`](docs/optimasi-strategi-implementasi.md:1))

## Strategi Data Fetching

**Apa yang diterapkan:**
- Custom hooks dengan consistent error handling dan loading states
- Axios interceptors untuk automatic token refresh
- Server-side fetching dengan Next.js App Router
- Client-side fetching dengan SWR-like patterns
- Fallback mechanisms dengan dummy data untuk development
- Enhanced error boundaries dengan retry logic dan exponential backoff
- Proper cleanup untuk abort pending requests

**Dimana diterapkan:**
- Authentication: authService dengan interceptors ([`src/services/authService.ts`](src/services/authService.ts:238))
- Assessment data: useAssessmentData hook ([`src/hooks/useAssessmentData.ts`](src/hooks/useAssessmentData.ts:17)) dengan abort controller
- Profile data: AuthContext integration ([`src/contexts/AuthContext.tsx`](src/contexts/AuthContext.tsx:88))
- Static data: useStaticData hook ([`src/hooks/useAssessmentData.ts`](src/hooks/useAssessmentData.ts:122))
- Dashboard data: Static generation dengan dynamic client data ([`src/app/dashboard/page.tsx`](src/app/dashboard/page.tsx:20))
- Error boundaries: Enhanced ErrorBoundary ([`src/components/ErrorBoundary.tsx`](src/components/ErrorBoundary.tsx:38)) dengan retry logic

**Konsep best practice yang jadi acuan development:**
- Consistent error boundaries dan fallback UI
- Proper loading states dengan skeleton components
- Data fetching patterns yang reusable melalui custom hooks
- Automatic retry mechanisms dengan exponential backoff
- Graceful degradation dengan dummy data fallbacks
- Abort controllers untuk cleanup pending requests

## Strategi Caching

**Apa yang diterapkan:**
- Next.js built-in caching dengan ISR dan static generation
- Client-side caching dengan localStorage dan sessionStorage
- HTTP caching headers untuk static assets
- Service worker untuk offline capabilities
- Cache invalidation strategies untuk dynamic content

**Dimana diterapkan:**
- Static assets: Long-term caching headers ([`next.config.mjs`](next.config.mjs:84))
- API responses: Medium-term caching ([`next.config.mjs`](next.config.mjs:127))
- Assessment results: Cache tags dan revalidation ([`src/hooks/useAssessmentData.ts`](src/hooks/useAssessmentData.ts:42))
- Auth tokens: localStorage dengan expiration checks ([`src/services/authService.ts`](src/services/authService.ts:166))
- Images: Next.js Image optimization dengan CDN ([`next.config.mjs`](next.config.mjs:20))

**Konsep best practice yang jadi acuan development:**
- Cache hierarchy dengan appropriate TTL values
- Stale-while-revalidate patterns untuk better UX
- Cache invalidation pada data mutations
- Progressive loading dengan cache-first strategies
- Offline-first approach dengan service worker