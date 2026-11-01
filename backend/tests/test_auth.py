import pytest

pytestmark = pytest.mark.django_db


def test_register_and_login_returns_jwt_pair(api):
    client = api()
    res = client.post(
        "/api/auth/register/",
        {"username": "shazia", "email": "shazia@example.com", "password": "StrongPass!123"},
        format="json",
    )
    assert res.status_code == 201
    assert "password" not in res.data

    res = client.post(
        "/api/auth/login/",
        {"username": "shazia", "password": "StrongPass!123"},
        format="json",
    )
    assert res.status_code == 200
    assert {"access", "refresh"} <= set(res.data)

    client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
    me = client.get("/api/auth/me/")
    assert me.status_code == 200
    assert me.data["username"] == "shazia"


def test_refresh_token_issues_new_access_token(api, make_user):
    make_user("bob")
    client = api()
    tokens = client.post(
        "/api/auth/login/", {"username": "bob", "password": "StrongPass!123"}, format="json"
    ).data
    res = client.post("/api/auth/refresh/", {"refresh": tokens["refresh"]}, format="json")
    assert res.status_code == 200
    assert "access" in res.data


def test_register_rejects_duplicate_email(api, make_user):
    make_user("bob", email="bob@example.com")
    res = api().post(
        "/api/auth/register/",
        {"username": "bob2", "email": "BOB@example.com", "password": "StrongPass!123"},
        format="json",
    )
    assert res.status_code == 400
    assert "email" in res.data


def test_endpoints_require_authentication(api):
    assert api().get("/api/boards/").status_code == 401
