@track Full Stack Engineering | 🛠️ | Node.js, APIs, databases, auth, caching, queues, system design and deployment.

@topic Node.js & Backend Fundamentals | 🟩 | beginner | nodejs, backend, core
@summary The Node event loop, streams, modules, error handling and what makes Node fast (and slow).

@section concept
Node.js is a JavaScript runtime built on V8 and **libuv**. It uses a single-threaded event loop with non-blocking I/O, so one process can handle thousands of concurrent connections as long as no single piece of work blocks the loop. CPU-heavy work needs worker threads, child processes or a different service.

@section fundamentals
- **Event loop phases**: timers → pending callbacks → poll (I/O) → check (`setImmediate`) → close callbacks. `process.nextTick` and promise microtasks run between phases.
- **libuv thread pool** (default 4) handles fs, DNS lookup, crypto and zlib.
- **Modules**: CommonJS (`require`, sync) vs ES Modules (`import`, async, static analysis). Set `"type": "module"` to use ESM.
- **Streams**: Readable, Writable, Duplex, Transform; `pipeline()` handles errors and backpressure.
- **Buffers** hold binary data outside the V8 heap.
- **Errors**: operational (expected, e.g. network) vs programmer errors (bugs). Handle `unhandledRejection` and crash fast on unknown state.
- Environment config via env vars, never commit secrets.

@section advanced
- **Backpressure**: when a writable can't keep up, `write()` returns false; pause the readable until `drain`.
- **Worker threads** for CPU-bound tasks; **cluster** / multiple processes behind a load balancer to use all cores.
- **Graceful shutdown**: stop accepting connections on SIGTERM, finish in-flight requests, close DB pools.
- **Profiling**: `--inspect`, flame graphs (clinic.js, 0x), heap snapshots for leaks.
- **Event loop lag** monitoring as a health signal.
- `AsyncLocalStorage` for request-scoped context (request ids in logs).

@section examples
```js
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

// Compress a huge file with constant memory and proper error handling
await pipeline(
  createReadStream('access.log'),
  createGzip(),
  createWriteStream('access.log.gz'),
);

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(async () => {
    await db.end();
    process.exit(0);
  });
});
```

@section useCases
- Real-time APIs (chat, notifications) with many idle connections.
- BFF (backend-for-frontend) layers aggregating microservices.
- Streaming large CSV exports without loading them into memory.

@section mistakes
- Blocking the event loop with sync fs/crypto calls or heavy JSON parsing in request handlers.
- Not handling promise rejections, leading to crashes or silent failures.
- Reading whole files into memory instead of streaming.
- Assuming Node is multi-threaded for your JS code.

@q intermediate | Explain the Node.js event loop phases.
libuv runs the loop in phases: **timers** (expired `setTimeout`/`setInterval`), **pending callbacks** (some deferred system errors), **idle/prepare** (internal), **poll** (retrieve new I/O events and run their callbacks; may block waiting), **check** (`setImmediate` callbacks), **close callbacks** (`socket.on('close')`). Between each callback, Node drains the `process.nextTick` queue and then the promise microtask queue. That's why `nextTick` fires before promises, and `setImmediate` fires before timers when scheduled from an I/O callback.
@followups
- `setImmediate` vs `setTimeout(fn, 0)`: which runs first?
- What runs on the libuv thread pool?

@q intermediate | How do you handle CPU-intensive work in Node?
Don't run it on the main event loop. Options: **worker threads** (shared memory possible, good for parsing/image processing), **child processes**, offload to a **job queue** processed by separate workers (BullMQ), or move it to a service in a better-suited language. Also chunk work and yield with `setImmediate` if it must stay in-process.
@followups
- How do you measure event loop lag?
- When would you use cluster vs worker threads?

@q intermediate | What are streams and why use them?
Streams process data piece by piece instead of buffering it all in memory, enabling constant memory usage and lower latency for large or infinite data (files, HTTP bodies, sockets). They compose via `pipeline`, and handle **backpressure** so fast producers don't overwhelm slow consumers.
@followups
- What is backpressure and how does Node handle it?
- Why prefer `pipeline` over `.pipe()`?

@checklist
- Explain event loop phases, nextTick and microtasks
- Use streams with pipeline for a large file
- Implement graceful shutdown
- Explain CommonJS vs ESM differences
- Offload CPU work to a worker thread

@resources
- [Node.js: The event loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick) docs
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices) repo

@topic Express.js & NestJS | 🚂 | intermediate | express, nestjs, backend
@summary Middleware, routing, error handling, validation, and NestJS modules, DI and providers.

@section concept
**Express** is a minimal HTTP framework built around a middleware pipeline. **NestJS** is an opinionated framework (often on top of Express or Fastify) that adds modules, dependency injection, decorators, guards, pipes and interceptors for large, structured codebases.

@section fundamentals
- Express middleware signature `(req, res, next)`; order matters. Error middleware has four args `(err, req, res, next)`.
- Routers for modular route groups; `express.json()` for body parsing.
- Validation at the edge (zod/Joi/class-validator) and consistent error responses.
- NestJS building blocks: **Modules**, **Controllers**, **Providers/Services**, **DI container**.
- Nest request lifecycle: middleware → guards → interceptors (before) → pipes → handler → interceptors (after) → exception filters.

@section advanced
- Async error handling in Express 4 requires wrappers (Express 5 handles rejected promises).
- Security middleware: helmet, rate limiting, CORS config, body size limits.
- Structured logging with request ids (pino), metrics, tracing (OpenTelemetry).
- NestJS: custom decorators, dynamic modules, scopes (singleton/request/transient), testing with `Test.createTestingModule`.
- Fastify for higher throughput and schema-based serialisation.

@section examples
```js
const app = express();
app.use(helmet());
app.use(express.json({ limit: '100kb' }));

const CreateUser = z.object({ email: z.string().email(), name: z.string().min(1) });

app.post('/users', async (req, res, next) => {
  try {
    const input = CreateUser.parse(req.body);
    const user = await users.create(input);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

// Centralised error handler
app.use((err, req, res, _next) => {
  if (err instanceof z.ZodError) return res.status(400).json({ error: err.flatten() });
  req.log?.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});
```

@section useCases
- Express for small services, prototypes and BFFs.
- NestJS for large teams wanting consistent architecture and testability.

@section mistakes
- Forgetting `next(err)` in async handlers, causing hung requests.
- Business logic inside route handlers instead of services.
- Leaking stack traces in production error responses.

@q intermediate | How does middleware work in Express?
Express keeps an ordered stack of middleware. Each request flows through matching middleware in registration order; each can read/modify `req`/`res`, end the response, or call `next()` to pass control on. Calling `next(err)` skips to error-handling middleware (4 arguments). This composition model is how auth, logging, parsing and error handling are layered.
@followups
- How would you write an auth middleware?
- How do you handle async errors in Express 4 vs 5?

@q intermediate | Explain dependency injection in NestJS and why it helps.
Classes declare dependencies in their constructor; Nest's IoC container creates and injects instances based on module providers. Benefits: loose coupling, easy swapping of implementations (e.g. a mock repository in tests), centralised lifecycle management (singletons by default), and clear module boundaries.
@followups
- What are guards vs interceptors vs pipes?
- What are provider scopes?

@checklist
- Build an Express API with validation and centralised error handling
- Explain Nest request lifecycle
- Add helmet, CORS and rate limiting
- Write tests for a Nest service with mocked providers

@resources
- [Express docs](https://expressjs.com/) docs
- [NestJS docs](https://docs.nestjs.com/) docs

@topic REST APIs & GraphQL | 🔌 | intermediate | api, rest, graphql
@summary Resource design, status codes, idempotency, pagination, versioning, and GraphQL trade-offs.

@section concept
APIs are contracts. **REST** models resources with URLs and uses HTTP semantics (methods, status codes, caching). **GraphQL** exposes a typed schema and lets clients request exactly the fields they need in one round-trip. Interviewers want good resource design and a clear view of trade-offs.

@section fundamentals
- Methods: `GET` (safe, idempotent), `PUT` (idempotent replace), `PATCH` (partial), `POST` (create/non-idempotent), `DELETE` (idempotent).
- Status codes: 200, 201, 204, 400, 401 (unauthenticated), 403 (forbidden), 404, 409 (conflict), 422, 429, 500, 503.
- Nouns not verbs: `GET /users/42/orders`.
- **Pagination**: offset/limit (simple, unstable with inserts) vs cursor/keyset (stable, scalable).
- **Versioning**: URL (`/v1`), header, or additive evolution.
- **Idempotency keys** for safe retries of POST (payments).
- GraphQL basics: schema, queries, mutations, subscriptions, resolvers.

@section advanced
- **N+1 problem** in GraphQL resolvers solved by DataLoader batching.
- GraphQL caching is harder (single endpoint, POST): use persisted queries, normalised client caches.
- Query cost analysis / depth limits to prevent abusive GraphQL queries.
- **HATEOAS**, ETags and conditional requests (`If-None-Match`, `If-Match` for optimistic concurrency).
- gRPC for internal service-to-service communication.
- OpenAPI for contracts, codegen and docs.

@section examples
```http
POST /payments
Idempotency-Key: 6c1b9f0e-…
Content-Type: application/json

{ "amount": 4999, "currency": "USD" }

HTTP/1.1 201 Created
Location: /payments/pay_123
```
```graphql
type Query {
  user(id: ID!): User
}
type User {
  id: ID!
  name: String!
  posts(first: Int = 10, after: String): PostConnection!
}
```

@section useCases
- REST for public APIs that benefit from HTTP caching.
- GraphQL as a BFF aggregating many services for multiple clients (web, mobile).

@section mistakes
- Returning 200 with an error body.
- Using offset pagination on huge, frequently-changing tables.
- Exposing database structure directly as the API.
- Ignoring N+1 queries in GraphQL resolvers.

@q intermediate | REST vs GraphQL: when would you choose each?
**REST**: simple, cacheable via HTTP/CDNs, great tooling, works well for resource-oriented and public APIs. **GraphQL**: clients fetch exactly what they need in one request, strongly typed schema, great for complex UIs aggregating many resources and for multiple clients with different needs. Costs: caching complexity, N+1 risks, query cost control, more server complexity. Choose based on clients, team, and caching needs.
@followups
- How do you solve N+1 in GraphQL?
- How do you version a GraphQL API?

@q intermediate | What is idempotency and why does it matter?
An operation is idempotent if repeating it has the same effect as doing it once. Networks fail, clients retry, so non-idempotent operations (POST payment) can double-charge. Use idempotency keys: the server stores the key with the result and returns the stored result for repeats.
@followups
- Is PATCH idempotent?
- Where would you store idempotency keys and for how long?

@q intermediate | Offset vs cursor pagination?
Offset (`LIMIT 20 OFFSET 1000`) is simple and supports jumping to page N, but gets slower with large offsets (DB scans and discards rows) and shows duplicates/misses when data changes. Cursor/keyset pagination (`WHERE created_at < :cursor ORDER BY created_at DESC LIMIT 20`) uses an index, is consistently fast, and stable under inserts, but can't jump to arbitrary pages.
@followups
- How do you build a cursor when the sort key isn't unique?

@checklist
- Design a REST API for a blog with correct status codes
- Implement cursor pagination
- Explain idempotency keys
- Build a GraphQL schema and fix N+1 with DataLoader
- Write an OpenAPI spec for 3 endpoints

@resources
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines) repo
- [GraphQL Learn](https://graphql.org/learn/) docs
- [MDN: HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) docs

@topic Databases: SQL & NoSQL | 🗄️ | intermediate | databases, sql, nosql
@summary Relational vs document/key-value/wide-column stores, ACID, isolation levels and CAP.

@section concept
Choosing a database is choosing trade-offs between **consistency, flexibility, query power and scale**. Relational databases (PostgreSQL, MySQL) give strong consistency, joins and transactions. NoSQL stores (MongoDB, DynamoDB, Cassandra, Redis) trade some of that for flexible schemas, specific access patterns and horizontal scale.

@section fundamentals
- **ACID**: Atomicity, Consistency, Isolation, Durability.
- **Isolation levels**: Read Uncommitted, Read Committed, Repeatable Read, Serializable; anomalies: dirty reads, non-repeatable reads, phantoms, lost updates, write skew.
- **SQL**: joins (inner, left, right, full), `GROUP BY`/`HAVING`, window functions, subqueries, CTEs.
- **NoSQL families**: document (MongoDB), key-value (Redis, DynamoDB), wide-column (Cassandra), graph (Neo4j).
- **CAP**: during a network partition choose consistency or availability. **PACELC** adds latency vs consistency otherwise.
- **BASE** for eventually consistent systems.

@section advanced
- **MVCC** (Postgres) lets readers not block writers.
- **Replication**: leader-follower (read replicas, replication lag), multi-leader, leaderless (quorums).
- **Sharding/partitioning**: by hash or range; hot partitions; resharding.
- **DynamoDB single-table design** around access patterns.
- **Optimistic vs pessimistic locking** (`SELECT … FOR UPDATE`, version columns).
- Distributed transactions: 2PC vs sagas.

@section examples
```sql
-- Top 3 most recent orders per customer (window function)
SELECT * FROM (
  SELECT o.*, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) AS rn
  FROM orders o
) t
WHERE rn <= 3;

-- Avoid lost updates with optimistic locking
UPDATE accounts SET balance = balance - 100, version = version + 1
WHERE id = 42 AND version = 7;  -- 0 rows updated => someone else changed it
```

@section useCases
- Postgres for transactional data (orders, payments, users).
- DynamoDB/Cassandra for massive write throughput with known access patterns.
- MongoDB for content with varied, evolving shapes.

@section mistakes
- Picking NoSQL "for scale" when data is relational and scale is modest.
- Ignoring isolation anomalies in money-moving code.
- Reading from replicas right after a write (read-your-writes violations).

@q intermediate | SQL vs NoSQL: how do you choose?
Start from data shape and access patterns. Relational fits structured, related data that needs joins, ad-hoc queries and strong transactional guarantees. NoSQL fits known access patterns at very high scale, flexible or hierarchical documents, very high write throughput, or specialised needs (caching, graphs). Consider team expertise and operational burden. Postgres is a great default; it even handles JSON documents well.
@followups
- What are the trade-offs of denormalisation?
- How does MongoDB handle transactions?

@q advanced | Explain transaction isolation levels and the anomalies each prevents.
- **Read Uncommitted**: allows dirty reads.
- **Read Committed** (Postgres default): no dirty reads; non-repeatable reads and phantoms possible.
- **Repeatable Read**: same row reads are stable; in Postgres (snapshot isolation) phantoms are prevented too, but write skew is possible.
- **Serializable**: equivalent to some serial order; prevents all anomalies, with higher abort/retry rates.
Give a write-skew example: two doctors both going off call because each saw another doctor on call.
@followups
- What is MVCC?
- How do you prevent lost updates?

@q intermediate | Explain the CAP theorem.
In a distributed system experiencing a network **partition**, you must choose between **consistency** (every read sees the latest write or errors) and **availability** (every request gets a non-error response, possibly stale). Without partitions you can have both; PACELC says then you trade latency vs consistency. Examples: CP systems like ZooKeeper/etcd, AP systems like Cassandra/DynamoDB (tunable).
@followups
- Is Postgres CP or AP?
- What is eventual consistency and how do you design UIs around it?

@checklist
- Write joins, aggregations and window functions fluently
- Explain ACID and isolation anomalies with examples
- Explain CAP/PACELC with real systems
- Explain replication lag and read-your-writes
- Compare document, key-value, wide-column stores

@resources
- [Designing Data-Intensive Applications](https://dataintensive.net/) book
- [PostgreSQL Docs: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html) docs
- [SQLBolt interactive lessons](https://sqlbolt.com/) course

@topic Database Design & Optimization | 📐 | advanced | databases, performance, indexing
@summary Normalisation, indexing, query plans, N+1, connection pooling and schema evolution.

@section concept
Good schemas make correct queries easy and fast. Optimisation means reading **query plans**, adding the right **indexes**, fixing **access patterns** (N+1, over-fetching), and scaling with replicas, caching and partitioning only when needed.

@section fundamentals
- **Normalisation** (1NF–3NF) removes redundancy; **denormalise** deliberately for read performance.
- **Keys**: natural vs surrogate, UUID vs bigserial trade-offs (index locality; UUIDv7 is time-ordered).
- **B-tree indexes** speed up equality and range lookups; composite index column order matters (leftmost prefix).
- `EXPLAIN ANALYZE` shows seq scans, index scans, join strategies and row estimates.
- **N+1 queries** from ORMs: use joins/eager loading or batching.
- **Connection pooling** (PgBouncer) since DB connections are expensive.

@section advanced
- Covering indexes (`INCLUDE`), partial indexes, expression indexes, GIN for JSONB/full-text.
- Index costs: slower writes, more storage; unused indexes should be dropped.
- **Zero-downtime migrations**: expand/contract, backfill in batches, create indexes concurrently.
- Partitioning large tables by time; archiving.
- Materialised views for expensive aggregates.
- Lock contention and long-running transactions.

@section examples
```sql
-- Composite index matches WHERE + ORDER BY
CREATE INDEX CONCURRENTLY idx_orders_customer_created
  ON orders (customer_id, created_at DESC);

EXPLAIN ANALYZE
SELECT id, total FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 20;

-- Partial index for a hot subset
CREATE INDEX idx_jobs_pending ON jobs (run_at) WHERE status = 'pending';
```

@section useCases
- Speeding up a slow dashboard query from seconds to milliseconds with a composite index.
- Renaming a column with zero downtime via expand/contract.

@section mistakes
- Indexing every column.
- Functions on indexed columns in `WHERE` (`WHERE lower(email) = …`) without an expression index.
- `SELECT *` everywhere.
- Running blocking migrations on large tables during peak traffic.

@q intermediate | How do database indexes work, and what are the trade-offs?
Most indexes are B-trees: sorted structures that turn O(n) scans into O(log n) lookups for equality and range queries, and can satisfy `ORDER BY`. Composite indexes are ordered by their columns, so they help queries that filter on a leftmost prefix. Trade-offs: extra storage, slower inserts/updates/deletes, and the planner may still ignore them for low-selectivity predicates.
@followups
- When would the planner ignore an index?
- What's a covering index?

@q advanced | A query is slow in production. How do you fix it?
Find it (slow query log, `pg_stat_statements`, APM). Reproduce with production-like data and run `EXPLAIN (ANALYZE, BUFFERS)`. Look for seq scans on large tables, bad row estimates (run ANALYZE / update statistics), nested loops over many rows, sorts spilling to disk. Fix with the right index, query rewrite (avoid functions on columns, reduce columns, fix N+1), pagination, caching, or denormalisation. Verify the improvement and monitor.
@followups
- How do you add an index to a 500M row table without downtime?

@checklist
- Normalise a schema to 3NF and justify one denormalisation
- Read an EXPLAIN ANALYZE output
- Design composite indexes for 3 queries
- Fix an N+1 query from an ORM
- Plan a zero-downtime column rename

@resources
- [Use The Index, Luke](https://use-the-index-luke.com/) book
- [PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html) docs

@topic Authentication & Authorization | 🔑 | intermediate | auth, security
@summary Sessions vs JWT, OAuth 2.0, OIDC, password storage, RBAC/ABAC and token security.

@section concept
**Authentication** answers "who are you?"; **authorization** answers "what can you do?". You need to know session-based auth vs token-based (JWT), OAuth 2.0 and OpenID Connect flows, secure password storage, and access control models.

@section fundamentals
- **Passwords**: hash with bcrypt/scrypt/Argon2 (slow, salted). Never encrypt or plain-hash.
- **Sessions**: server stores session; client holds an opaque id in an HttpOnly cookie. Easy revocation.
- **JWT**: signed, self-contained tokens; stateless verification, hard to revoke. Keep short-lived; pair with refresh tokens.
- **OAuth 2.0**: delegated authorization. Authorization Code flow + **PKCE** for SPAs/mobile.
- **OIDC**: identity layer on OAuth 2.0 (ID token, userinfo).
- **RBAC** (roles) vs **ABAC** (attributes/policies) vs ReBAC (relationships).
- MFA (TOTP, WebAuthn/passkeys).

@section advanced
- **Refresh token rotation** with reuse detection.
- JWT pitfalls: `alg: none`, weak secrets, not validating `aud`/`iss`/`exp`, storing sensitive data in payloads.
- Session fixation, credential stuffing defences (rate limiting, breached password checks).
- Centralised policy engines (OPA, Cedar), row-level security in Postgres.
- SSO with SAML/OIDC for enterprises.

@section examples
```js
// Password hashing
const hash = await bcrypt.hash(password, 12);
const ok = await bcrypt.compare(attempt, hash);

// Authorization middleware (RBAC)
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).end();
  if (!roles.includes(req.user.role)) return res.status(403).end();
  next();
};
app.delete('/posts/:id', requireRole('admin', 'editor'), deletePost);
```

@section useCases
- "Sign in with Google" via OIDC.
- A multi-tenant SaaS enforcing tenant isolation on every query.
- Passkeys for phishing-resistant login.

@section mistakes
- Storing JWTs with long expiry in localStorage.
- Checking permissions only in the UI.
- Using the implicit OAuth flow for SPAs (deprecated).
- Returning different errors for "user not found" vs "wrong password" (user enumeration).

@q intermediate | Sessions vs JWT: compare them.
**Sessions**: opaque id in a cookie, state on the server (DB/Redis). Simple revocation, small cookies, requires a shared session store to scale. **JWT**: signed claims verified without a lookup, good for distributed services, but revocation is hard (need short expiry + refresh tokens or a deny list), tokens are larger, and payloads are readable. For a typical web app, cookie sessions are often the simpler, safer choice.
@followups
- How do you revoke a JWT?
- Where should a SPA store tokens?

@q intermediate | Explain the OAuth 2.0 Authorization Code flow with PKCE.
1. Client creates a random `code_verifier` and sends its hash (`code_challenge`) with the authorization request.
2. User authenticates and consents at the authorization server.
3. Server redirects back with a short-lived authorization `code`.
4. Client exchanges the code + `code_verifier` at the token endpoint.
5. Server verifies the verifier matches the challenge and returns access (and refresh/ID) tokens.
PKCE stops an intercepted code from being exchanged by an attacker, which is why it's required for public clients.
@followups
- What's the difference between OAuth and OIDC?
- What's the `state` parameter for?

@checklist
- Implement password hashing and login with sessions
- Explain JWT structure and validation steps
- Draw the OAuth Authorization Code + PKCE flow
- Implement RBAC middleware
- Explain refresh token rotation

@resources
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) docs
- [OAuth 2.0 Simplified](https://www.oauth.com/) book
- [jwt.io introduction](https://jwt.io/introduction) article

@topic Caching & Redis | ⚡ | intermediate | caching, redis, performance
@summary Cache strategies, invalidation, eviction, Redis data structures and pitfalls like stampedes.

@section concept
Caching stores the results of expensive operations closer to where they're needed. It exists at every layer: browser, CDN, reverse proxy, application (in-memory, Redis), and database. The hard part is **invalidation** and **consistency**.

@section fundamentals
- **Cache-aside** (lazy loading): read cache → on miss read DB and populate. Most common.
- **Write-through**: write to cache and DB together. **Write-behind**: write to cache, flush to DB async.
- **TTL** and eviction policies: LRU, LFU, FIFO.
- **Redis data structures**: strings, hashes, lists, sets, sorted sets, streams, HyperLogLog, bitmaps.
- Redis is single-threaded for commands (atomic operations), in-memory, with optional persistence (RDB/AOF).
- HTTP caching: `Cache-Control`, `ETag`, CDN edge caching.

@section advanced
- **Cache stampede / thundering herd**: many requests miss at once. Fix with request coalescing, locks, probabilistic early expiration, stale-while-revalidate.
- **Hot keys**: replicate or shard; local in-process cache in front of Redis.
- **Consistency**: invalidate on write vs update; race between invalidate and repopulate.
- Distributed locks (Redlock caveats), rate limiting with sorted sets or token buckets.
- Redis Cluster sharding by hash slots; Sentinel for HA.

@section examples
```js
async function getUser(id) {
  const key = `user:${id}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const user = await db.users.findById(id);
  if (user) await redis.set(key, JSON.stringify(user), 'EX', 300); // 5 min TTL
  return user;
}

async function updateUser(id, data) {
  const user = await db.users.update(id, data);
  await redis.del(`user:${id}`); // invalidate after write
  return user;
}

// Sliding-window rate limiter with a sorted set
async function allow(userId, limit = 100, windowMs = 60_000) {
  const key = `rl:${userId}`, now = Date.now();
  await redis.zremrangebyscore(key, 0, now - windowMs);
  const count = await redis.zcard(key);
  if (count >= limit) return false;
  await redis.zadd(key, now, `${now}-${Math.random()}`);
  await redis.pexpire(key, windowMs);
  return true;
}
```

@section useCases
- Caching product pages and session data.
- Leaderboards with sorted sets.
- Rate limiting, distributed locks, pub/sub and job queues.

@section mistakes
- Caching without a TTL or invalidation strategy.
- Caching per-user data under a shared key (data leaks).
- Treating Redis as a durable primary database without understanding persistence.

@q intermediate | Explain cache-aside vs write-through vs write-behind.
- **Cache-aside**: app checks cache, loads from DB on miss and populates; writes go to DB and invalidate cache. Simple, resilient to cache failure, but first read is slow and there's a staleness window.
- **Write-through**: every write updates cache and DB synchronously. Fresh cache, slower writes, caches data that may never be read.
- **Write-behind**: write to cache, persist to DB asynchronously. Fast writes, risk of data loss, complex.
@followups
- Why delete the cache key on update instead of setting it?
- How do you handle a cache stampede?

@q intermediate | What is a cache stampede and how do you prevent it?
When a popular key expires, many concurrent requests miss and all hit the database at once. Prevent with: a lock / single-flight so only one request recomputes while others wait or get stale data; stale-while-revalidate; probabilistic early refresh before expiry; jittered TTLs so keys don't expire together.
@followups
- How does single-flight work across multiple servers?

@checklist
- Implement cache-aside with invalidation
- Explain eviction policies
- Build a rate limiter with Redis
- Explain and prevent cache stampedes
- Know Redis data structures and one use case each

@resources
- [Redis docs](https://redis.io/docs/latest/) docs
- [AWS: Caching best practices](https://aws.amazon.com/caching/best-practices/) article

@topic Message Queues & Event-Driven Architecture | 📨 | advanced | queues, kafka, architecture
@summary Queues vs logs, delivery guarantees, idempotent consumers, outbox pattern and sagas.

@section concept
Message queues decouple producers from consumers in time and scale. Event-driven architectures publish facts ("OrderPlaced") that other services react to. Key topics: **queues vs streams**, **delivery semantics**, **ordering**, **idempotency**, **retries and dead-letter queues**, and **consistency across services**.

@section fundamentals
- **Queue** (RabbitMQ, SQS): messages consumed and removed; competing consumers for work distribution.
- **Log / stream** (Kafka, Kinesis): append-only, retained; consumers track offsets; replayable; partitioned for scale and ordering per key.
- **Delivery semantics**: at-most-once, at-least-once (most common), effectively-once via idempotency.
- **Dead-letter queues** for messages that keep failing.
- **Pub/sub** fan-out vs point-to-point.

@section advanced
- **Ordering**: only guaranteed within a partition/key.
- **Outbox pattern**: write the event to an outbox table in the same DB transaction, relay it to the broker. Avoids dual-write inconsistency.
- **Sagas** (choreography vs orchestration) for distributed transactions with compensating actions.
- **Event sourcing** and CQRS.
- Consumer lag monitoring, backpressure, poison messages, schema evolution (Avro/Protobuf + registry).

@section examples
```js
// Idempotent consumer: dedupe by message id
async function handle(msg) {
  const inserted = await db.query(
    'INSERT INTO processed_messages (id) VALUES ($1) ON CONFLICT DO NOTHING',
    [msg.id],
  );
  if (inserted.rowCount === 0) return; // duplicate, already processed
  await sendWelcomeEmail(msg.payload.userId);
}
```
```sql
-- Outbox pattern: same transaction as the business write
BEGIN;
INSERT INTO orders (id, user_id, total) VALUES ($1, $2, $3);
INSERT INTO outbox (id, type, payload) VALUES ($4, 'OrderPlaced', $5);
COMMIT;
```

@section useCases
- Sending emails / generating thumbnails asynchronously.
- Order processing across payment, inventory and shipping services.
- Activity streams and analytics pipelines with Kafka.

@section mistakes
- Assuming exactly-once delivery.
- Writing to the DB and publishing to the broker non-atomically (dual writes).
- No DLQ, so one poison message blocks a queue forever.

@q advanced | Kafka vs RabbitMQ: when would you use each?
**RabbitMQ**: a traditional broker with flexible routing (exchanges), per-message acknowledgement, great for task queues and RPC-style work distribution with moderate throughput. **Kafka**: a distributed, partitioned, durable log with very high throughput, retention and replay, consumer groups tracking offsets; ideal for event streaming, analytics, event sourcing and multiple independent consumers of the same events.
@followups
- How does Kafka guarantee ordering?
- What happens when a consumer in a group dies?

@q advanced | How do you guarantee consistency between a database write and publishing an event?
Avoid dual writes. Use the **transactional outbox**: write business data and the event to an outbox table in one transaction; a relay (poller or CDC like Debezium) publishes outbox rows to the broker and marks them sent. Delivery is at-least-once, so consumers must be idempotent.
@followups
- What is change data capture?
- Choreography vs orchestration sagas?

@checklist
- Explain at-most/at-least/exactly-once semantics
- Implement an idempotent consumer
- Explain the outbox pattern
- Design a saga for order checkout
- Explain Kafka partitions and consumer groups

@resources
- [Microservices.io: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html) article
- [Kafka documentation](https://kafka.apache.org/documentation/) docs

@topic System Design | 🏛️ | advanced | system-design, architecture
@summary A repeatable framework for backend system design interviews with classic problems.

@section concept
System design interviews evaluate how you design large-scale systems under ambiguity. There is no single right answer; what matters is **structured thinking**, **reasonable estimates**, **clear trade-offs**, and **depth where it matters**.

@section fundamentals
A framework:
1. **Requirements**: functional, non-functional (scale, latency, availability, consistency), out of scope.
2. **Estimates**: QPS, storage, bandwidth (back-of-the-envelope).
3. **API design**: core endpoints.
4. **Data model** and storage choice.
5. **High-level design**: clients, load balancer, services, DBs, caches, queues, CDN.
6. **Deep dives**: bottlenecks, scaling, failure modes.
7. **Trade-offs & wrap-up**: what you'd improve next.

Useful numbers: 1 day ≈ 86,400 s (~10⁵); 1M requests/day ≈ 12 QPS; memory read ~100 ns, SSD ~100 µs, cross-region round-trip ~100 ms.

@section advanced
- **Unique IDs**: UUID, Snowflake (time + machine + sequence).
- **Consistent hashing** for distributing keys with minimal reshuffling.
- **Rate limiting**: token bucket, leaky bucket, sliding window.
- **Fan-out on write vs read** for feeds (celebrity problem).
- **Geo-distribution**, multi-region active-active, data residency.
- **Observability**: logs, metrics, traces, SLOs and error budgets.

@section examples
```text
Design a URL shortener
- Req: shorten, redirect, custom aliases, 100M new URLs/month, reads 100:1
- Estimates: ~40 writes/s, ~4k reads/s; 100M * 12 * 5y * 500B ≈ 3TB
- API: POST /urls {longUrl} -> {code}; GET /{code} -> 301/302
- ID: base62 of a counter (range allocation per server) or hash + collision check
- Storage: KV store (code -> url), replicated; cache hot codes in Redis; CDN edge
- Redirect: 302 if you need analytics, 301 for cacheability
- Analytics: async events to a queue -> stream processing
```

@section useCases
- URL shortener, rate limiter, news feed, chat, notification system, file storage (Dropbox), video streaming, ride sharing, web crawler, search autocomplete.

@section mistakes
- Diving into details before requirements and estimates.
- Single points of failure left unaddressed.
- Naming technologies without justifying them.
- Not discussing trade-offs or failure modes.

@q advanced | Design a rate limiter.
Clarify: per user/IP/API key, limits, distributed, hard or soft. Algorithms: **token bucket** (allows bursts, simple), **leaky bucket** (smooth output), **fixed window** (simple, boundary bursts), **sliding window log/counter** (accurate). Implementation: middleware or API gateway, counters in Redis with atomic Lua scripts or `INCR` + `EXPIRE`, return `429` with `Retry-After` and rate limit headers. Discuss multi-region consistency vs latency, failing open vs closed, and hot keys.
@followups
- How do you rate limit across multiple data centres?
- Token bucket vs sliding window trade-offs?

@q advanced | Design a chat application like WhatsApp.
Requirements: 1:1 and group chat, online presence, delivery/read receipts, offline delivery, history. Connections via WebSockets to stateless gateway servers; a session service maps users → gateway. Messages persisted (Cassandra-style wide-column partitioned by conversation, ordered by time/Snowflake id). Fan-out for groups via a queue. Offline users get push notifications and fetch history on reconnect. Ordering per conversation, at-least-once delivery with client-side dedupe by message id, end-to-end encryption considerations.
@followups
- How do you scale WebSocket servers?
- How do you implement read receipts in groups?

@checklist
- Practice the framework on 8 classic problems
- Do back-of-the-envelope estimates quickly
- Explain consistent hashing
- Explain rate limiting algorithms
- Explain fan-out on write vs read

@resources
- [System Design Primer](https://github.com/donnemartin/system-design-primer) repo
- [ByteByteGo blog](https://blog.bytebytego.com/) article
- [Designing Data-Intensive Applications](https://dataintensive.net/) book

@topic Scalability & Distributed Systems | 🌍 | advanced | distributed-systems, scalability
@summary Horizontal scaling, load balancing, replication, consensus, and failure handling.

@section concept
Scaling means handling more load without degrading latency or reliability. Distributed systems add the hard parts: **partial failure**, **network unreliability**, **clock skew**, and **consistency**. Designs must assume things fail and degrade gracefully.

@section fundamentals
- **Vertical vs horizontal scaling**; stateless services scale horizontally behind load balancers.
- **Load balancing**: round robin, least connections, consistent hashing; L4 vs L7.
- **Replication** for availability and read scaling; **partitioning** for write scaling.
- **Availability math**: 99.9% ≈ 8.8 h downtime/year; 99.99% ≈ 53 min.
- Timeouts, retries with backoff and jitter, circuit breakers, bulkheads.
- Health checks and autoscaling.

@section advanced
- **Consensus**: Raft/Paxos for leader election and replicated logs (etcd, ZooKeeper).
- **Quorums**: R + W > N for read-after-write in leaderless systems.
- **Clocks**: logical clocks, vector clocks, hybrid logical clocks; don't trust wall clocks for ordering.
- **Idempotency** everywhere because retries happen.
- **Backpressure** and load shedding under overload.
- **Fallacies of distributed computing**.

@section examples
```js
// Circuit breaker sketch
class CircuitBreaker {
  constructor(fn, { threshold = 5, cooldownMs = 10_000 } = {}) {
    Object.assign(this, { fn, threshold, cooldownMs, failures: 0, openedAt: 0 });
  }
  async call(...args) {
    if (this.failures >= this.threshold) {
      if (Date.now() - this.openedAt < this.cooldownMs) throw new Error('circuit open');
      this.failures = this.threshold - 1; // half-open: allow one trial
    }
    try {
      const res = await this.fn(...args);
      this.failures = 0;
      return res;
    } catch (e) {
      if (++this.failures >= this.threshold) this.openedAt = Date.now();
      throw e;
    }
  }
}
```

@section useCases
- Scaling an API from 100 to 100k RPS.
- Keeping checkout working when the recommendation service is down.

@section mistakes
- Retrying without backoff, amplifying outages.
- Storing session state in server memory, preventing horizontal scaling.
- Ignoring tail latency (p99) and only looking at averages.

@q advanced | How would you scale a web application from 1k to 1M users?
Iteratively, measuring each step: single server → separate DB → stateless app servers behind a load balancer → CDN for static assets → caching layer (Redis) → DB read replicas → async work via queues → connection pooling → partition/shard the DB or split services by domain → multi-region for latency and resilience. Add observability, autoscaling and load testing throughout.
@followups
- What breaks first, usually?
- How do you handle session state across servers?

@q advanced | What is a circuit breaker and why use one?
A circuit breaker wraps calls to a dependency and tracks failures. After a threshold, it **opens** and fails fast instead of waiting on timeouts, giving the dependency time to recover and protecting your threads/connections. After a cooldown it goes **half-open** and lets a trial request through; success closes it. Combine with fallbacks (cached data, degraded features).
@followups
- How does it differ from retries?
- What are bulkheads?

@checklist
- Explain load balancing algorithms and L4 vs L7
- Explain replication and partitioning trade-offs
- Explain Raft at a high level
- Explain timeouts, retries, circuit breakers, bulkheads
- Compute availability for serial and parallel components

@resources
- [Fallacies of distributed computing](https://en.wikipedia.org/wiki/Fallacies_of_distributed_computing) article
- [The Raft consensus algorithm](https://raft.github.io/) docs

@topic Docker & Deployment | 🐳 | intermediate | docker, devops, deployment
@summary Containers, Dockerfiles, compose, CI/CD, environments and zero-downtime deploys.

@section concept
Containers package an application with its dependencies into a portable image that runs the same everywhere. Combined with CI/CD, they make deployments repeatable. Interviews ask about **images vs containers**, **Dockerfile best practices**, **networking/volumes**, **orchestration basics**, and **deployment strategies**.

@section fundamentals
- **Image**: immutable layered filesystem + metadata; **container**: a running instance with its own process namespace.
- Dockerfile instructions: `FROM`, `WORKDIR`, `COPY`, `RUN`, `ENV`, `EXPOSE`, `CMD`/`ENTRYPOINT`.
- **Layer caching**: copy dependency manifests and install before copying source.
- **Multi-stage builds** for small production images.
- **docker compose** for local multi-service setups.
- Volumes for persistent data; networks for service discovery.
- 12-factor app: config in env, stateless processes, logs to stdout.

@section advanced
- **Kubernetes** basics: pods, deployments, services, ingress, config maps, secrets, probes, HPA.
- **Deployment strategies**: rolling, blue-green, canary, feature flags.
- Security: non-root users, minimal base images (distroless/alpine), image scanning, no secrets in images.
- Infrastructure as code (Terraform), GitOps.
- Observability in production: structured logs, metrics, tracing, alerting.

@section examples
```dockerfile
# Multi-stage build for a Node app
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
USER node
COPY --from=build /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

@section useCases
- Consistent dev environments with compose (app + Postgres + Redis).
- Canary releases to catch regressions with 5% of traffic.

@section mistakes
- Copying the whole source before `npm ci`, busting the cache on every change.
- Running as root, huge images, baking secrets into layers.
- No health checks, so traffic hits containers that aren't ready.

@q intermediate | What is the difference between a container and a virtual machine?
VMs virtualise hardware and run a full guest OS on a hypervisor: strong isolation, heavier, slower to start. Containers share the host kernel and isolate processes with namespaces and cgroups: lightweight, start in milliseconds, higher density, slightly weaker isolation.
@followups
- What are namespaces and cgroups?
- What is the difference between CMD and ENTRYPOINT?

@q intermediate | Explain blue-green vs canary deployments.
**Blue-green**: run two identical environments; deploy to the idle one, test, then switch all traffic at once. Instant rollback by switching back; needs double capacity and careful DB migrations. **Canary**: release to a small percentage of traffic, monitor metrics, gradually increase. Limits blast radius; needs good observability and traffic splitting.
@followups
- How do database migrations fit in?
- How do feature flags complement these?

@checklist
- Write a multi-stage Dockerfile with good caching
- Run a compose stack with app, DB and cache
- Explain rolling, blue-green and canary deployments
- Set up a CI pipeline that tests, builds and deploys
- Explain Kubernetes pods, deployments and services

@resources
- [Docker docs: Best practices](https://docs.docker.com/build/building/best-practices/) docs
- [The Twelve-Factor App](https://12factor.net/) article
- [Kubernetes Basics tutorial](https://kubernetes.io/docs/tutorials/kubernetes-basics/) course
