import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from data_generator import get_mock_data, find_recurring_spends

app = FastAPI(title="Real Rails: Finance Graph")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/intelligence/rail-data")
def get_rail_intelligence():
    # 1. Get raw data
    account, transactions = get_mock_data()
    
    # 2. Convert to Pandas for "Orchestration" (Protocol Requirement)
    df = pd.DataFrame([t.model_dump() for t in transactions])
    
    # 3. Derive Intelligence (e.g., Average spend vs. total)
    total_spent = df[df['amount'] > 0]['amount'].sum()
    recurring = find_recurring_spends(transactions)
    
    return {
        "main_stage": {
            "transactions": transactions,
            "total_volume": float(total_spent)
        },
        "sidebar": {
            "metrics": {"total_spent": total_spent, "active_ghosts": len(recurring)},
            "why_it_matters": "Financial rails are the infrastructure of personal stability.", # [cite: 49]
            "governance": "Individual control over institutional payment cycles.", # [cite: 50]
            "insights": recurring
        }
    }