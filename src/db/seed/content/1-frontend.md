@track Frontend Engineering | 🎨 | JavaScript, React, the browser and everything it takes to ship fast, accessible, secure UIs.

@topic JavaScript Fundamentals | ⚡ | beginner | javascript, core
@summary Types, scope, closures, `this`, prototypes and the event loop: the questions every frontend loop starts with.

@section concept
JavaScript is a single-threaded, dynamically typed, prototype-based language with first-class functions. Almost every "tricky" interview question comes back to four mechanics: **scope and closures**, **how `this` is bound**, **prototypal inheritance**, and **the event loop**. If you can explain those from first principles, you can reason through any output-prediction question instead of memorising answers.

@section fundamentals
- **Types**: 7 primitives (`string`, `number`, `bigint`, `boolean`, `undefined`, `symbol`, `null`) plus `object`. Primitives are copied by value; objects by reference.
- **`var` / `let` / `const`**: `var` is function-scoped and hoisted as `undefined`; `let`/`const` are block-scoped and live in the *temporal dead zone* until declared.
- **Equality**: `===` compares without coercion. `==` coerces (`null == undefined` is `true`, `0 == ''` is `true`). Default to `===`.
- **Truthiness**: falsy values are `false, 0, -0, 0n, '', null, undefined, NaN`. Everything else, including `[]` and `{}`, is truthy.
- **Functions**: declarations are hoisted fully; function expressions and arrows are not. Arrows have no own `this`, `arguments` or `prototype`.
- **Closures**: a function keeps access to the variables of the scope where it was *defined*, even after that scope returns.
- **`this`**: decided at *call time*: `new` > explicit (`call/apply/bind`) > implicit (`obj.fn()`) > default (`undefined` in strict mode, `globalThis` otherwise).

@section advanced
- **Event loop**: call stack runs to completion, then *all* microtasks (promise callbacks, `queueMicrotask`, `MutationObserver`) drain, then the browser may render, then one macrotask (`setTimeout`, I/O, events) runs.
- **Prototype chain**: property lookup walks `obj → obj.__proto__ → … → Object.prototype → null`. `class` is syntax sugar over this.
- **Memory & GC**: mark-and-sweep from roots. Leaks come from forgotten timers, detached DOM nodes kept in closures, global caches and listeners never removed. `WeakMap`/`WeakRef` help.
- **Iterators & generators**: `Symbol.iterator` powers `for…of`, spread and destructuring; generators are pausable functions that make lazy sequences easy.
- **Property descriptors**: `writable`, `enumerable`, `configurable`, getters/setters, `Object.freeze` (shallow!).

@section examples
```js
// Classic closure-in-loop question
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3 3 3
for (let j = 0; j < 3; j++) setTimeout(() => console.log(j)); // 0 1 2

// Event loop ordering
console.log('A');
setTimeout(() => console.log('B'));
Promise.resolve().then(() => console.log('C'));
console.log('D');
// A D C B

// Implement debounce: a closure holding the timer
function debounce(fn, wait) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
```

@section useCases
- Closures power module patterns, memoisation, `debounce`/`throttle` and React hooks' captured state.
- Understanding the event loop explains why a long `for` loop freezes the UI and why `await` in a loop is sequential.
- Prototype knowledge matters when reading library code, polyfilling, or debugging `instanceof` across iframes.

@section mistakes
- Saying "JavaScript is pass-by-reference". It is always pass-by-value; for objects, the *value* is a reference.
- Thinking `setTimeout(fn, 0)` runs immediately; it waits for the stack and all microtasks.
- Losing `this` when passing methods as callbacks (`button.onclick = obj.handle`).
- Believing `const` makes objects immutable; it only prevents rebinding.
- `typeof null === 'object'` is a historic bug, not proof that null is an object.

@q beginner | What is a closure? Give a practical example.
A closure is a function bundled with references to the variables in its lexical scope. The inner function can read and update those variables even after the outer function has returned.

```js
function counter() {
  let count = 0;
  return { inc: () => ++count, get: () => count };
}
const c = counter(); c.inc(); c.get(); // 1
```
Practical uses: data privacy, memoisation caches, `debounce`, partial application, and React hooks capturing props/state.
@followups
- What is a *stale closure* in React and how do you fix it?
- How can closures cause memory leaks?
- Rewrite the `var` loop example so it prints 0 1 2 without using `let`.

@q intermediate | Explain the event loop, microtasks and macrotasks.
JS runs one call stack to completion. When it is empty, the engine drains the **microtask queue** completely (promise reactions, `queueMicrotask`, `MutationObserver`). The browser then gets a chance to **render** (rAF callbacks, style, layout, paint). Then it takes **one macrotask** (timers, events, message channel, I/O) and repeats.

Consequences: promise callbacks always run before `setTimeout(…, 0)`; an infinite chain of microtasks can starve rendering; heavy synchronous work blocks input and paint.
@followups
- Where does `requestAnimationFrame` fit in?
- How does the Node.js event loop differ (phases, `process.nextTick`, `setImmediate`)?
- How would you break up a long task to keep the UI responsive?

@q intermediate | How is `this` determined in JavaScript?
At call time, by these rules in priority order:
1. **`new` binding**: `this` is the freshly created object.
2. **Explicit**: `fn.call(obj)`, `fn.apply(obj)`, `fn.bind(obj)`.
3. **Implicit**: `obj.fn()` makes `this` `obj`.
4. **Default**: `undefined` in strict mode / modules, otherwise `globalThis`.

Arrow functions ignore all of these and capture `this` lexically from the enclosing scope.
@followups
- What does `bind` return, and can a bound function be re-bound?
- Why do class methods lose `this` when passed as callbacks?

@q advanced | Implement `Promise.all` from scratch.
```js
function promiseAll(iterable) {
  return new Promise((resolve, reject) => {
    const items = Array.from(iterable);
    const results = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) return resolve(results);
    items.forEach((item, i) => {
      Promise.resolve(item).then((value) => {
        results[i] = value;
        if (--remaining === 0) resolve(results);
      }, reject);
    });
  });
}
```
Key points interviewers look for: preserve order by index (not completion order), wrap non-promises with `Promise.resolve`, reject fast on the first failure, handle the empty input case.
@followups
- Implement `Promise.allSettled`, `Promise.race` and `Promise.any`.
- Add a concurrency limit (run at most N at a time).

@checklist
- Explain hoisting and the temporal dead zone with an example
- Predict output of 5 event-loop ordering puzzles without running them
- Implement debounce, throttle, deep clone and curry from memory
- Explain the four `this` binding rules and arrow function behaviour
- Draw the prototype chain for an object created with `class` and `extends`
- Implement Promise.all and a promise pool with a concurrency limit

@resources
- [MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures) docs
- [MDN: The event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop) docs
- [Jake Archibald: In The Loop (JSConf)](https://www.youtube.com/watch?v=cCOL7MC4Pl0) video
- [You Don't Know JS Yet](https://github.com/getify/You-Dont-Know-JS) book

@subtopic Async JavaScript & Promises | 🔁 | intermediate | javascript, async
@summary Callbacks, promises, async/await, error handling and cancellation.

@section concept
Asynchronous JavaScript lets a single thread start work (network, timers, I/O) and continue running while it waits. **Promises** represent a future value with three states (pending, fulfilled, rejected). **`async/await`** is syntax over promises that makes async code read top-to-bottom while still being non-blocking.

@section fundamentals
- A promise settles once; `.then` always runs asynchronously as a microtask.
- `.then` returns a *new* promise, enabling chaining; returning a promise from a handler flattens it.
- `async` functions always return a promise; `await` pauses the function, not the thread.
- Errors: `try/catch` around `await`, or `.catch()` at the end of a chain. Unhandled rejections are reported globally.
- Combinators: `all` (fail fast), `allSettled` (never rejects), `race` (first settled), `any` (first fulfilled).

@section advanced
- **Cancellation** with `AbortController`: pass `signal` to `fetch`, listen for `abort` in custom tasks.
- **Sequential vs parallel**: `await` inside `for` runs sequentially; start promises first, then `await Promise.all`.
- **Async iteration**: `for await…of` over streams and async generators.
- **Race conditions in UIs**: ignore stale responses with a request id or abort the previous request.

@section examples
```js
// Parallel, with timeout and cancellation
async function fetchWithTimeout(url, ms = 5000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

const [user, posts] = await Promise.all([
  fetchWithTimeout('/api/user'),
  fetchWithTimeout('/api/posts'),
]);
```

@section useCases
- Search-as-you-type that cancels stale requests.
- Retrying flaky requests with exponential backoff.
- Loading independent dashboard widgets in parallel.

@section mistakes
- Forgetting to `return` a promise inside `.then`, breaking the chain.
- Using `forEach` with `async` callbacks and expecting it to wait.
- Swallowing errors with an empty `catch`.
- Treating `fetch` as rejecting on 404/500. It only rejects on network failure.

@q intermediate | What is the difference between `Promise.all`, `allSettled`, `race` and `any`?
- **all**: resolves with every value in order; rejects on the *first* rejection.
- **allSettled**: always resolves with `{status, value | reason}` for each input.
- **race**: settles like the first input to settle, fulfilled or rejected.
- **any**: resolves with the first fulfilment; rejects with `AggregateError` only if all reject.
@followups
- How would you implement a timeout using `race`?
- Which would you use to load optional dashboard widgets?

@q advanced | Write a retry helper with exponential backoff.
```js
async function retry(fn, { retries = 3, base = 200 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries) throw err;
      const delay = base * 2 ** attempt + Math.random() * base; // jitter
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
```
Mention jitter (avoids thundering herd), only retrying idempotent / retryable errors, and respecting `AbortSignal`.
@followups
- Which HTTP status codes are safe to retry?
- How would you make it cancellable?

@checklist
- Convert a callback API to promises
- Explain why `await` in a loop is sequential and fix it
- Cancel a fetch with AbortController
- Implement retry with backoff and jitter

@resources
- [MDN: Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) docs
- [javascript.info: Promises, async/await](https://javascript.info/async) article

@topic TypeScript | 🔷 | intermediate | typescript, core
@summary Structural typing, generics, narrowing and utility types for safer frontends.

@section concept
TypeScript is a **structural**, gradually typed superset of JavaScript. Types are erased at compile time, so they describe the shape of values rather than enforcing anything at runtime. Interviews focus on **generics**, **narrowing**, **union/intersection types**, **utility and conditional types**, and how you model real data (API responses, component props) safely.

@section fundamentals
- `type` vs `interface`: both describe shapes; interfaces can be merged and extended, types can express unions, tuples and mapped/conditional types.
- `unknown` is the safe top type (must narrow before use); `any` disables checking; `never` is the empty type.
- **Narrowing**: `typeof`, `instanceof`, `in`, equality checks, discriminated unions and custom type guards (`x is Foo`).
- **Generics** let functions and components work over many types while preserving relationships (`function first<T>(xs: T[]): T | undefined`).
- Built-in utilities: `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `ReturnType`, `Parameters`, `Awaited`, `NonNullable`.
- `strict` mode (especially `strictNullChecks`) is what makes TypeScript worthwhile.

@section advanced
- **Conditional types** with `infer`: `type ElementType<T> = T extends (infer U)[] ? U : never`.
- **Mapped types** and key remapping: `` { [K in keyof T as `get${Capitalize<K & string>}`]: () => T[K] } ``.
- **Template literal types** for typed routes, event names and CSS units.
- **Variance**: function parameters are checked bivariantly for methods; `in`/`out` annotations exist on generics.
- `satisfies` checks a value against a type without widening its inferred type.
- Declaration merging, module augmentation, and `.d.ts` authoring for untyped libraries.

@section examples
```ts
// Discriminated union + exhaustive check
type Result<T> =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: T };

function render<T>(r: Result<T>) {
  switch (r.status) {
    case 'loading': return 'Loading…';
    case 'error': return r.error;
    case 'success': return JSON.stringify(r.data);
    default: {
      const _exhaustive: never = r;
      return _exhaustive;
    }
  }
}

// Implement your own utility types
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
```

@section useCases
- Typing API responses and validating them at the boundary (zod, valibot) so the types are true at runtime.
- Polymorphic React components (`as` prop) and typed `forwardRef`.
- Typed event emitters, routers and design-system tokens.

@section mistakes
- Assuming types validate runtime data. An API can return anything; parse it.
- Overusing `as` assertions and `!` non-null assertions to silence errors.
- Using `any` in generics instead of constraints (`T extends object`).
- Writing enormous clever types nobody can maintain. Prefer clarity.

@q beginner | What is the difference between `type` and `interface`?
Both describe object shapes and are mostly interchangeable for objects. **Interfaces** support declaration merging and `extends`, and give slightly nicer error messages. **Type aliases** can name *any* type: unions, intersections, tuples, primitives, mapped and conditional types. A common convention: `interface` for public object contracts that may be extended, `type` for everything else.
@followups
- What is declaration merging and when is it useful?
- Can a class implement a type alias?

@q intermediate | What is the difference between `any`, `unknown` and `never`?
- **any** turns off type checking in both directions. Avoid it.
- **unknown** accepts any value but you must narrow it before using it. Ideal for `catch (e)` and untrusted input.
- **never** has no values. It is the return type of functions that throw or loop forever, and the type left after exhaustive narrowing, which makes it great for exhaustiveness checks.
@followups
- How do you type the error in a `catch` block?
- Show an exhaustive switch using `never`.

@q advanced | Implement `ReturnType` and `Awaited` yourself.
```ts
type MyReturnType<F> = F extends (...args: any[]) => infer R ? R : never;
type MyAwaited<T> = T extends PromiseLike<infer U> ? MyAwaited<U> : T;
```
Explain `infer` (captures a type from a position in a pattern), that conditional types distribute over unions when the checked type is a naked type parameter, and that `Awaited` recurses to unwrap nested promises.
@followups
- What is distributive conditional typing and how do you disable it?
- Implement `DeepReadonly<T>`.

@checklist
- Model an API response with a discriminated union
- Implement Pick, Omit, Partial, ReturnType from scratch
- Write a generic, typed `useFetch<T>` hook
- Explain structural typing with an example
- Know when to use `satisfies` vs a type annotation

@resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) docs
- [Type Challenges](https://github.com/type-challenges/type-challenges) repo
- [Total TypeScript tutorials](https://www.totaltypescript.com/tutorials) course

@topic React & React Internals | ⚛️ | intermediate | react, core
@summary Components, hooks, rendering, reconciliation, Fiber and concurrent features.

@section concept
React is a library for building UIs as a function of state: `UI = f(state)`. You describe what the UI should look like; React figures out the minimal DOM changes. Internally, rendering produces a tree of elements, **reconciliation** diffs it against the previous tree, and the **Fiber** architecture splits that work into interruptible units so React can prioritise urgent updates (typing) over less urgent ones (rendering a big list).

@section fundamentals
- **Render vs commit**: the render phase calls your components (must be pure); the commit phase applies DOM changes and runs effects.
- A component re-renders when its **state changes**, its **parent re-renders**, or a **context** it consumes changes. Props changing is a consequence of the parent re-rendering.
- **Keys** give list items stable identity; using an index as key breaks state when items are reordered.
- **Hooks rules**: call them at the top level, in the same order every render, only from components or custom hooks.
- `useState` updates are batched and asynchronous; use the updater form `setX(x => x + 1)` when the next value depends on the previous.
- `useEffect` is for **synchronising with external systems**, not for deriving state.
- `useRef` holds a mutable value that does not trigger re-renders; also used for DOM refs.

@section advanced
- **Reconciliation heuristics**: different element types tear down the subtree; same type updates props; keys match children across renders. This makes diffing O(n).
- **Fiber**: each fiber is a unit of work with links to child/sibling/return. Work can pause, resume, and be discarded. Two trees exist: `current` and `workInProgress` (double buffering).
- **Lanes** model update priority; `startTransition` and `useDeferredValue` mark updates as non-urgent.
- **Suspense** lets components "wait" for data or code; with streaming SSR, the server sends HTML in chunks as boundaries resolve.
- **React Server Components** run only on the server, ship zero JS, and can be async. Client components are marked with `'use client'`.
- **React Compiler** auto-memoises components and hooks, reducing the need for manual `useMemo`/`useCallback`.
- Memoisation: `React.memo`, `useMemo`, `useCallback` only help when referential equality actually prevents work.

@section examples
```jsx
// Derive, don't sync: avoid useEffect + setState for derived data
function TodoList({ todos, filter }) {
  const visible = useMemo(
    () => todos.filter((t) => filter === 'all' || t.status === filter),
    [todos, filter],
  );
  return visible.map((t) => <Todo key={t.id} todo={t} />);
}

// Correct data fetching effect with cleanup to avoid race conditions
function User({ id }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    let ignore = false;
    fetch(`/api/users/${id}`).then((r) => r.json()).then((u) => {
      if (!ignore) setUser(u);
    });
    return () => { ignore = true; };
  }, [id]);
  return user ? <h1>{user.name}</h1> : <Spinner />;
}
```

@section useCases
- Keeping typing responsive while filtering 10k rows with `useDeferredValue`.
- Code-splitting heavy routes with `lazy` + `Suspense`.
- Building a design system of composable, accessible components.

@section mistakes
- Using effects to compute derived state, causing double renders and bugs.
- Mutating state objects/arrays directly instead of creating new ones.
- Wrapping everything in `useMemo`/`useCallback` "for performance" without measuring.
- Index keys on dynamic lists.
- Missing effect dependencies (and silencing the lint rule) leading to stale closures.

@q intermediate | What happens when you call `setState`?
React enqueues an update on the component's fiber and schedules a render with a priority (lane). Multiple updates in the same event are **batched** (automatic batching in React 18+ applies to promises and timeouts too). On render, React calls the component, computes the new element tree, reconciles it against the old one, and in the commit phase applies the minimal DOM mutations, then runs layout effects synchronously and passive effects (`useEffect`) after paint. If the new state is `Object.is` equal to the old, React may bail out.
@followups
- Why does logging state right after `setState` show the old value?
- What is the difference between `useEffect` and `useLayoutEffect`?
- How does `flushSync` change this?

@q intermediate | Why are keys important in lists?
Keys let the reconciler match children between renders. With stable keys, React moves existing DOM nodes and preserves component state when items are reordered, inserted or removed. With index keys, inserting at the top shifts every index, so React reuses the wrong component instances: inputs keep the wrong text, animations glitch, and more DOM work happens. Keys must be stable, unique among siblings and not random per render.
@followups
- When is an index key acceptable?
- How can you use `key` to intentionally reset a component's state?

@q advanced | Explain React Fiber and concurrent rendering.
Fiber is React's reconciler rewrite (React 16). Each component instance has a fiber node, and rendering walks the fiber tree as a loop of small units of work instead of a recursive call stack. Because work is chunked, React can **yield** to the browser, **pause**, **resume**, **abort** and **prioritise** it. Concurrent features (`startTransition`, `useDeferredValue`, Suspense) build on this: urgent updates interrupt in-progress low-priority renders, and the commit phase stays synchronous so users never see a half-updated UI.
@followups
- What are lanes?
- Why must the render phase be pure?
- What does StrictMode's double-invocation catch?

@q advanced | When should you NOT use `useEffect`?
When there's no external system to synchronise with:
- Transforming data for rendering: compute during render (or `useMemo`).
- Responding to user events: do it in the event handler.
- Resetting state when a prop changes: use a `key`.
- Chained state updates: compute next state in one handler.
- Fetching in effects is OK but a framework or a library (React Query, RSC) handles caching, races and dedupe better.
@followups
- How do you notify a parent about a state change without an effect?

@checklist
- Explain render vs commit phase and when effects run
- Explain reconciliation and why keys matter
- Know when React.memo / useMemo / useCallback actually help
- Build a custom hook (useDebounce, useLocalStorage) with correct deps
- Explain Fiber, lanes and concurrent rendering at a high level
- Explain Server Components vs Client Components

@resources
- [react.dev: Learn React](https://react.dev/learn) docs
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) docs
- [React Fiber Architecture (acdlite)](https://github.com/acdlite/react-fiber-architecture) repo

@subtopic React Hooks Deep Dive | 🪝 | intermediate | react, hooks
@summary useState, useEffect, useRef, useMemo, useCallback, useReducer, context and custom hooks.

@section concept
Hooks let function components hold state and side effects. React stores hook state in a linked list on the component's fiber, which is why hooks must be called in the same order every render.

@section fundamentals
- `useState` / `useReducer` for local state; reducers shine when transitions are complex.
- `useEffect(fn, deps)` runs after paint; cleanup runs before the next effect and on unmount.
- `useLayoutEffect` runs before paint, for measuring layout.
- `useRef` for mutable values and DOM nodes.
- `useMemo` / `useCallback` cache values / functions between renders by deps.
- `useContext` reads the nearest provider; every consumer re-renders when the value changes.
- `useId`, `useTransition`, `useDeferredValue`, `useSyncExternalStore`, `useOptimistic`, `use`.

@section advanced
- Context performance: split contexts, memoise the value, or use a selector-based store.
- `useSyncExternalStore` is the correct way to subscribe to external stores (avoids tearing).
- Stale closures: use functional updates, refs, or include deps.

@section examples
```js
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => { ref.current = value; }, [value]);
  return ref.current;
}
```

@section useCases
- `useDebounce` for search inputs, `useLocalStorage` for persisted preferences, `useMediaQuery` for responsive logic.

@section mistakes
- Conditional hook calls.
- Object/array literals in deps causing effects to run every render.
- Forgetting cleanup for subscriptions and timers.

@q intermediate | Why can't hooks be called conditionally?
React identifies each hook by its call order in the component. State is stored as an ordered list on the fiber; if a hook is skipped on one render, every subsequent hook reads the wrong slot. That's why the rules require top-level, unconditional calls.
@followups
- How does `use()` differ from other hooks here?

@q intermediate | useMemo vs useCallback vs React.memo?
`useMemo(fn, deps)` caches the **result** of `fn`. `useCallback(fn, deps)` caches the **function itself** (equivalent to `useMemo(() => fn, deps)`). `React.memo(Component)` skips re-rendering a component when its props are shallowly equal. They work together: `useCallback` is mostly useful when passing callbacks to a memoised child or using them as effect deps.
@followups
- When does memoisation make things slower?
- How does the React Compiler change this?

@checklist
- Write useDebounce, usePrevious, useLocalStorage, useOnClickOutside
- Explain stale closures and three ways to fix them
- Know when to use useReducer over useState

@resources
- [react.dev: Hooks reference](https://react.dev/reference/react/hooks) docs

@topic Next.js | ▲ | intermediate | nextjs, react, ssr
@summary App Router, Server Components, rendering strategies, caching and data fetching.

@section concept
Next.js is a React framework that adds routing, server rendering, data fetching, caching, bundling and deployment conventions. With the **App Router**, components are **Server Components** by default, layouts are nested and persistent, and you choose per route between static, dynamic and streaming rendering.

@section fundamentals
- **File-system routing**: `app/blog/[slug]/page.tsx`, with `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` conventions.
- **Server vs Client Components**: server components can be `async`, access databases and secrets, and ship no JS. Add `'use client'` for interactivity and browser APIs.
- **Rendering strategies**: SSG (build time), SSR (per request), ISR (static + revalidate), CSR, and streaming with Suspense.
- **Route Handlers** (`route.ts`) for API endpoints; **Server Actions** for mutations called from forms/components.
- **Middleware / Proxy** runs before a request is handled: auth redirects, rewrites, i18n.
- Built-ins: `next/image` (responsive, lazy images), `next/font` (self-hosted fonts, no layout shift), `next/link` (prefetching).

@section advanced
- **Caching layers**: request memoisation, data cache, full route cache and the client router cache. Know how `revalidatePath` / `revalidateTag` invalidate them.
- **Partial Prerendering / Cache Components**: a static shell with dynamic holes streamed in.
- **Streaming SSR** sends HTML progressively; the client hydrates boundaries as JS arrives (selective hydration).
- Edge vs Node runtimes: edge has lower latency but a restricted API surface.
- Avoiding waterfalls: start fetches in parallel, use `Promise.all`, preload patterns.

@section examples
```tsx
// app/products/[id]/page.tsx (Server Component)
export default async function Product({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id } });
  if (!product) notFound();
  return (
    <>
      <h1>{product.name}</h1>
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews productId={id} />
      </Suspense>
      <AddToCart id={id} /> {/* 'use client' component */}
    </>
  );
}
```

@section useCases
- Marketing pages statically generated, dashboards rendered dynamically.
- E-commerce product pages with ISR so prices update without full rebuilds.
- Auth-protected routes enforced in middleware/proxy.

@section mistakes
- Adding `'use client'` at the top of the tree, turning everything into client JS.
- Importing server-only code (DB clients, secrets) into client components.
- Confusing hydration errors: rendering `Date.now()` or `window` values differently on server and client.
- Not understanding which fetches are cached.

@q intermediate | Explain SSR, SSG, ISR and CSR. When would you use each?
- **SSG**: HTML built once at build time. Fastest, cacheable on a CDN. Docs, blogs, marketing.
- **SSR**: HTML rendered per request. Fresh and personalised, higher TTFB and server cost. Dashboards, personalised feeds.
- **ISR**: static pages regenerated in the background after a revalidate interval or on demand. Catalogs, content sites.
- **CSR**: server sends a shell, browser fetches data. Highly interactive apps behind login where SEO doesn't matter.
Modern Next.js mixes these per route and even per component (static shell + streamed dynamic parts).
@followups
- What is hydration and what causes hydration mismatches?
- How does streaming improve TTFB and FCP?

@q intermediate | What are React Server Components and how do they differ from SSR?
SSR renders *client* components to HTML on the server, then ships all their JS to hydrate. **RSC** are components that only ever run on the server; their output is a serialised tree (the RSC payload) that the client merges into the UI. Their code and dependencies never reach the browser, they can be async and access back-end resources directly. RSC and SSR are complementary: Next.js uses SSR to turn the RSC payload + client components into initial HTML.
@followups
- What can and can't you pass from a server component to a client component as props?
- How do server actions work?

@checklist
- Explain App Router file conventions (layout, page, loading, error)
- Explain server vs client components and the serialisation boundary
- Explain the Next.js caching layers and how to revalidate
- Build a route handler and a server action with validation
- Debug a hydration mismatch

@resources
- [Next.js Docs](https://nextjs.org/docs) docs
- [Next.js Learn course](https://nextjs.org/learn) course

@topic Browser Internals & Web APIs | 🌐 | intermediate | browser, web-apis
@summary From URL to pixels, the rendering pipeline, storage, workers and the event model.

@section concept
Knowing how the browser works lets you reason about performance and bugs rather than guessing. The classic question "what happens when you type a URL and press enter?" touches DNS, TCP/TLS, HTTP, parsing, the critical rendering path, and the event loop.

@section fundamentals
- **Navigation**: DNS lookup → TCP handshake → TLS → HTTP request → response → parse HTML.
- **Critical rendering path**: HTML → DOM, CSS → CSSOM, combined into the render tree → layout → paint → composite.
- CSS is **render-blocking**; synchronous scripts are **parser-blocking**. Use `defer`/`async`/`type="module"`.
- **Event model**: capture → target → bubble. `event.stopPropagation()`, `preventDefault()`, event delegation.
- **Storage**: cookies (sent with requests, 4KB), `localStorage` (sync, ~5MB, strings), `sessionStorage` (per tab), IndexedDB (async, large, structured), Cache API.
- Browser process model: browser process, renderer processes (site isolation), GPU process, network service.

@section advanced
- **Web Workers** run JS off the main thread (no DOM); **Service Workers** are network proxies enabling offline and push; **Shared Workers** across tabs.
- **Observers**: `IntersectionObserver` (lazy loading, infinite scroll), `ResizeObserver`, `MutationObserver`, `PerformanceObserver`.
- **Compositing**: `transform` and `opacity` changes can skip layout and paint and run on the compositor thread.
- **CORS** is enforced by the browser: preflight `OPTIONS` for non-simple requests.
- **Same-origin policy**, `postMessage` for cross-origin communication.

@section examples
```js
// Event delegation: one listener for many items
document.querySelector('#list').addEventListener('click', (e) => {
  const item = e.target.closest('[data-id]');
  if (item) select(item.dataset.id);
});

// Lazy-load images with IntersectionObserver
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) {
      e.target.src = e.target.dataset.src;
      io.unobserve(e.target);
    }
  }
}, { rootMargin: '200px' });
document.querySelectorAll('img[data-src]').forEach((img) => io.observe(img));
```

@section useCases
- Offloading image processing or CSV parsing to a Web Worker.
- Offline-capable PWAs with a Service Worker cache.
- Infinite scrolling with IntersectionObserver instead of scroll listeners.

@section mistakes
- Storing auth tokens in `localStorage` (readable by any XSS).
- Attaching listeners to thousands of nodes instead of delegating.
- Thinking `async` scripts preserve execution order (they don't; `defer` does).

@q intermediate | What happens when you type a URL and press Enter?
1. URL parsing, HSTS check, cache lookup (service worker, HTTP cache).
2. DNS resolution (browser, OS, resolver caches, then recursive lookup).
3. TCP handshake and TLS negotiation (or QUIC for HTTP/3).
4. HTTP request; server responds (maybe redirects, compression, caching headers).
5. HTML parsing builds the DOM; discovered CSS/JS/images fetched (preload scanner).
6. CSSOM built; render tree, layout, paint, composite.
7. JS executes, events fire (`DOMContentLoaded`, `load`), page becomes interactive.
Tailor depth to the role: for frontend, go deep on 5–7.
@followups
- What is the preload scanner?
- How do `async` and `defer` differ?
- What is the difference between DOMContentLoaded and load?

@q intermediate | Compare cookies, localStorage, sessionStorage and IndexedDB.
- **Cookies**: small (~4KB), sent with every matching request, can be `HttpOnly`, `Secure`, `SameSite`. Best for session identifiers.
- **localStorage**: ~5MB per origin, synchronous, strings only, persists. Preferences, non-sensitive cache.
- **sessionStorage**: like localStorage but per tab and cleared when the tab closes.
- **IndexedDB**: async, large, structured data with indexes and transactions. Offline data.
@followups
- Why is synchronous storage a performance concern?
- How would you sync state across tabs?

@checklist
- Explain URL to pixels end to end
- Explain event capturing, bubbling and delegation
- Use IntersectionObserver and a Web Worker in a demo
- Explain CORS and preflight requests

@resources
- [How browsers work (web.dev)](https://web.dev/articles/howbrowserswork) article
- [Inside look at modern web browser](https://developer.chrome.com/blog/inside-browser-part1) article
- [MDN: Web APIs](https://developer.mozilla.org/en-US/docs/Web/API) docs

@topic HTML, CSS & Rendering | 🖌️ | beginner | html, css, a11y
@summary Semantic HTML, accessibility, the box model, layout systems, specificity and reflow/repaint.

@section concept
HTML gives content structure and meaning, CSS controls presentation, and the browser's rendering engine turns both into pixels. Interviews test **semantics and accessibility**, the **box model**, **layout (flexbox, grid, positioning)**, **specificity and the cascade**, and what triggers **layout vs paint vs composite**.

@section fundamentals
- **Semantic HTML**: `header`, `nav`, `main`, `article`, `section`, `button` vs `div`. Semantics give accessibility and SEO for free.
- **Box model**: content + padding + border + margin. `box-sizing: border-box` includes padding and border in width.
- **Specificity**: inline > id > class/attribute/pseudo-class > element. `!important` overrides; `:where()` has zero specificity.
- **Positioning**: `static`, `relative`, `absolute` (relative to nearest positioned ancestor), `fixed`, `sticky`.
- **Flexbox** for one-dimensional layout, **Grid** for two-dimensional layout.
- **Stacking contexts**: created by `position` + `z-index`, `opacity < 1`, `transform`, etc. `z-index` only compares within a context.
- Responsive design: fluid units, media queries, container queries, `clamp()`.

@section advanced
- **Reflow (layout)** is triggered by geometry changes; **repaint** by visual changes; **composite-only** for `transform`/`opacity`.
- **Layout thrashing**: interleaving DOM reads (`offsetHeight`) and writes forces synchronous layout. Batch reads then writes.
- **Accessibility**: ARIA roles only when native semantics are missing, focus management, keyboard navigation, colour contrast, `prefers-reduced-motion`.
- Modern CSS: `:has()`, cascade layers (`@layer`), container queries, logical properties, `content-visibility`.
- BFC (block formatting context) explains margin collapsing and float containment.

@section examples
```css
/* Centering: the eternal question */
.parent { display: grid; place-items: center; }

/* Responsive card grid without media queries */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

/* Animate cheaply: compositor-only properties */
.toast { transition: transform 200ms ease, opacity 200ms ease; }
.toast[hidden] { transform: translateY(8px); opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
```

@section useCases
- Building accessible modals: focus trap, `aria-modal`, Escape to close, return focus.
- Responsive dashboards with CSS Grid and container queries.
- Smooth 60fps animations using transforms.

@section mistakes
- Clickable `div`s without keyboard support or roles. Use `<button>`.
- Fighting `z-index` without understanding stacking contexts.
- Animating `top/left/width/height` instead of `transform`.
- Removing focus outlines without providing an alternative.

@q beginner | Explain the CSS box model and `box-sizing`.
Every element is a box of **content**, **padding**, **border** and **margin**. With the default `box-sizing: content-box`, `width` applies only to the content, so padding and border add to the rendered size. With `border-box`, `width` includes content + padding + border, which makes layouts far easier to reason about. Vertical margins between blocks can collapse.
@followups
- When do margins collapse?
- What is a block formatting context?

@q intermediate | What is the difference between reflow and repaint? How do you avoid layout thrashing?
**Reflow/layout** recalculates geometry (size, position) and can cascade through the tree; **repaint** redraws pixels without geometry changes (colour, shadow). Changing `transform`/`opacity` on a composited layer can skip both. **Layout thrashing** happens when you alternate reads (`getBoundingClientRect`, `offsetTop`) and writes in a loop, forcing synchronous layout each time. Fix by batching reads first, then writes, or using `requestAnimationFrame`.
@followups
- What does `will-change` do and when is it harmful?
- How would you profile this in DevTools?

@q intermediate | How do you make a custom component accessible?
Prefer native elements first. If you must build custom, add the correct `role`, keyboard interaction (Tab, Enter, Space, arrows, Escape per the ARIA Authoring Practices), visible focus styles, `aria-*` state (`aria-expanded`, `aria-selected`), labels (`aria-label`/`aria-labelledby`), and manage focus (move focus into dialogs, return it on close). Test with a screen reader and keyboard only.
@followups
- What is the first rule of ARIA?
- How do you announce dynamic changes (live regions)?

@checklist
- Center an element five different ways
- Explain specificity and calculate it for 3 selectors
- Explain stacking contexts and fix a z-index bug
- Build an accessible modal and dropdown
- Explain reflow vs repaint vs composite

@resources
- [MDN: CSS layout](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout) docs
- [web.dev: Learn Accessibility](https://web.dev/learn/accessibility) course
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) docs

@topic Frontend Performance | 🚀 | advanced | performance, web-vitals
@summary Core Web Vitals, loading, rendering and runtime performance, measured not guessed.

@section concept
Performance is user experience. Measure first with **Core Web Vitals**: **LCP** (loading, < 2.5s), **INP** (responsiveness, < 200ms) and **CLS** (visual stability, < 0.1). Then optimise the right bottleneck: network (bytes and round-trips), main-thread work (JS), or rendering.

@section fundamentals
- **Lab vs field data**: Lighthouse is lab; CrUX / RUM is real users. Optimise for field p75.
- **Reduce bytes**: compression (Brotli), minification, tree shaking, code splitting, modern image formats (AVIF/WebP), responsive images.
- **Reduce round-trips**: HTTP/2/3, preconnect, preload critical assets, CDN caching, avoid request chains.
- **Caching**: `Cache-Control`, immutable hashed assets, `stale-while-revalidate`.
- **Rendering**: inline critical CSS, defer non-critical JS, avoid render-blocking resources.
- **Images**: set width/height (prevents CLS), lazy-load below the fold, `fetchpriority="high"` for the LCP image.

@section advanced
- **INP**: break long tasks (> 50ms) with `scheduler.yield()` / `setTimeout`, move work to workers, reduce hydration cost.
- **Virtualisation** for long lists (render only visible rows).
- **Bundle analysis**: identify heavy deps, dynamic `import()`, avoid barrel-file bloat.
- **React**: avoid unnecessary re-renders (state colocation, memoisation, context splitting), use transitions for expensive updates.
- **Font loading**: `font-display: swap`, subsetting, preloading, size-adjust to reduce CLS.
- **Islands / partial hydration / RSC** to ship less JS.

@section examples
```html
<!-- LCP image: prioritise it, don't lazy-load it -->
<img src="/hero.avif" width="1200" height="600" fetchpriority="high" alt="…" />

<!-- Warm up connections to critical third parties -->
<link rel="preconnect" href="https://cdn.example.com" crossorigin />
```
```js
// Break up a long task to keep INP low
async function processAll(items) {
  for (let i = 0; i < items.length; i++) {
    process(items[i]);
    if (i % 100 === 0) await new Promise((r) => setTimeout(r)); // yield
  }
}
```

@section useCases
- Cutting LCP on a product page by preloading the hero and server-rendering above-the-fold content.
- Fixing INP on a search page by debouncing and deferring list rendering.
- Reducing bundle size 40% by lazy-loading a charting library.

@section mistakes
- Optimising without measuring, or only measuring on a fast laptop.
- Lazy-loading the LCP image.
- Unsized images and late-loading ads causing CLS.
- Shipping entire libraries (moment, lodash) for one function.

@q intermediate | What are Core Web Vitals and how do you improve each?
- **LCP** (largest contentful paint): improve server response, preload/prioritise the hero, optimise images, remove render-blocking resources, use SSR/SSG.
- **INP** (interaction to next paint): reduce long tasks, less JS, yield to the main thread, debounce, avoid heavy re-renders and layout thrashing.
- **CLS** (cumulative layout shift): reserve space for images/embeds/ads, avoid inserting content above existing content, use font metric overrides.
Mention measuring with field data (web-vitals library, CrUX) at p75.
@followups
- Why did INP replace FID?
- How do you find which element is the LCP?

@q advanced | A page feels slow. Walk me through how you'd diagnose it.
1. Reproduce and quantify: which metric, which pages, which devices (field data first).
2. Network panel: TTFB, waterfall, request chains, large assets, cache headers.
3. Performance panel: long tasks, scripting vs rendering time, layout thrashing, hydration cost.
4. Bundle analyser: what's in the JS, what can be split or removed.
5. React Profiler: components rendering too often or too slowly.
6. Fix the biggest bottleneck, re-measure, add monitoring/budgets in CI to prevent regressions.
@followups
- How would you set up performance budgets?
- How do you test on low-end devices?

@checklist
- Explain LCP, INP and CLS with thresholds and fixes
- Profile a page in the DevTools Performance panel
- Analyse a bundle and implement route-level code splitting
- Implement list virtualisation
- Explain HTTP caching headers for hashed assets vs HTML

@resources
- [web.dev: Web Vitals](https://web.dev/articles/vitals) article
- [web.dev: Learn Performance](https://web.dev/learn/performance) course
- [Optimize INP](https://web.dev/articles/optimize-inp) article

@topic Web Security | 🔒 | intermediate | security, web
@summary XSS, CSRF, CORS, CSP, clickjacking and secure auth storage for frontend engineers.

@section concept
Frontend security is about not letting untrusted data become code, and not letting other sites act on behalf of your users. Know the **OWASP** basics as they apply to the browser: **XSS**, **CSRF**, **clickjacking**, insecure token storage, and the headers that defend against them.

@section fundamentals
- **XSS**: attacker-controlled input executes as script. Types: stored, reflected, DOM-based. Defend with output encoding (frameworks escape by default), avoid `innerHTML`/`dangerouslySetInnerHTML`, sanitise HTML (DOMPurify), and CSP.
- **CSRF**: a malicious site triggers a state-changing request using the victim's cookies. Defend with `SameSite` cookies, CSRF tokens, checking `Origin`.
- **CORS** relaxes the same-origin policy for reads; it's not a security feature for your server, it protects users' data from other origins.
- **Clickjacking**: embedding your page in an invisible iframe. Defend with `frame-ancestors` in CSP or `X-Frame-Options`.
- **Cookies**: `HttpOnly` (no JS access), `Secure` (HTTPS only), `SameSite=Lax/Strict`.

@section advanced
- **Content Security Policy**: allow-list script sources, use nonces/hashes, `strict-dynamic`, report-only mode for rollout.
- **Trusted Types** to lock down DOM XSS sinks.
- **Subresource Integrity** for CDN scripts.
- **Supply chain**: lockfiles, audit, minimal dependencies, pin versions.
- **Token storage trade-offs**: HttpOnly cookies vs in-memory access tokens with refresh token rotation.
- Open redirects, prototype pollution, postMessage origin checks.

@section examples
```js
// DOM XSS sink: never do this with user input
el.innerHTML = userInput; // ❌
el.textContent = userInput; // ✅

// Sanitise when you must render HTML
import DOMPurify from 'dompurify';
el.innerHTML = DOMPurify.sanitize(markdownHtml);

// Validate postMessage origins
window.addEventListener('message', (e) => {
  if (e.origin !== 'https://trusted.example.com') return;
  handle(e.data);
});
```
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-r4nd0m'; frame-ancestors 'none'
Set-Cookie: session=abc; HttpOnly; Secure; SameSite=Lax; Path=/
```

@section useCases
- Rendering user-generated markdown safely in a comments system.
- Rolling out a CSP in report-only mode before enforcing it.
- Choosing session cookies over localStorage tokens for a banking app.

@section mistakes
- Believing React makes XSS impossible (`dangerouslySetInnerHTML`, `href="javascript:"` URLs, SSR injection).
- Treating CORS as server-side protection.
- Storing long-lived tokens in localStorage.
- Using `Access-Control-Allow-Origin: *` with credentials (not allowed anyway) or reflecting any origin.

@q intermediate | What is XSS and how do you prevent it?
Cross-site scripting is when untrusted data is interpreted as executable code in a victim's browser, letting attackers steal sessions, act as the user, or deface the page. Prevention is layered: contextual output encoding (frameworks do this by default), avoid dangerous sinks (`innerHTML`, `eval`, `javascript:` URLs), sanitise any HTML you must render, validate input on the server, set a strict CSP, and use HttpOnly cookies so stolen script can't read session tokens.
@followups
- Explain stored vs reflected vs DOM XSS.
- How does a nonce-based CSP work?

@q intermediate | Explain CSRF and how SameSite cookies help.
CSRF tricks a logged-in user's browser into sending a state-changing request to your site from another origin; the browser attaches cookies automatically. `SameSite=Lax` (the default in modern browsers) stops cookies being sent on cross-site subrequests and non-GET top-level navigations; `Strict` stops them on all cross-site requests. Combine with CSRF tokens for older browsers and sensitive actions, and never perform mutations on GET.
@followups
- Why doesn't CORS prevent CSRF?
- Is a JSON API with token auth in headers vulnerable to CSRF?

@checklist
- Explain XSS types and four layers of defence
- Explain CSRF and SameSite values
- Write a strict CSP for a React app
- Compare cookie vs localStorage token storage
- Explain CORS preflight and credentials

@resources
- [OWASP Top Ten](https://owasp.org/www-project-top-ten/) docs
- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) docs
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) docs

@topic Frontend System Design | 🏗️ | advanced | system-design, architecture
@summary Designing UIs at scale: requirements, component architecture, data, state, performance and a11y.

@section concept
Frontend system design interviews ask you to design a product UI (news feed, autocomplete, chat, Google Docs, image carousel) end to end. Interviewers assess how you **clarify requirements**, decompose into **components**, design the **data model and API contract**, manage **state**, and address **performance, accessibility, offline and i18n**.

@section fundamentals
A reliable framework (**RADIO**):
- **R**equirements: functional (what it does) and non-functional (devices, scale, performance, a11y, offline).
- **A**rchitecture: high-level components (view, controller/store, server cache, client store) and how they talk.
- **D**ata model: entities, client state vs server state, normalisation.
- **I**nterface (API): endpoints, pagination (cursor vs offset), real-time (polling, SSE, WebSockets), request/response shapes.
- **O**ptimisations: performance, network, rendering, a11y, security, i18n, error handling.

@section advanced
- **Pagination**: cursor-based for feeds (stable under inserts), offset for tables with page numbers.
- **Real-time**: long polling vs SSE (server → client) vs WebSockets (bidirectional).
- **Optimistic updates** with rollback on error.
- **Normalised cache** (entities by id) to keep data consistent across views.
- **Offline**: service worker caching, IndexedDB queue of pending mutations, conflict resolution.
- **Collaborative editing**: OT vs CRDTs.
- **Rendering**: virtualisation, skeletons, image placeholders, prefetching next page.

@section examples
```text
Design: Autocomplete / typeahead
- Requirements: results as you type, keyboard nav, highlights, works on mobile, a11y (combobox)
- Components: Input, ResultsList, ResultItem, controller (debounce, cache, request mgmt)
- Data: cache Map<query, results>, LRU with TTL; normalise result entities
- API: GET /search?q=&limit=10; return within 100ms p95
- Optimisations:
  * debounce 150–300ms, min query length
  * cancel stale requests (AbortController) or ignore out-of-order responses
  * cache prefixes; serve from cache instantly
  * ARIA combobox: aria-expanded, aria-activedescendant, role=listbox/option
  * virtualise long lists, highlight matches safely (no innerHTML)
```

@section useCases
- News feed (infinite scroll, cursor pagination, optimistic likes).
- Chat app (WebSockets, message ordering, delivery states, offline queue).
- Design-system architecture for multiple product teams.

@section mistakes
- Jumping into components before clarifying requirements.
- Ignoring accessibility, error and loading states.
- Over-engineering (micro-frontends for a 3-person team).
- Not discussing trade-offs explicitly.

@q advanced | Design a news feed like Facebook or Twitter.
Clarify: post types, infinite scroll, real-time new posts, likes/comments, devices. Architecture: Feed → FeedItem → (Media, Actions, Comments), a server-state cache (React Query) with normalised posts, client store for UI state. API: `GET /feed?cursor=…&limit=20` returning `{items, nextCursor}`; cursor pagination avoids duplicates when new posts arrive; SSE or polling for "new posts" banner rather than inserting above the fold. Optimisations: virtualised list, IntersectionObserver to fetch the next page, image lazy-loading with fixed aspect ratios (no CLS), optimistic like/unlike with rollback, prefetch next page, skeletons, keyboard navigation, `aria-live` for new-post announcements, sanitise rich text.
@followups
- How do you handle a post being edited or deleted while visible?
- How would you support offline reading?

@q advanced | Design an autocomplete component used across the company.
Cover the API surface (props: `fetchSuggestions`, `renderItem`, `debounceMs`, `minChars`, controlled vs uncontrolled), behaviour (debounce, caching, race conditions, keyboard navigation, highlighting), accessibility (ARIA combobox pattern), performance (virtualisation, memoisation), theming, i18n/RTL, testing strategy, and versioning in a design system.
@followups
- Server-side vs client-side filtering trade-offs?
- How do you handle a slow API?

@checklist
- Practice the RADIO framework on 5 classic problems
- Explain cursor vs offset pagination
- Compare polling, SSE and WebSockets
- Explain optimistic updates and rollback
- Design an accessible autocomplete end to end

@resources
- [GreatFrontEnd: Front End System Design](https://www.greatfrontend.com/front-end-system-design-playbook) course
- [Patterns.dev](https://www.patterns.dev/) book

@topic Micro-frontends | 🧩 | advanced | architecture, micro-frontends
@summary Splitting a frontend across teams: composition strategies, Module Federation and trade-offs.

@section concept
Micro-frontends apply microservice ideas to the UI: independent teams own vertical slices of a product and deploy them independently. They solve **organisational scaling** problems, not technical ones, and add real complexity, so a strong answer always discusses when *not* to use them.

@section fundamentals
- **Composition**: build-time (npm packages), server-side (SSI/ESI, edge composition), run-time (Module Federation, import maps, iframes, Web Components).
- **Shell / host app** handles routing, auth, layout; **remotes** expose features.
- **Shared dependencies** (React, design system) loaded once with version negotiation.
- **Communication**: URL, custom events, a minimal shared event bus; avoid shared global state.
- **Independent deployment** requires backward-compatible contracts.

@section advanced
- **Module Federation** (webpack/rspack/Vite plugins): runtime loading of remote modules with shared singletons.
- **Style isolation**: CSS modules, prefixes, Shadow DOM.
- **Performance risks**: duplicate frameworks, waterfalls loading remotes, larger total JS.
- **Consistency**: a shared design system, linting and contract tests.
- **Monorepo** with good boundaries (Nx, Turborepo) is often the better alternative.

@section examples
```js
// webpack Module Federation (host)
new ModuleFederationPlugin({
  name: 'shell',
  remotes: { checkout: 'checkout@https://cdn.example.com/checkout/remoteEntry.js' },
  shared: { react: { singleton: true, requiredVersion: '^19.0.0' } },
});

// Lazy-load a remote component
const Checkout = React.lazy(() => import('checkout/App'));
```

@section useCases
- Large e-commerce platforms where search, product, cart and account are owned by different teams.
- Gradual migration of a legacy AngularJS app to React route by route (strangler pattern).

@section mistakes
- Adopting micro-frontends for a small team (all cost, no benefit).
- Sharing global state between micro-frontends, recoupling them.
- Letting each team pick different frameworks and versions without governance.

@q advanced | When would you choose micro-frontends, and what are the trade-offs?
Choose them when many teams need to ship a single product independently, release cadences conflict, or you're incrementally migrating a legacy app. Benefits: team autonomy, independent deploys, isolated failures, incremental upgrades. Costs: operational complexity, duplicated dependencies and larger bundles, UX inconsistency, harder testing and debugging, cross-app communication and versioning. Alternatives: a well-structured monorepo with clear ownership and module boundaries.
@followups
- How do you share a design system across micro-frontends?
- How do micro-frontends communicate?

@checklist
- Explain 4 composition strategies with trade-offs
- Explain Module Federation shared singletons
- Argue for and against micro-frontends for a given org

@resources
- [Martin Fowler: Micro Frontends](https://martinfowler.com/articles/micro-frontends.html) article
- [Module Federation docs](https://module-federation.io/) docs

@topic Testing & Debugging | 🧪 | intermediate | testing, debugging
@summary Testing pyramid/trophy, unit, integration and E2E tests, mocking, and debugging techniques.

@section concept
Good tests give confidence to change code. For frontends the **testing trophy** suggests mostly **integration tests** that render components and interact like a user, a base of static analysis (TypeScript, ESLint), some unit tests for pure logic, and a few critical end-to-end tests.

@section fundamentals
- **Static**: TypeScript, ESLint catch whole classes of bugs for free.
- **Unit**: pure functions, hooks, reducers (Vitest/Jest).
- **Integration**: render components with React Testing Library; query by role/label, assert on what the user sees.
- **E2E**: Playwright/Cypress for critical flows (login, checkout).
- **Mocking**: mock at the network boundary (MSW) rather than mocking your own modules.
- Test behaviour, not implementation details.

@section advanced
- **Visual regression** (Chromatic, Playwright screenshots).
- **Accessibility testing** with axe in unit and E2E tests.
- **Flaky tests**: avoid arbitrary sleeps, use auto-waiting and deterministic data.
- **Contract testing** between frontend and API.
- **Debugging**: breakpoints, conditional breakpoints, logpoints, the Performance and Memory panels, React DevTools Profiler, source maps in production.

@section examples
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('adds a todo', async () => {
  render(<TodoApp />);
  await userEvent.type(screen.getByRole('textbox', { name: /new todo/i }), 'Learn RTL');
  await userEvent.click(screen.getByRole('button', { name: /add/i }));
  expect(screen.getByRole('listitem')).toHaveTextContent('Learn RTL');
});
```

@section useCases
- Preventing regressions in a checkout flow with a Playwright test in CI.
- Using MSW to develop and test UI before the backend is ready.

@section mistakes
- Testing internal state or snapshot-testing everything.
- Querying by test ids or class names when roles and labels exist.
- Mocking too much so tests pass while the app is broken.

@q intermediate | What should you test in a React component, and how?
Test what users experience: rendered output, interactions and resulting changes, accessibility, loading/error/empty states. Use React Testing Library to render, query by role/label/text, simulate real interactions with user-event, and assert visible outcomes. Mock the network (MSW), not child components. Keep pure logic in functions with unit tests.
@followups
- Why prefer `getByRole` over `getByTestId`?
- How do you test a custom hook?

@q intermediate | How do you debug a memory leak in a web app?
Reproduce the suspected flow repeatedly, take heap snapshots in the Memory panel before and after, and compare to find objects growing (detached DOM nodes, listeners, closures). Use the allocation timeline to find what allocates. Common causes: listeners/subscriptions/timers not cleaned up in effects, global caches, closures holding large objects, detached nodes referenced from JS.
@followups
- What is a detached DOM node?
- How does WeakMap help?

@checklist
- Write integration tests with React Testing Library
- Mock APIs with MSW
- Write a Playwright test for a critical flow
- Find a memory leak with heap snapshots
- Profile renders with React DevTools

@resources
- [Testing Library docs](https://testing-library.com/docs/) docs
- [Kent C. Dodds: The Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications) article
- [Playwright docs](https://playwright.dev/docs/intro) docs
