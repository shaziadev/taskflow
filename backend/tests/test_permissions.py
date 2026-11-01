import pytest

from boards.models import Membership

pytestmark = pytest.mark.django_db


def test_creating_board_makes_creator_admin_with_default_columns(api, admin_user):
    res = api(admin_user).post("/api/boards/", {"name": "Launch"}, format="json")
    assert res.status_code == 201
    assert res.data["my_role"] == "admin"

    detail = api(admin_user).get(f"/api/boards/{res.data['id']}/").data
    assert [c["title"] for c in detail["columns"]] == ["To Do", "In Progress", "Done"]


def test_users_only_see_their_boards(api, board, outsider, member_user):
    assert len(api(member_user).get("/api/boards/").data) == 1
    assert api(outsider).get("/api/boards/").data == []
    assert api(outsider).get(f"/api/boards/{board.id}/").status_code == 404


def test_member_can_read_but_not_edit_board(api, board, member_user):
    client = api(member_user)
    assert client.get(f"/api/boards/{board.id}/").status_code == 200
    assert client.patch(f"/api/boards/{board.id}/", {"name": "X"}, format="json").status_code == 403
    assert client.delete(f"/api/boards/{board.id}/").status_code == 403


def test_admin_can_edit_board(api, board, admin_user):
    res = api(admin_user).patch(f"/api/boards/{board.id}/", {"name": "Renamed"}, format="json")
    assert res.status_code == 200
    assert res.data["name"] == "Renamed"


def test_only_admin_can_add_members(api, board, admin_user, member_user, outsider):
    url = f"/api/boards/{board.id}/members/"
    assert api(member_user).post(url, {"username": "eve"}, format="json").status_code == 403

    res = api(admin_user).post(url, {"username": "eve", "role": "member"}, format="json")
    assert res.status_code == 201
    assert Membership.objects.filter(board=board, user=outsider).exists()


def test_board_owner_cannot_be_demoted(api, board, admin_user):
    url = f"/api/boards/{board.id}/members/"
    res = api(admin_user).post(url, {"username": "alice", "role": "member"}, format="json")
    assert res.status_code == 403
    assert Membership.objects.get(board=board, user=admin_user).role == Membership.Role.ADMIN


def test_member_cannot_add_column_but_admin_can(api, board, admin_user, member_user):
    payload = {"board": board.id, "title": "Review"}
    assert api(member_user).post("/api/columns/", payload, format="json").status_code == 403
    res = api(admin_user).post("/api/columns/", payload, format="json")
    assert res.status_code == 201
    assert res.data["position"] == 3


def test_outsider_cannot_create_task_on_board(api, board, outsider):
    column = board.columns.first()
    res = api(outsider).post("/api/tasks/", {"column": column.id, "title": "Hack"}, format="json")
    assert res.status_code == 400


def test_member_can_create_task(api, board, member_user):
    column = board.columns.first()
    res = api(member_user).post(
        "/api/tasks/",
        {"column": column.id, "title": "Write tests", "assignee_id": member_user.id},
        format="json",
    )
    assert res.status_code == 201
    assert res.data["assignee"]["username"] == "bob"


def test_assignee_must_be_board_member(api, board, member_user, outsider):
    column = board.columns.first()
    res = api(member_user).post(
        "/api/tasks/",
        {"column": column.id, "title": "X", "assignee_id": outsider.id},
        format="json",
    )
    assert res.status_code == 400
