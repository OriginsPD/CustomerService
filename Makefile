# ─────────────────────────────────────────────────────────────────────────────
# VCC Makefile — convenience shortcuts for Docker workflows
# Usage: make <target>
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: dev dev-build down down-v prod prod-build logs \
        db-migrate db-seed db-studio shell-server shell-client

# ── Development ───────────────────────────────────────────────────────────────

## Start dev stack (build if needed)
dev-build:
	docker compose up --build

## Start dev stack (reuse existing images)
dev:
	docker compose up

## Stop dev stack
down:
	docker compose down

## Stop dev stack and remove all volumes (clean slate)
down-v:
	docker compose down -v

## Tail logs from both services
logs:
	docker compose logs -f

## Tail server logs only
logs-server:
	docker compose logs -f server

## Tail client logs only
logs-client:
	docker compose logs -f client

# ── Database (runs inside the server container) ────────────────────────────────

## Generate Drizzle migration files
db-generate:
	docker compose exec server npm run db:generate --workspace=server

## Apply pending migrations to Neon DB
db-migrate:
	docker compose exec server npm run db:migrate --workspace=server

## Seed initial questions
db-seed:
	docker compose exec server npm run db:seed --workspace=server

## Open Drizzle Studio GUI (http://localhost:4983)
db-studio:
	docker compose exec server npm run db:studio --workspace=server

# ── Shells ────────────────────────────────────────────────────────────────────

## Open a shell inside the running server container
shell-server:
	docker compose exec server sh

## Open a shell inside the running client container
shell-client:
	docker compose exec client sh

# ── Production ────────────────────────────────────────────────────────────────

## Build and start production stack
prod-build:
	docker compose -f docker-compose.prod.yml up --build -d

## Start production stack (reuse images)
prod:
	docker compose -f docker-compose.prod.yml up -d

## Stop production stack
prod-down:
	docker compose -f docker-compose.prod.yml down

## Production logs
prod-logs:
	docker compose -f docker-compose.prod.yml logs -f

# ── AI Analysis (manual trigger) ─────────────────────────────────────────────

## Manually trigger the 24h AI feedback analysis
run-analysis:
	curl -s -X POST http://localhost:3001/api/admin/run-analysis | python3 -m json.tool
