import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from data_generator import get_mock_data, find_recurring_spends

app = FastAPI(title="Real Rails: Finance Graph")

# Enable cross-origin communication for the Next.js frontend 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/intelligence/rail-data")
def get_rail_intelligence():
    # 1. Institutional Multi-Account Aggregation [cite: 72, 74]
    accounts, transactions = get_mock_data()
    df = pd.DataFrame([t.model_dump() for t in transactions])
    
    # 2. Intelligence Layer: Separate Income and Outflow [cite: 36, 87]
    is_income = df['category'].apply(lambda c: 'Income' in c)
    total_income = df[is_income]['amount'].sum()
    total_spent = df[~is_income]['amount'].sum()
    
    # Pattern matching for recurring "Ghost" subscriptions [cite: 76, 85]
    recurring = find_recurring_spends(transactions)
    
    # 3. Deterministic AI Model: Calculate Daily Noise Rate 
    # Isolates random spending (Noise) from predictable automated bills (Signal)
    recurring_90d_total = sum(item["total_spent_90d"] for item in recurring)
    noise_90d_total = total_spent - recurring_90d_total
    daily_noise_rate = noise_90d_total / 90
    
    # 4. Financial GPS: Multi-Account Liquidity and Runway [cite: 79, 86]
    total_liquidity = sum(acc.balances.current for acc in accounts)
    daily_burn_rate = total_spent / 90
    runway_days = int(total_liquidity / daily_burn_rate) if daily_burn_rate > 0 else 999
    
    return {
        # High-performance interactive visualization data [cite: 26, 79]
        "main_stage": {
            "transactions": transactions,
        },
        # Intelligence Sidebar populated with institutional context [cite: 27, 82]
        "sidebar": {
            "accounts": accounts,
            "metrics": {
                "total_spent": float(total_spent),
                "total_income": float(total_income),
                "total_liquidity": float(total_liquidity),
                "runway_days": runway_days,
                "daily_noise_rate": float(daily_noise_rate)
            },
            "why_it_matters": "Financial rails are the infrastructure of personal stability.",
            "governance": "Guided by the RBI's Account Aggregator framework and institutional data portability mandates.",
            "insights": recurring
        }
    }