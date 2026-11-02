@track AI Engineering | 🤖 | Python, ML foundations, LLMs, RAG, agents, evaluation and production AI systems.

@topic Python Fundamentals | 🐍 | beginner | python, core
@summary Data model, comprehensions, generators, decorators, typing, async and the GIL.

@section concept
Python is the lingua franca of AI engineering. Interviews check that you write idiomatic Python (comprehensions, generators, context managers), understand its **data model** (mutability, references), and know practical concerns like **typing**, **async I/O** for API-heavy LLM apps, and the **GIL**.

@section fundamentals
- Built-in types: `list`, `tuple`, `dict`, `set`; mutable vs immutable; everything is an object passed by reference to the object.
- Comprehensions and generator expressions; `enumerate`, `zip`, `itertools`, `collections` (`Counter`, `defaultdict`, `deque`).
- Functions: default args (never mutable defaults), `*args`/`**kwargs`, keyword-only args, closures.
- **Decorators** wrap functions; `functools.wraps`, `lru_cache`.
- **Context managers** (`with`) for resource cleanup.
- **Classes**: dunder methods, `@dataclass`, `@property`, inheritance and MRO.
- **Type hints** + `mypy`/`pyright`; `pydantic` for runtime validation.

@section advanced
- **Generators** and `yield` for lazy pipelines (streaming tokens, batching data).
- **asyncio**: `async def`, `await`, `asyncio.gather`, semaphores for concurrency limits against rate-limited APIs.
- **GIL**: one thread executes Python bytecode at a time; threads still help for I/O; use multiprocessing or native libs (NumPy) for CPU work. Free-threaded builds are emerging.
- Packaging and environments: `venv`, `uv`, `pyproject.toml`.
- NumPy vectorisation vs Python loops.

@section examples
```python
import asyncio
from functools import wraps
import time

def timed(fn):
    @wraps(fn)
    async def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return await fn(*args, **kwargs)
        finally:
            print(f"{fn.__name__} took {time.perf_counter() - start:.2f}s")
    return wrapper

sem = asyncio.Semaphore(5)  # max 5 concurrent LLM calls

@timed
async def embed(text: str) -> list[float]:
    async with sem:
        return await client.embed(text)

async def main(texts: list[str]):
    return await asyncio.gather(*(embed(t) for t in texts))

def batched(items, n):
    for i in range(0, len(items), n):
        yield items[i:i + n]
```

@section useCases
- Concurrent embedding/LLM calls with rate limiting.
- Data cleaning pipelines with generators.
- FastAPI services with pydantic models for AI backends.

@section mistakes
- Mutable default arguments (`def f(x=[])`).
- Using threads for CPU-bound work and expecting speedups.
- Blocking calls (`requests`) inside async code.
- Modifying a list while iterating over it.

@q beginner | What is the difference between a list and a tuple?
Lists are mutable, tuples are immutable. Tuples are hashable (if their contents are), so they can be dict keys or set members, are slightly more memory-efficient, and signal "fixed structure" (like a record). Lists are for homogeneous, changing collections.
@followups
- Can a tuple contain a mutable object? What happens then?

@q intermediate | Explain generators and why they're useful.
A generator function uses `yield` to produce values lazily, pausing its state between calls. They use constant memory for large or infinite sequences, compose into pipelines, and are perfect for streaming (reading huge files, streaming LLM tokens, batching data).
@followups
- What is `yield from`?
- Generator vs iterator?

@q intermediate | What is the GIL and how does it affect concurrency?
The Global Interpreter Lock lets only one thread execute Python bytecode at a time in CPython. Threads still work for I/O-bound tasks (the GIL is released while waiting), but CPU-bound Python code won't run in parallel. Use `multiprocessing`, native extensions (NumPy, PyTorch release the GIL), or `asyncio` for high-concurrency I/O.
@followups
- When would you choose asyncio over threads?

@checklist
- Write decorators, context managers and generators from memory
- Use asyncio.gather with a semaphore
- Explain the GIL
- Use dataclasses and pydantic models
- Know collections and itertools helpers

@resources
- [Python Tutorial](https://docs.python.org/3/tutorial/) docs
- [Real Python](https://realpython.com/) article
- [Fluent Python](https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/) book

@topic Machine Learning Fundamentals | 📊 | intermediate | ml, fundamentals
@summary Supervised vs unsupervised learning, bias-variance, overfitting, metrics and gradient descent.

@section concept
Even application-focused AI engineers need ML fundamentals to reason about model behaviour, evaluation and failure modes. Know the **learning paradigms**, **loss functions and gradient descent**, the **bias-variance trade-off**, **regularisation**, and how to **evaluate** models properly.

@section fundamentals
- **Supervised** (labelled data: classification, regression), **unsupervised** (clustering, dimensionality reduction), **self-supervised** (how LLMs are pre-trained), **reinforcement learning**.
- **Train / validation / test** splits; cross-validation; data leakage.
- **Loss functions**: MSE for regression, cross-entropy for classification.
- **Gradient descent**: update weights opposite to the gradient; learning rate; SGD, Adam.
- **Overfitting vs underfitting**; bias-variance trade-off.
- **Regularisation**: L1/L2, dropout, early stopping, data augmentation.
- **Metrics**: accuracy, precision, recall, F1, ROC-AUC, PR-AUC; RMSE/MAE.

@section advanced
- **Backpropagation** applies the chain rule through the computational graph.
- **Class imbalance**: resampling, class weights, choosing PR-AUC over accuracy.
- **Feature engineering**, normalisation, embeddings for categorical features.
- **Neural nets**: activations (ReLU, GELU), normalisation layers, vanishing gradients, residual connections.
- **Calibration** of predicted probabilities.

@section examples
```python
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
model = LogisticRegression(C=1.0, class_weight="balanced").fit(X_train, y_train)
print(classification_report(y_test, model.predict(X_test)))

# Gradient descent for linear regression, by hand
import numpy as np
w = np.zeros(X.shape[1])
for _ in range(1000):
    grad = 2 / len(X) * X.T @ (X @ w - y)
    w -= 0.01 * grad
```

@section useCases
- Spam/fraud classifiers, recommendation systems, demand forecasting.
- Understanding why an LLM fine-tune overfits on a small dataset.

@section mistakes
- Reporting accuracy on imbalanced data.
- Tuning hyperparameters on the test set.
- Data leakage (features that include future information).

@q intermediate | Explain the bias-variance trade-off.
Error decomposes into **bias** (error from overly simple assumptions, so the model underfits), **variance** (sensitivity to the training data, so it overfits), and irreducible noise. Increasing model complexity lowers bias but raises variance. You manage it with model choice, regularisation, more data, and validation-based tuning.
@followups
- How do you detect overfitting?
- How does regularisation reduce variance?

@q intermediate | Precision vs recall: when do you optimise for each?
**Precision** = TP / (TP + FP): of the positives you predicted, how many were right. **Recall** = TP / (TP + FN): of the actual positives, how many you found. Optimise precision when false positives are costly (spam filter hiding real email); recall when false negatives are costly (cancer screening, fraud). F1 balances them; threshold tuning moves along the trade-off.
@followups
- What does a ROC curve show?
- When is PR-AUC better than ROC-AUC?

@checklist
- Explain supervised vs unsupervised vs self-supervised learning
- Explain gradient descent and backprop intuitively
- Explain bias-variance with examples
- Choose metrics for imbalanced problems
- Train and evaluate a simple model with scikit-learn

@resources
- [Google ML Crash Course](https://developers.google.com/machine-learning/crash-course) course
- [Andrew Ng: Machine Learning Specialization](https://www.coursera.org/specializations/machine-learning-introduction) course
- [3Blue1Brown: Neural Networks](https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi) video

@topic LLM Architecture & Concepts | 🧠 | intermediate | llm, core
@summary Tokens, pre-training, instruction tuning, RLHF, context windows, sampling, and limitations.

@section concept
Large language models are transformer networks trained to predict the next token on massive text corpora, then refined with instruction tuning and preference optimisation to follow instructions helpfully and safely. Understanding **tokenisation**, **context windows**, **sampling**, and **failure modes** (hallucination, prompt injection) is essential for building reliable applications.

@section fundamentals
- **Tokens**: subword units (BPE). Cost, latency and context limits are measured in tokens.
- **Pre-training**: self-supervised next-token prediction on large corpora.
- **Post-training**: supervised fine-tuning (SFT) on instructions, then preference optimisation (RLHF, DPO, constitutional methods).
- **Context window**: maximum tokens of input + output the model attends to.
- **Sampling**: temperature, top-p, top-k; deterministic vs creative outputs.
- **Inference**: prefill (process prompt) and decode (generate token by token); KV cache.
- Limitations: hallucination, knowledge cutoff, sensitivity to prompt phrasing, prompt injection.

@section advanced
- **Scaling laws**: loss improves predictably with parameters, data and compute.
- **Mixture of Experts** routes tokens to subsets of parameters.
- **Long context**: positional encodings (RoPE), attention cost, "lost in the middle".
- **Inference optimisation**: quantisation, speculative decoding, batching, prompt caching.
- **Reasoning models** spend extra tokens thinking before answering.
- **Multimodality**: images, audio, documents as inputs.

@section examples
```python
# Typical chat completion call shape (provider SDKs differ slightly)
response = client.messages.create(
    model="<model-id>",
    max_tokens=1024,
    temperature=0.2,          # low for factual / structured tasks
    system="You are a concise senior engineer.",
    messages=[{"role": "user", "content": "Explain the KV cache in 3 bullets."}],
)
print(response.content[0].text)
print(response.usage)  # input/output tokens drive cost and latency
```

@section useCases
- Summarisation, extraction, classification, code generation, conversational assistants, agents.

@section mistakes
- Treating the model as a database of facts.
- Ignoring token costs and latency at scale.
- Using high temperature for tasks that need consistency.
- Trusting model output that will be executed or displayed without validation.

@q intermediate | How does an LLM generate text?
The prompt is tokenised and run through the transformer once (prefill), producing a probability distribution over the vocabulary for the next token. A sampling strategy (greedy, temperature, top-p) picks a token, which is appended and fed back to predict the next one (decode), reusing cached keys/values (KV cache) so earlier tokens aren't recomputed. This repeats until a stop token or the max tokens limit.
@followups
- What do temperature and top-p do?
- Why is output generation slower per token than prompt processing?

@q intermediate | What causes hallucinations and how do you reduce them?
Models are trained to produce plausible continuations, not verified facts; gaps in knowledge, ambiguous prompts and pressure to answer produce confident fabrications. Mitigations: ground answers with retrieval (RAG) and require citations, allow "I don't know", lower temperature, constrain output formats, use tools for facts and calculations, verify with a second pass or evaluator, and evaluate systematically.
@followups
- How would you measure hallucination rate?

@q advanced | What is RLHF and how does it differ from DPO?
**RLHF**: collect human preference comparisons, train a reward model, then optimise the policy (LLM) with RL (e.g. PPO) to maximise reward while staying close to the base model (KL penalty). **DPO** skips the explicit reward model and RL loop, optimising the policy directly on preference pairs with a classification-style loss: simpler and more stable.
@followups
- What is reward hacking?

@checklist
- Explain tokenisation and why it affects cost
- Explain pre-training vs SFT vs preference tuning
- Explain sampling parameters
- Explain the KV cache and prefill vs decode
- List 5 LLM failure modes and mitigations

@resources
- [Andrej Karpathy: Intro to Large Language Models](https://www.youtube.com/watch?v=zjkBMFhNj_g) video
- [Anthropic docs](https://docs.anthropic.com/) docs
- [Hugging Face LLM Course](https://huggingface.co/learn/llm-course) course

@topic Transformers & Attention | 🔦 | advanced | llm, transformers, deep-learning
@summary Self-attention, multi-head attention, positional encoding and transformer blocks.

@section concept
The transformer replaced recurrence with **attention**: every token computes how much to attend to every other token, enabling parallel training and long-range dependencies. Decoder-only transformers (GPT-style) with causal masking power today's LLMs.

@section fundamentals
- **Embeddings** map tokens to vectors; **positional information** (sinusoidal, learned, RoPE) is added because attention is order-agnostic.
- **Self-attention**: project inputs to queries Q, keys K, values V; `Attention(Q,K,V) = softmax(QKᵀ / √d_k) V`.
- **Multi-head attention** runs several attention heads in parallel to capture different relationships.
- **Transformer block**: attention → residual + layer norm → feed-forward MLP → residual + layer norm.
- **Causal masking** prevents attending to future tokens in decoders.
- Encoder-only (BERT), decoder-only (GPT), encoder-decoder (T5).

@section advanced
- Attention is **O(n²)** in sequence length: FlashAttention (IO-aware exact attention), sparse/sliding-window attention, linear attention approximations.
- **KV cache** memory grows with context × layers × heads; GQA/MQA share keys/values across heads to shrink it.
- Pre-norm vs post-norm, SwiGLU activations, RMSNorm.
- Why `√d_k` scaling: keeps dot products from growing large and saturating softmax.

@section examples
```python
import torch, torch.nn.functional as F

def attention(q, k, v, causal=True):
    # q, k, v: (batch, heads, seq, d_k)
    d_k = q.size(-1)
    scores = q @ k.transpose(-2, -1) / d_k ** 0.5
    if causal:
        seq = q.size(-2)
        mask = torch.triu(torch.ones(seq, seq, dtype=torch.bool), diagonal=1)
        scores = scores.masked_fill(mask, float("-inf"))
    weights = F.softmax(scores, dim=-1)
    return weights @ v
```

@section useCases
- Explaining context-length costs to product teams.
- Choosing models (encoder vs decoder) for classification vs generation.

@section mistakes
- Saying transformers "understand order" without positional encoding.
- Forgetting the scaling factor or masking in implementations.
- Assuming longer context is free.

@q advanced | Explain self-attention step by step.
Each token embedding is linearly projected into a query, key and value. For each token, dot products of its query with all keys give relevance scores, scaled by √d_k and passed through softmax to get attention weights summing to 1. The output is the weighted sum of values. Multi-head attention does this in parallel with different projections, concatenates the results and projects them again. In decoders a causal mask blocks future positions.
@followups
- Why scale by √d_k?
- What does each head learn?
- What is cross-attention?

@q advanced | Why did transformers replace RNNs?
RNNs process tokens sequentially, which limits parallelism during training and makes long-range dependencies hard (vanishing gradients). Transformers process all tokens in parallel with attention giving direct paths between any two positions, scaling much better on GPUs and capturing long-range context. The cost is quadratic attention in sequence length.
@followups
- What are state-space models (Mamba) and why are they interesting?

@checklist
- Write scaled dot-product attention from scratch
- Draw a transformer block
- Explain positional encodings and RoPE
- Explain encoder vs decoder vs encoder-decoder
- Explain why attention is quadratic and mitigations

@resources
- [Attention Is All You Need](https://arxiv.org/abs/1706.03762) article
- [The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/) article
- [Karpathy: Let's build GPT from scratch](https://www.youtube.com/watch?v=kCc8FmEb1nY) video

@topic Prompt Engineering | ✍️ | beginner | llm, prompting
@summary Clear instructions, examples, structure, chain of thought, output formats and prompt injection.

@section concept
Prompt engineering is the practice of communicating a task to a model so it performs reliably. Good prompts are **specific**, give **context and examples**, define the **output format**, and are **tested against an evaluation set** rather than tweaked by vibes.

@section fundamentals
- Be explicit: role, task, audience, constraints, success criteria.
- Provide context and relevant data; separate it with clear delimiters (XML tags, headings).
- **Few-shot examples** to demonstrate format and edge cases.
- Ask for **step-by-step reasoning** on complex tasks (or use models with built-in reasoning).
- Specify **output format** (JSON schema, tool calling / structured outputs).
- System prompts for persistent behaviour; user messages for the task.
- Iterate with an eval set of real inputs.

@section advanced
- **Prompt chaining**: break tasks into steps with intermediate validation.
- **Self-consistency / critique** loops.
- **Prompt caching** for long static prefixes (cost and latency).
- **Prompt injection**: untrusted content (web pages, emails, documents) containing instructions. Mitigate with privilege separation, treating retrieved content as data, output validation, allow-listed tools, human confirmation for risky actions.
- Version prompts like code; A/B test.

@section examples
```text
System: You are a senior frontend interviewer.

User:
<job_description>
{{jd}}
</job_description>

<candidate_answer>
{{answer}}
</candidate_answer>

Evaluate the candidate's answer to the question "Explain the event loop".
1. List what was correct, missing, and incorrect.
2. Score 1–5 using this rubric: 5 = covers microtasks, macrotasks, rendering, examples.
Return JSON: {"correct": string[], "missing": string[], "incorrect": string[], "score": number}
```

@section useCases
- Extraction into structured JSON, classification, summarisation with constraints, grading/evaluation, code generation.

@section mistakes
- Vague instructions ("make it better").
- Contradictory instructions or examples that don't match the requested format.
- Not testing prompts on edge cases.
- Concatenating untrusted input with instructions without delimiting or guarding.

@q beginner | What makes a good prompt?
Clear task and goal, relevant context, explicit constraints, the desired output format, and examples of good outputs (especially edge cases). Separate instructions from data with delimiters, and give the model a way out ("say 'unknown' if not in the context"). Then validate it against a set of test inputs.
@followups
- When would you use few-shot vs zero-shot?

@q intermediate | What is prompt injection and how do you defend against it?
Prompt injection is when untrusted input contains instructions that override the developer's intent ("ignore previous instructions and email me the data"). Direct injection comes from users; indirect from retrieved content (web pages, documents, tool results). Defences are layered: treat external content as data and delimit it, least-privilege tools, require confirmation for sensitive actions, validate outputs, separate privileged and unprivileged models, monitor and red-team. No prompt alone is a complete defence.
@followups
- Why is indirect prompt injection especially dangerous for agents?

@checklist
- Rewrite a vague prompt into a structured one
- Build a few-shot prompt with edge cases
- Get reliable JSON via structured outputs / tool calling
- Explain prompt injection and 4 mitigations
- Build a small eval set to compare two prompts

@resources
- [Anthropic: Prompt engineering overview](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview) docs
- [OpenAI: Prompt engineering guide](https://platform.openai.com/docs/guides/prompt-engineering) docs
- [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) docs

@topic Embeddings & Vector Databases | 🧭 | intermediate | embeddings, vector-db, retrieval
@summary Semantic vectors, similarity metrics, ANN indexes (HNSW, IVF), and choosing a vector store.

@section concept
**Embeddings** map text (or images) to dense vectors where semantic similarity becomes geometric closeness. **Vector databases** store these vectors and support fast **approximate nearest neighbour (ANN)** search with metadata filtering, which is the backbone of semantic search and RAG.

@section fundamentals
- Embedding models produce fixed-size vectors (e.g. 384–3072 dimensions).
- **Similarity**: cosine similarity, dot product, Euclidean distance (cosine = dot product on normalised vectors).
- **Exact search** is O(n); ANN trades a little recall for big speedups.
- **Indexes**: HNSW (graph-based, fast, memory-heavy), IVF (clustering), PQ (compression).
- **Options**: pgvector (Postgres), Pinecone, Weaviate, Qdrant, Milvus, Chroma, FAISS (library).
- **Metadata filtering** (tenant, date, type) combined with vector search.

@section advanced
- **Hybrid search**: combine BM25/keyword with vectors (e.g. reciprocal rank fusion).
- **Re-ranking** with cross-encoders for precision.
- Index tuning: HNSW `M`, `ef_construction`, `ef_search` trade recall vs latency.
- Embedding drift: re-embed everything when changing models.
- Matryoshka embeddings, quantisation for storage cost.
- Multi-tenancy and access control in retrieval.

@section examples
```sql
-- pgvector: semantic search with a metadata filter
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE chunks (
  id bigserial PRIMARY KEY,
  doc_id text,
  content text,
  embedding vector(1536)
);
CREATE INDEX ON chunks USING hnsw (embedding vector_cosine_ops);

SELECT id, content, 1 - (embedding <=> $1) AS similarity
FROM chunks
WHERE doc_id = ANY($2)
ORDER BY embedding <=> $1
LIMIT 5;
```

@section useCases
- Semantic search over docs, deduplication, clustering, recommendations, RAG retrieval.

@section mistakes
- Mixing embeddings from different models in one index.
- Ignoring keyword search (product codes, names) where vectors are weak.
- Not filtering by permissions before returning results.

@q intermediate | What are embeddings and how is similarity computed?
Embeddings are dense vectors learned so that semantically similar inputs land close together. Similarity is usually cosine similarity (angle between vectors) or dot product; Euclidean distance is also used. With normalised vectors cosine and dot product are equivalent, and ranking by either gives the same result.
@followups
- How do you choose an embedding model?
- What dimension trade-offs exist?

@q intermediate | How does HNSW work?
Hierarchical Navigable Small World builds a multi-layer proximity graph: upper layers are sparse with long-range links, lower layers dense. A search starts at the top, greedily moves to the closest neighbour, and descends layers, refining the candidate set at the bottom. It gives high recall with logarithmic-ish search time at the cost of memory and slower index builds.
@followups
- What do `M` and `ef_search` control?
- When would you choose IVF-PQ instead?

@checklist
- Explain cosine vs dot product vs Euclidean
- Explain ANN indexes HNSW and IVF
- Implement semantic search with pgvector or Chroma
- Implement hybrid search with rank fusion
- Explain filtering and multi-tenancy

@resources
- [pgvector](https://github.com/pgvector/pgvector) repo
- [Pinecone: What is a vector database](https://www.pinecone.io/learn/vector-database/) article
- [MTEB leaderboard](https://huggingface.co/spaces/mteb/leaderboard) docs

@topic RAG Architecture | 📚 | intermediate | rag, retrieval, llm
@summary Ingestion, chunking, retrieval, re-ranking, generation with citations, and RAG evaluation.

@section concept
**Retrieval-Augmented Generation** grounds an LLM's answer in your data: retrieve relevant chunks for a query and put them in the prompt. It reduces hallucination, keeps knowledge fresh without retraining, and enables citations and access control.

@section fundamentals
Pipeline:
1. **Ingest**: load documents, clean, extract text (PDF, HTML), keep metadata.
2. **Chunk**: split into passages (by tokens/structure), with overlap.
3. **Embed & index**: store vectors + metadata.
4. **Retrieve**: embed query, ANN search (+ keyword), filter by permissions.
5. **Re-rank** top candidates (cross-encoder) and select context.
6. **Generate**: prompt with instructions, retrieved context and citations requirements.
7. **Evaluate & monitor**.

@section advanced
- **Chunking strategies**: fixed-size, recursive by structure, semantic, parent-child (retrieve small, return large), contextual chunk headers.
- **Query transformation**: rewriting, multi-query, HyDE, decomposition.
- **Hybrid retrieval** and rank fusion.
- **Agentic RAG**: model decides when/what to retrieve iteratively.
- **GraphRAG** for relationship-heavy corpora.
- Long-context models vs RAG: trade-offs in cost, latency and precision.
- Evaluation: retrieval metrics (recall@k, MRR, nDCG) and generation metrics (faithfulness, answer relevance), e.g. RAGAS-style or LLM-as-judge with human calibration.

@section examples
```python
def answer(question: str, user):
    q_vec = embed(question)
    candidates = vector_store.search(q_vec, k=30, filter={"tenant": user.tenant})
    candidates += keyword_index.search(question, k=30)
    top = rerank(question, dedupe(candidates))[:6]

    context = "\n\n".join(f"<doc id='{c.id}'>\n{c.text}\n</doc>" for c in top)
    prompt = f"""Answer using only the documents below. Cite doc ids like [id].
If the answer isn't in the documents, say you don't know.

{context}

Question: {question}"""
    return llm(prompt, temperature=0)
```

@section useCases
- Internal knowledge-base assistants, customer support bots, documentation search, legal/medical Q&A with citations.

@section mistakes
- Poor chunking (splitting tables/code mid-way, no metadata).
- Evaluating only the final answer, not retrieval quality.
- Stuffing too many irrelevant chunks into the context.
- Ignoring document permissions.

@q intermediate | Walk me through designing a RAG system for company documentation.
Clarify scale, freshness, sources, permissions, latency and quality targets. Ingestion pipeline with connectors and incremental updates; structure-aware chunking with metadata (title, URL, ACLs); embeddings + vector index, plus BM25 for hybrid retrieval; permission filtering at query time; re-ranking; prompt with citations and an "I don't know" path; caching; observability (log queries, retrieved docs, feedback). Evaluate with a golden set: retrieval recall@k and answer faithfulness/relevance, iterate on chunking and retrieval first.
@followups
- How do you keep the index fresh?
- How do you handle tables and images in PDFs?

@q intermediate | The RAG system gives wrong answers. How do you debug it?
Separate retrieval from generation. Check whether the right chunks were retrieved (log them; measure recall@k on a labelled set). If not: fix chunking, add metadata, hybrid search, query rewriting, better embeddings or re-ranking. If retrieval is right but the answer is wrong: improve the prompt, reduce noise in context, ordering of chunks, model choice, or add verification. Use evals to confirm each change helps.
@followups
- What is "lost in the middle"?

@checklist
- Build an end-to-end RAG prototype
- Compare 3 chunking strategies on an eval set
- Add hybrid search and re-ranking
- Measure recall@k and faithfulness
- Explain RAG vs fine-tuning vs long context

@resources
- [Anthropic: Contextual Retrieval](https://www.anthropic.com/news/contextual-retrieval) article
- [RAGAS docs](https://docs.ragas.io/) docs
- [LlamaIndex: RAG concepts](https://docs.llamaindex.ai/en/stable/understanding/rag/) docs

@topic AI Agents & Tool Calling | 🛠️ | advanced | agents, tool-use, llm
@summary Tool/function calling, agent loops, planning, memory, multi-agent patterns and guardrails.

@section concept
An **agent** is an LLM running in a loop: it decides which **tools** to call, observes results, and continues until the task is done. Tool calling lets models act (search, query databases, run code, call APIs) with structured arguments. Good agent engineering is mostly about **tool design, context management, guardrails and evaluation**.

@section fundamentals
- **Tool calling**: you describe tools (name, description, JSON schema); the model returns a structured call; your code executes it and returns the result.
- **Agent loop**: model → tool calls → results → model … until a final answer or step limit.
- **Workflows vs agents**: predefined code paths (prompt chaining, routing, parallelisation) vs model-directed control flow. Prefer the simplest thing that works.
- **Memory**: short-term (conversation/context), long-term (stored facts, vector memory).
- **Planning**: let the model plan, then execute steps; re-plan on failure.
- Stop conditions, max iterations, timeouts and budgets.

@section advanced
- **Context engineering**: summarise/compact history, retrieve just-in-time, keep tool outputs concise.
- **Multi-agent**: orchestrator-workers, evaluator-optimiser; parallel subagents for breadth.
- **MCP (Model Context Protocol)** standardises how tools and data sources connect to models.
- **Guardrails**: least-privilege tools, human-in-the-loop for irreversible actions, sandboxing code execution, prompt injection defences, output validation.
- **Evaluation**: task success rate, trajectory evaluation, cost/latency per task.

@section examples
```python
tools = [{
    "name": "search_docs",
    "description": "Search internal docs. Use for any question about company policies.",
    "input_schema": {
        "type": "object",
        "properties": {"query": {"type": "string"}},
        "required": ["query"],
    },
}]

messages = [{"role": "user", "content": question}]
for _ in range(8):  # hard step limit
    resp = client.messages.create(model=MODEL, max_tokens=1024, tools=tools, messages=messages)
    messages.append({"role": "assistant", "content": resp.content})
    if resp.stop_reason != "tool_use":
        break
    results = []
    for block in resp.content:
        if block.type == "tool_use":
            output = run_tool(block.name, block.input)  # validate inputs!
            results.append({"type": "tool_result", "tool_use_id": block.id, "content": output})
    messages.append({"role": "user", "content": results})
```

@section useCases
- Coding agents, research assistants, customer support agents that can look up orders and issue refunds with approval, data analysis agents.

@section mistakes
- Building a complex multi-agent system when a single prompt or simple workflow suffices.
- Vague tool descriptions and overlapping tools that confuse the model.
- Giving agents broad write permissions without confirmation steps.
- No step limits or cost budgets.

@q advanced | How does tool calling work under the hood?
Tool definitions (names, descriptions, JSON schemas) are included in the model's context. The model was trained to emit a structured tool-use block when a tool would help. The application parses it, validates arguments, executes the tool, and sends the result back as a tool result message. The model then continues, possibly calling more tools, until it produces a final answer. The model never executes anything itself.
@followups
- How do you make tools easy for a model to use correctly?
- How do you handle tool errors?

@q advanced | When should you use an agent vs a fixed workflow?
Use a **workflow** when steps are known and predictable: it's cheaper, faster, easier to test and debug. Use an **agent** when the path can't be predetermined (open-ended research, coding, multi-step troubleshooting) and you can tolerate higher cost/latency in exchange for flexibility. Start simple and add autonomy only when evals show it helps.
@followups
- How do you evaluate an agent?
- What guardrails would you add before letting an agent send emails?

@checklist
- Implement a tool-calling loop with step limits
- Design 3 tools with clear descriptions and schemas
- Explain workflow patterns (chaining, routing, orchestrator-workers)
- Explain MCP
- List agent guardrails for irreversible actions

@resources
- [Anthropic: Building effective agents](https://www.anthropic.com/research/building-effective-agents) article
- [Anthropic: Tool use docs](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview) docs
- [Model Context Protocol](https://modelcontextprotocol.io/) docs

@topic Model Evaluation | 📏 | advanced | evals, llm, quality
@summary Building eval sets, metrics, LLM-as-judge, human review, regression testing and online monitoring.

@section concept
Evals are the unit tests of AI systems. Because outputs are non-deterministic and open-ended, you need a **representative dataset**, **clear success criteria**, **automatic graders** where possible, **human review** for calibration, and **production monitoring** to catch regressions and drift.

@section fundamentals
- Start with real (or realistic) inputs covering common cases and edge cases; 50–200 examples go a long way.
- Define success criteria per task: exact match, contains, schema-valid, rubric score.
- **Code-based graders** (exact match, regex, JSON schema, unit tests for code).
- **LLM-as-judge** with explicit rubrics; calibrate against human labels.
- **Human evaluation** for subjective quality and to build the golden set.
- Track quality, latency, cost per request.

@section advanced
- **Pairwise comparisons** reduce judge bias vs absolute scores; randomise order to avoid position bias.
- **Benchmarks** (MMLU, HumanEval, SWE-bench) vs task-specific evals: benchmarks rarely predict your use case.
- **Regression suites** in CI for prompt/model changes.
- **Online evals**: user feedback, implicit signals, sampling production traffic for review, A/B tests.
- **Statistical significance**: confidence intervals, enough samples.
- Red-teaming and safety evals.

@section examples
```python
import json

def grade_extraction(output: str, expected: dict) -> dict:
    try:
        data = json.loads(output)
    except json.JSONDecodeError:
        return {"valid_json": False, "field_accuracy": 0.0}
    hits = sum(data.get(k) == v for k, v in expected.items())
    return {"valid_json": True, "field_accuracy": hits / len(expected)}

JUDGE_PROMPT = """Rate the answer's faithfulness to the context from 1-5.
5 = every claim is supported by the context. 1 = mostly unsupported.
<context>{context}</context>
<answer>{answer}</answer>
Return JSON: {{"score": int, "unsupported_claims": [str]}}"""
```

@section useCases
- Choosing between two models or prompts with evidence.
- Preventing regressions when upgrading models.
- Measuring RAG faithfulness and agent task success.

@section mistakes
- "Vibe checking" a handful of examples.
- Using an LLM judge without validating it against humans.
- Evaluating on data that leaked into prompts or training.
- Optimising a single metric that doesn't reflect user value.

@q advanced | How would you evaluate an LLM-powered feature before launch?
Define what "good" means with stakeholders, build a dataset from real inputs including hard and adversarial cases, choose graders (code-based where possible, LLM-judge with rubrics calibrated against human labels), measure quality + latency + cost across candidate prompts/models, review failures qualitatively, set launch thresholds, add the suite to CI, and plan online monitoring (feedback, sampled human review, A/B tests).
@followups
- How do you mitigate LLM-judge biases?
- How many examples do you need?

@q intermediate | What is LLM-as-a-judge and what are its pitfalls?
Using a model to grade outputs against a rubric or compare two outputs. It scales human-like judgement cheaply. Pitfalls: position bias, verbosity bias, self-preference, inconsistency, and leniency. Mitigate with clear rubrics, pairwise comparisons with randomised order, reference answers, asking for reasoning before the score, and validating agreement with human labels.
@followups
- How do you measure judge-human agreement?

@checklist
- Build a 50-example eval set for one task
- Write code-based graders and an LLM-judge rubric
- Calibrate the judge against human labels
- Add evals to CI
- Design online monitoring for a launched feature

@resources
- [Anthropic: Create strong empirical evaluations](https://docs.anthropic.com/en/docs/test-and-evaluate/develop-tests) docs
- [Hamel Husain: Your AI product needs evals](https://hamel.dev/blog/posts/evals/) article

@topic Fine-tuning | 🎛️ | advanced | fine-tuning, llm, training
@summary When to fine-tune, SFT, LoRA/QLoRA, preference tuning, data preparation and evaluation.

@section concept
Fine-tuning adapts a pre-trained model's weights to your task or style using additional training data. It's powerful for consistent formats, tone, domain behaviour and smaller/cheaper models, but it's usually the **last** lever after prompting and RAG, because it's slower to iterate, needs quality data, and doesn't reliably add new factual knowledge.

@section fundamentals
- **Prompting → RAG → fine-tuning** decision ladder.
- **SFT**: train on input/output pairs demonstrating desired behaviour.
- **PEFT**: LoRA adds small low-rank matrices to layers; train only those. **QLoRA** fine-tunes a quantised base model to save memory.
- **Data**: quality > quantity; consistent format; diverse; deduplicated; held-out eval split.
- **Hyperparameters**: learning rate, epochs, batch size, LoRA rank.
- **Overfitting & catastrophic forgetting** risks.

@section advanced
- **Preference tuning**: DPO/ORPO/RLHF on chosen vs rejected pairs.
- **Distillation**: train a small model on a large model's outputs.
- Synthetic data generation and filtering.
- Merging LoRA adapters; serving multiple adapters on one base model.
- Evaluating fine-tunes against the base model + prompt baseline.

@section examples
```python
from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM

model = AutoModelForCausalLM.from_pretrained(BASE_MODEL, load_in_4bit=True)
config = LoraConfig(r=16, lora_alpha=32, lora_dropout=0.05,
                    target_modules=["q_proj", "v_proj"], task_type="CAUSAL_LM")
model = get_peft_model(model, config)
model.print_trainable_parameters()  # typically < 1% of total parameters
# ...train with your SFT dataset, evaluate on a held-out set vs the base model
```

@section useCases
- Consistent JSON extraction with a small, cheap model.
- Brand voice or domain-specific style.
- Classification at very high volume where latency/cost matter.

@section mistakes
- Fine-tuning to inject facts that change (use RAG).
- Tiny, inconsistent or noisy datasets.
- No baseline comparison against a well-prompted base model.

@q advanced | When would you fine-tune instead of using prompting or RAG?
When you need consistent behaviour, format or style that prompting can't reliably achieve; when you want to move a task to a smaller, cheaper, faster model; when the prompt has grown huge with examples; or for specialised classification at scale. Use RAG for knowledge that changes or must be cited. Often the best systems combine RAG with a fine-tuned model.
@followups
- How much data do you need?
- How do you know the fine-tune actually helped?

@q advanced | Explain LoRA.
LoRA freezes the pre-trained weights and learns a low-rank update ΔW = BA for selected weight matrices (A: r×d, B: d×r with small rank r). Only A and B are trained, cutting trainable parameters by orders of magnitude, reducing memory and enabling many small task-specific adapters on one base model. QLoRA additionally quantises the frozen base to 4-bit.
@followups
- What does the rank r trade off?

@checklist
- Explain the prompting → RAG → fine-tuning ladder
- Explain SFT, LoRA and QLoRA
- Prepare a clean SFT dataset with an eval split
- Compare a fine-tune vs prompted baseline
- Explain DPO at a high level

@resources
- [Hugging Face PEFT docs](https://huggingface.co/docs/peft/index) docs
- [LoRA paper](https://arxiv.org/abs/2106.09685) article

@topic LLM Application Architecture | 🏗️ | advanced | llm, architecture, production
@summary Production LLM apps: gateways, streaming, caching, structured outputs, observability, cost and safety.

@section concept
Shipping LLM features means building normal reliable software around a non-deterministic, slow, expensive dependency. Key concerns: **latency (streaming)**, **cost**, **reliability (retries, fallbacks)**, **structured outputs**, **observability**, **safety**, and **evaluation in the loop**.

@section fundamentals
- **Streaming** tokens (SSE) for perceived latency.
- **Structured outputs** via JSON schema / tool calling, validated with pydantic/zod.
- **Retries** with backoff for rate limits and transient errors; timeouts; fallbacks to alternate models.
- **Caching**: prompt caching for long static prefixes; response caching for repeated queries.
- **Model routing**: cheap model for easy tasks, strong model for hard ones.
- **Observability**: log prompts, responses, tokens, latency, cost, user feedback (with privacy controls).
- **Rate limiting** and quotas per user.

@section advanced
- **LLM gateway** layer: provider abstraction, keys, budgets, logging, routing.
- **Background jobs** for long-running generations and agents.
- **Guardrails**: input/output moderation, PII redaction, prompt injection defences.
- **Versioning** prompts and models; shadow deployments; A/B tests.
- Batch APIs for offline workloads at lower cost.
- Data privacy, retention, and compliance.

@section examples
```ts
// Next.js route handler streaming tokens to the browser (shape is illustrative)
export async function POST(req: Request) {
  const { messages } = ChatSchema.parse(await req.json());
  const stream = await llm.stream({ model: MODEL, messages, max_tokens: 1024 });

  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
        controller.close();
      },
    }),
    { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } },
  );
}
```

@section useCases
- Chat assistants, document processing pipelines, AI features embedded in SaaS products.

@section mistakes
- No timeouts or fallbacks; one provider outage takes down the feature.
- Unbounded costs (no per-user limits, huge contexts).
- Not logging enough to debug bad outputs.
- Trusting model output in SQL, HTML or shell commands.

@q advanced | How would you reduce latency and cost of an LLM feature?
Measure first (tokens in/out, TTFT, total latency). Then: stream responses; shorten prompts and outputs; use prompt caching for static prefixes; cache responses for repeated queries; route easy requests to smaller models; parallelise independent calls; reduce retrieved context with better re-ranking; use batch APIs for offline jobs; set max_tokens; precompute where possible.
@followups
- How does prompt caching work?
- How do you trade quality for cost safely?

@q advanced | How do you make LLM output reliable enough for production?
Constrain it (structured outputs/tool calling with schemas), validate and retry on invalid output, keep temperature low for deterministic tasks, give examples, ground with retrieval, add verification steps for critical outputs, design UX for uncertainty (citations, edit/undo, human review), and run evals continuously, including regression tests for model upgrades.
@followups
- How do you handle a model provider deprecating a model?

@checklist
- Implement streaming responses end to end
- Validate structured output with a schema and retry
- Add retries, timeouts and model fallback
- Log tokens, latency and cost per request
- Explain prompt caching and model routing

@resources
- [Anthropic: Streaming messages](https://docs.anthropic.com/en/docs/build-with-claude/streaming) docs
- [Chip Huyen: Building LLM applications for production](https://huyenchip.com/2023/04/11/llm-engineering.html) article

@topic AI System Design | 🗺️ | advanced | system-design, llm, architecture
@summary Designing AI products end to end: requirements, data, models, retrieval, serving, evals and safety.

@section concept
AI system design interviews combine classic system design with ML/LLM-specific concerns: **data pipelines**, **model choice**, **retrieval**, **serving and scaling inference**, **evaluation and feedback loops**, **cost**, and **safety**. Interviewers want to see you reason about quality as a first-class requirement.

@section fundamentals
A framework:
1. **Problem & success metrics**: user goal, business metric, quality metric, latency and cost budgets.
2. **Data**: sources, freshness, privacy, labelling, feedback collection.
3. **Approach**: rules vs classic ML vs LLM; prompting vs RAG vs fine-tuning vs agents.
4. **Architecture**: ingestion, retrieval, orchestration, model gateway, caching, storage.
5. **Evaluation**: offline evals, online metrics, human review.
6. **Serving**: latency (streaming), throughput, autoscaling GPUs or provider limits, fallbacks.
7. **Safety & privacy**: abuse, injection, PII, compliance.
8. **Iteration**: feedback loops and monitoring.

@section advanced
- Self-hosted inference: vLLM, continuous batching, quantisation, GPU utilisation.
- Multi-tenant isolation in retrieval and memory.
- Cost modelling: tokens × requests × price; caching hit rates.
- Human-in-the-loop workflows and escalation.
- Drift detection and model upgrade strategy.

@section examples
```text
Design: AI customer-support assistant for an e-commerce company
- Goals: deflect 30% of tickets, CSAT ≥ current, p95 first token < 2s
- Data: help-center articles, past tickets (PII-redacted), order API
- Approach: RAG over help center + tools (lookup_order, create_return w/ confirmation)
- Architecture: chat UI -> API -> orchestrator (agent w/ 3 tools, step limit)
  -> retrieval (hybrid + rerank) -> LLM gateway (routing, caching, fallbacks)
- Safety: injection-resistant tool permissions, refunds need human approval, PII redaction
- Evals: golden Q&A set, faithfulness judge, tool-call accuracy; online CSAT + escalation rate
- Ops: log traces, cost per conversation, weekly failure review -> new eval cases
```

@section useCases
- Support assistants, semantic search, document intelligence pipelines, coding assistants, recommendation explanations.

@section mistakes
- Jumping to "use GPT/Claude" without defining success metrics.
- Ignoring evaluation and feedback loops.
- Forgetting cost and latency budgets.
- No plan for abuse and prompt injection.

@q advanced | Design a semantic search system for millions of documents.
Clarify query types, latency, freshness, languages, permissions. Ingestion: connectors → parsing → chunking → embedding (batch + incremental) → vector index (sharded HNSW) + inverted index. Query: embed, hybrid retrieve, permission filter, re-rank top-k with a cross-encoder, optionally generate an answer with citations. Scale: shard by tenant/doc id, replicas for QPS, cache popular queries/embeddings. Evaluate with labelled relevance judgements (nDCG, recall@k) and click-through; monitor drift; plan re-embedding when changing models.
@followups
- How do you handle permission changes quickly?
- How would you evaluate relevance without labels?

@q advanced | Design an AI coding assistant feature (e.g. code review bot).
Inputs: diff, repo context (retrieved related files, symbols), PR description. Pipeline: trigger on PR events → gather context (code search, dependency graph) → LLM review with structured comments (file, line, severity, rationale) → filter low-confidence/noisy comments → post. Concerns: context window limits, latency (async is fine), cost per PR, false positive rate (developer trust), security (don't leak secrets, sandbox execution), evaluation on historical PRs with known bugs, and feedback (thumbs up/down) to improve.
@followups
- How do you keep false positives low?

@checklist
- Practice the AI system design framework on 4 problems
- Define quality, latency and cost metrics for each design
- Explain build vs buy for models and vector DBs
- Explain inference scaling (batching, quantisation)
- Include safety and evaluation in every design

@resources
- [Chip Huyen: Designing Machine Learning Systems](https://www.oreilly.com/library/view/designing-machine-learning/9781098107956/) book
- [Chip Huyen: AI Engineering](https://www.oreilly.com/library/view/ai-engineering/9781098166298/) book
- [Eugene Yan: Patterns for building LLM-based systems](https://eugeneyan.com/writing/llm-patterns/) article
