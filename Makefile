.PHONY: up down migrate seed logs

up:
	docker compose up --build -d

down:
	docker compose down

migrate:
	docker compose exec api node migrations/run.js

seed:
	docker compose exec api node seed.js

logs:
	docker compose logs -f

restart:
	docker compose down && docker compose up --build -d
