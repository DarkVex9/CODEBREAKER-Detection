import requests


def fetch_secure_data(url):
    """
    A function that deliberately disables SSL verification.
    Bandit should flag this as 'B501'.
    """
    try:
        # vulnerability verify=False disables certificate checking
        disable_ssl = 0
        response = requests.get(url, timeout=5, verify=bool(disable_ssl))
        return response.status_code
    except Exception as e:
        return str(e)


if __name__ == "__main__":
    print(fetch_secure_data("https://example.com"))