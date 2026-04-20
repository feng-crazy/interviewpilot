.PHONY: install backend frontend dev stop clean test

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm run dev

dev:
	@echo "Starting backend and frontend..."
	@make backend & make frontend

stop:
	@echo "Stopping backend and frontend..."
	@lsof -ti:8000 | xargs kill -9 2>/dev/null || echo "No backend scheme found on port 8000"
	@lsof -ti:5173 | xargs kill -9 2>/dev/null || echo "No frontend scheme found on port 5173"
	@echo "Services stopped."

clean:
	rm -rf backend/data/*.db
	rm -rf frontend/dist
	rm -rf __pycache__ .pycache

test:
	cd backend && pytest -v
	cd frontend && npm test