import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from boards.models import Membership
from boards.services import create_board

User = get_user_model()


@pytest.fixture
def make_user(db):
    def _make(username="alice", email=None, password="StrongPass!123"):
        return User.objects.create_user(
            username=username, email=email or f"{username}@example.com", password=password
        )

    return _make


@pytest.fixture
def api():
    """Return a function that builds an APIClient logged in as `user`."""

    def _client(user=None):
        client = APIClient()
        if user is not None:
            client.force_authenticate(user=user)
        return client

    return _client


@pytest.fixture
def admin_user(make_user):
    return make_user("alice")


@pytest.fixture
def member_user(make_user):
    return make_user("bob")


@pytest.fixture
def outsider(make_user):
    return make_user("eve")


@pytest.fixture
def board(admin_user, member_user):
    board = create_board(owner=admin_user, name="Sprint 1")
    Membership.objects.create(board=board, user=member_user, role=Membership.Role.MEMBER)
    return board
