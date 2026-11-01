import pytest

from boards.models import Task
from boards.services import create_board

pytestmark = pytest.mark.django_db


@pytest.fixture
def columns(board):
    todo, doing, done = board.columns.all()
    return todo, doing, done


def make_tasks(column, *titles):
    return [
        Task.objects.create(column=column, title=title, position=i)
        for i, title in enumerate(titles)
    ]


def titles(column):
    return list(column.tasks.order_by("position").values_list("title", flat=True))


def test_move_task_within_same_column(api, member_user, columns):
    todo, _, _ = columns
    a, b, c = make_tasks(todo, "A", "B", "C")
    res = api(member_user).post(
        f"/api/tasks/{c.id}/move/", {"column": todo.id, "position": 0}, format="json"
    )
    assert res.status_code == 200
    assert titles(todo) == ["C", "A", "B"]


def test_move_task_to_another_column(api, member_user, columns):
    todo, doing, _ = columns
    a, b, c = make_tasks(todo, "A", "B", "C")
    make_tasks(doing, "X", "Y")

    res = api(member_user).post(
        f"/api/tasks/{b.id}/move/", {"column": doing.id, "position": 1}, format="json"
    )
    assert res.status_code == 200
    assert res.data["column"] == doing.id
    assert titles(todo) == ["A", "C"]
    assert titles(doing) == ["X", "B", "Y"]
    # Positions are always contiguous after a move.
    assert list(doing.tasks.order_by("position").values_list("position", flat=True)) == [0, 1, 2]


def test_move_position_is_clamped_to_end(api, member_user, columns):
    todo, doing, _ = columns
    (a,) = make_tasks(todo, "A")
    make_tasks(doing, "X")
    api(member_user).post(
        f"/api/tasks/{a.id}/move/", {"column": doing.id, "position": 99}, format="json"
    )
    assert titles(doing) == ["X", "A"]


def test_cannot_move_task_to_other_board(api, admin_user, columns):
    todo, _, _ = columns
    (a,) = make_tasks(todo, "A")
    other = create_board(owner=admin_user, name="Other")
    res = api(admin_user).post(
        f"/api/tasks/{a.id}/move/",
        {"column": other.columns.first().id, "position": 0},
        format="json",
    )
    assert res.status_code == 400


def test_outsider_cannot_move_task(api, outsider, columns):
    todo, doing, _ = columns
    (a,) = make_tasks(todo, "A")
    res = api(outsider).post(
        f"/api/tasks/{a.id}/move/", {"column": doing.id, "position": 0}, format="json"
    )
    assert res.status_code == 404


def test_new_tasks_are_appended_to_column(api, member_user, columns):
    todo, _, _ = columns
    make_tasks(todo, "A", "B")
    res = api(member_user).post("/api/tasks/", {"column": todo.id, "title": "C"}, format="json")
    assert res.data["position"] == 2
