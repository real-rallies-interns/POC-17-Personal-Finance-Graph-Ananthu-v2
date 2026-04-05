from pydantic import BaseModel, Field
from typing import Optional

class Balance(BaseModel):
    available: Optional[float] = None
    current: float
    limit: Optional[float] = None
    currency: str = "USD"

class Account(BaseModel):
    account_id: str
    name: str
    type: str
    subtype: str
    balances: Balance