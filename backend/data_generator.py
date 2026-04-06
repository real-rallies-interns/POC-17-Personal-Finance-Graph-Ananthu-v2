from datetime import date, timedelta
import random
from models import Account, Balance, Transaction

def get_mock_data():
    account = Account(
        account_id="acc_001",
        name="Main Checking",
        type="depository",
        subtype="checking",
        balances=Balance(available=2450.0, current=2500.0)
    )

    transactions = []
    start_date = date.today() - timedelta(days=90)

    # 1. Add Recurring "Ghost" Subscriptions (The Traps)
    for i in range(3): # 3 months of history
        tx_date = start_date + timedelta(days=i*30)
        transactions.append(Transaction(
            transaction_id=f"ghost_{i}",
            account_id="acc_001",
            amount=15.99,
            date=tx_date,
            name="Netflix Subscription",
            category=["Service", "Entertainment"]
        ))
        
        # Another one: Gym Membership
        transactions.append(Transaction(
            transaction_id=f"gym_{i}",
            account_id="acc_001",
            amount=45.00,
            date=tx_date + timedelta(days=5),
            name="Gold Fitness",
            category=["Health", "Fitness"]
        ))

    # 2. Add Random Daily Spends (The "Noise")
    for i in range(60):
        random_date = start_date + timedelta(days=random.randint(0, 90))
        transactions.append(Transaction(
            transaction_id=f"rand_{i}",
            account_id="acc_001",
            amount=round(random.uniform(5.0, 50.0), 2),
            date=random_date,
            name=random.choice(["Uber", "Starbucks", "Amazon", "Zomato"]),
            category=["Food" if i%2==0 else "Travel"]
        ))

    return account, transactions

# --- THE GHOST HUNTER LOGIC ---
def find_recurring_spends(transactions):
    """
    Scans transactions to find items with the same name and amount 
    occurring roughly every 30 days.
    """
    analysis = {}
    for tx in transactions:
        if tx.name not in analysis:
            analysis[tx.name] = []
        analysis[tx.name].append(tx)

    recurring = []
    for name, tx_list in analysis.items():
        if len(tx_list) >= 3: # Seen at least 3 times
            recurring.append({
                "name": name,
                "frequency": "Monthly",
                "amount": tx_list[0].amount,
                "last_date": max(t.date for t in tx_list),
                "total_spent_90d": sum(t.amount for t in tx_list)
            })
    return recurring