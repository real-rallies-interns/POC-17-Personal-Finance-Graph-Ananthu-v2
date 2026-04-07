from datetime import date, timedelta
import random
from models import Account, Balance, Transaction

def get_mock_data():
    # 1. MULTI-ACCOUNT AGGREGATION 
    # We now simulate three distinct institutional silos as required by the Case Study.
    accounts = [
        Account(
            account_id="acc_001",
            name="HDFC Savings",
            type="depository",
            subtype="savings",
            balances=Balance(available=145000.0, current=145000.0)
        ),
        Account(
            account_id="acc_002",
            name="SBI Checking",
            type="depository",
            subtype="checking",
            balances=Balance(available=30000.0, current=30000.0)
        ),
        Account(
            account_id="acc_003",
            name="ICICI Credit Card",
            type="credit",
            subtype="credit card",
            balances=Balance(available=75000.0, current=-25000.0, limit=100000.0)
        )
    ]

    transactions = []
    base_date = date.today() - timedelta(days=90)

    # 2. INCOME FLOW (Hits HDFC Savings)
    for i in range(3):
        tx_date = base_date + timedelta(days=(i * 30) + 1)
        transactions.append(Transaction(
            transaction_id=f"inc_{i}",
            account_id="acc_001",
            amount=85000.00,
            date=tx_date,
            name="TechCorp Salary",
            category=["Income", "Salary"]
        ))

    # 3. RECURRING LOAN EMIs (Hits SBI Checking) [cite: 75]
    for i in range(3):
        # Home Loan EMI on the 10th
        transactions.append(Transaction(
            transaction_id=f"loan_home_{i}",
            account_id="acc_002",
            amount=28500.00,
            date=base_date + timedelta(days=i*30 + 9),
            name="HDFC Home Loan EMI",
            category=["Loan", "Housing"]
        ))
        # Car Loan EMI on the 15th
        transactions.append(Transaction(
            transaction_id=f"loan_car_{i}",
            account_id="acc_002",
            amount=11200.00,
            date=base_date + timedelta(days=i*30 + 14),
            name="ICICI Car Loan EMI",
            category=["Loan", "Transport"]
        ))

    # 4. GHOST SUBSCRIPTIONS (Hits Credit Card) [cite: 76]
    for i in range(3):
        transactions.append(Transaction(
            transaction_id=f"ghost_netflix_{i}",
            account_id="acc_003",
            amount=499.00,
            date=base_date + timedelta(days=i*30),
            name="Netflix Subscription",
            category=["Service", "Entertainment"]
        ))
        transactions.append(Transaction(
            transaction_id=f"ghost_gym_{i}",
            account_id="acc_003",
            amount=1999.00,
            date=base_date + timedelta(days=i*30 + 5),
            name="Gold Fitness",
            category=["Health", "Fitness"]
        ))

    # 5. RANDOM DAILY NOISE (Hits Credit Card)
    for i in range(60):
        random_date = base_date + timedelta(days=random.randint(0, 90))
        merchant_name = random.choice(["Uber", "Starbucks", "Amazon", "Zomato", "Swiggy", "Blinkit"])
        transactions.append(Transaction(
            transaction_id=f"rand_{i}",
            account_id="acc_003",
            amount=round(random.uniform(150.0, 2500.0), 2),
            date=random_date,
            name=merchant_name,
            category=["Food" if i%2==0 else "Travel"]
        ))

    return accounts, transactions

def find_recurring_spends(transactions):
    analysis = {}
    expenses = [tx for tx in transactions if "Income" not in tx.category]
    
    for tx in expenses:
        if tx.name not in analysis:
            analysis[tx.name] = []
        analysis[tx.name].append(tx)

    recurring = []
    for name, tx_list in analysis.items():
        if len(tx_list) >= 3:
            recurring.append({
                "name": name,
                "frequency": "Monthly",
                "amount": tx_list[0].amount,
                "last_date": max(t.date for t in tx_list),
                "total_spent_90d": sum(t.amount for t in tx_list)
            })
    return recurring