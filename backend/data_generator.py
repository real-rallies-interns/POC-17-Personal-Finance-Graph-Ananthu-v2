from models import Account, Balance

def get_mock_accounts():
    checking = Account(
        account_id="acc_001",
        name="Main Checking",
        type="depository",
        subtype="checking",
        balances=Balance(available=2450.0, current=2500.0)
    )
    return [checking]

if __name__ == "__main__":
    for acc in get_mock_accounts():
        print(acc.model_dump_json(indent=2))