# OptX AI Migration: Anthropic Claude → OpenAI

## Codex Prompt

> **Objective**: Migrate the OptX Python FastAPI backend from the Anthropic Claude SDK to the OpenAI Python SDK. Replace all Anthropic API calls with OpenAI-equivalent calls. Use `gpt-4o` as the default model for chat and agent analysis, and `gpt-4o-mini` for the scenario parsing endpoint. Do not change any business logic, simulation engines, data models, or API contracts.

---

## Context

OptX is a business simulation platform with a Python FastAPI microservice (`python/`) that powers:

1. **Monte Carlo / Bayesian / Sensitivity / Backtest simulation engines** (pure math, no AI — do not touch)
2. **AI Chat endpoint** (`/chat`) — general business Q&A and NLP scenario parsing
3. **6-Agent analysis system** (`/agents/analyze`) — parallel AI agents (market, financial, growth, risk, brand, operations) that analyze simulation results and run debate rounds

The AI layer currently uses `anthropic==0.34.2` and the `claude-sonnet-4-20250514` model.

---

## Files to Modify

### 1. `python/requirements.txt`

- **Remove**: `anthropic==0.34.2`
- **Add**: `openai>=1.40.0`

### 2. `python/main.py`

**Imports** (line 16):
- Replace `from anthropic import Anthropic` → `from openai import OpenAI`

**Environment variable** (lines 34–40):
- Rename `ANTHROPIC_API_KEY` → `OPENAI_API_KEY` everywhere
- Update the warning message to reference `OPENAI_API_KEY`

**Client initialization** (line 43):
- Replace `anthropic_client = Anthropic(api_key=...)` → `openai_client = OpenAI(api_key=...)`

**Chat endpoint** (`/chat`, lines 400–446):
- Replace the `anthropic_client.messages.create(...)` call with `openai_client.chat.completions.create(...)`
- Map the API signature:
  ```python
  # Before (Anthropic)
  response = anthropic_client.messages.create(
      model="claude-sonnet-4-20250514",
      max_tokens=1024,
      system=system_prompt,
      messages=messages,
  )
  reply = response.content[0].text

  # After (OpenAI)
  response = openai_client.chat.completions.create(
      model="gpt-4o-mini" if request.mode == "parse_scenario" else "gpt-4o",
      max_tokens=1024,
      messages=[{"role": "system", "content": system_prompt}] + messages,
  )
  reply = response.choices[0].message.content
  ```
- Note: OpenAI uses `messages` array with a system message as the first element, not a separate `system` parameter.

### 3. `python/agents/base.py`

**Import** (line 15):
- Replace `import anthropic` → `from openai import OpenAI`

**`BaseAgent.__init__`** (lines 44–51):
- Replace `self.api_key = os.getenv("ANTHROPIC_API_KEY", "")` → `self.api_key = os.getenv("OPENAI_API_KEY", "")`
- Replace `self.client = anthropic.Anthropic(api_key=self.api_key)` → `self.client = OpenAI(api_key=self.api_key)`
- Replace `self.model = "claude-sonnet-4-20250514"` → `self.model = "gpt-4o"`

**`BaseAgent._call_claude`** (lines 65–89):
- Rename method to `_call_llm` (or `_call_openai`)
- Update the warning message to reference `OPENAI_API_KEY`
- Replace the API call:
  ```python
  # Before (Anthropic)
  message = self.client.messages.create(
      model=self.model,
      max_tokens=max_tokens,
      system=self.system_prompt,
      messages=[{"role": "user", "content": prompt}],
  )
  return message.content[0].text

  # After (OpenAI)
  response = self.client.chat.completions.create(
      model=self.model,
      max_tokens=max_tokens,
      messages=[
          {"role": "system", "content": self.system_prompt},
          {"role": "user", "content": prompt},
      ],
  )
  return response.choices[0].message.content
  ```

**Update all subclass references**: Search all 6 agent files for any calls to `_call_claude` and rename them to `_call_llm`:
- `python/agents/market.py`
- `python/agents/financial.py`
- `python/agents/growth.py`
- `python/agents/risk.py`
- `python/agents/brand.py`
- `python/agents/operations.py`

### 4. `.env` (or environment configuration)

- Rename `ANTHROPIC_API_KEY=sk-ant-...` → `OPENAI_API_KEY=sk-...`
- Ensure the OpenAI API key is set

---

## API Mapping Reference

| Anthropic | OpenAI |
|---|---|
| `anthropic.Anthropic(api_key=...)` | `openai.OpenAI(api_key=...)` |
| `client.messages.create(model, max_tokens, system, messages)` | `client.chat.completions.create(model, max_tokens, messages)` |
| `response.content[0].text` | `response.choices[0].message.content` |
| `system=` parameter (separate) | First message with `role: "system"` |
| `claude-sonnet-4-20250514` | `gpt-4o` (general) / `gpt-4o-mini` (parsing) |

---

## Model Selection Strategy

| Endpoint | Model | Rationale |
|---|---|---|
| `/chat` (general) | `gpt-4o` | Best balance of quality and cost for business Q&A |
| `/chat` (parse_scenario) | `gpt-4o-mini` | Structured JSON extraction — cheaper, still accurate |
| `/agents/analyze` (all 6 agents) | `gpt-4o` | Needs strong reasoning for multi-agent debate |

---

## What NOT to Change

- `python/engine/` — All simulation engines (monte_carlo, bayesian, sensitivity, backtest, garch, variable_universe) are pure math. Do not touch.
- `python/agents/coordinator.py` — Orchestration logic is AI-provider agnostic. Do not touch (unless renaming `_call_claude` references).
- API request/response schemas — All Pydantic models, route signatures, and JSON contracts must remain identical.
- Frontend — No frontend changes needed (it calls the same FastAPI endpoints).

---

## Verification

After migration, verify:

1. `pip install -r requirements.txt` succeeds
2. `uvicorn main:app --reload --port 8000` starts without import errors
3. `GET /health` returns `{"status": "ok"}`
4. `POST /chat` with a test message returns an AI response
5. `POST /chat` with `mode: "parse_scenario"` returns valid parsed JSON
6. `POST /simulate` still works (no AI changes, but confirm no regressions)
7. `POST /agents/analyze` returns agent analyses (requires valid `OPENAI_API_KEY`)

---

## Output

Save this migration as a single commit with message: `chore: migrate AI backend from Anthropic Claude to OpenAI GPT-4o`
