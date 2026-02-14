# Backend setup

## Requirements
- Python 3.10+
- MongoDB

## Setup
1) Create and activate a virtual environment

```bash
python3 -m venv env
source env/bin/activate
```

2) Install dependencies

```bash
pip install -r requirements.txt
```

3) Create a .env file with your MongoDB URL

```bash
MONGODB_URL=mongodb://localhost:27017/vehicle_counter
```

4) Run the API

```bash
uvicorn main:app --reload --port 8000
```

## Notes
- The API exposes CORS for http://localhost:5173 by default.
- Health check: http://localhost:8000/health
