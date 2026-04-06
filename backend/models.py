from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date  # <--- This is the missing piece!

# 1. Balance Schema
class Balance(BaseModel):
    available: Optional[float] = None
    current: float
    limit: Optional[float] = None
    currency: str = "USD"

# 2. Account Schema
class Account(BaseModel):
    account_id: str
    name: str
    type: str
    subtype: str
    balances: Balance

# 3. Transaction Schema
class Transaction(BaseModel):
    transaction_id: str
    account_id: str
    amount: float
    date: date  # Pydantic now knows this refers to the import above
    name: str
    category: List[str]
    pending: bool = False