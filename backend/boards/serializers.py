from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.serializers import UserSerializer

from .models import Board, Column, Membership, Task
from .permissions import get_role

User = get_user_model()


class TaskSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        source="assignee",
        queryset=User.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Task
        fields = (
            "id",
            "column",
            "title",
            "description",
            "priority",
            "assignee",
            "assignee_id",
            "due_date",
            "position",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("position", "created_at", "updated_at")

    def validate_column(self, column):
        # A user can only add tasks to boards they belong to.
        user = self.context["request"].user
        if get_role(user, column.board) is None:
            raise serializers.ValidationError("You are not a member of this board.")
        return column

    def validate(self, attrs):
        column = attrs.get("column") or getattr(self.instance, "column", None)
        assignee = attrs.get("assignee")
        if assignee and column and get_role(assignee, column.board) is None:
            raise serializers.ValidationError(
                {"assignee_id": "Assignee must be a member of the board."}
            )
        return attrs


class TaskMoveSerializer(serializers.Serializer):
    """Payload sent by the drag-and-drop UI when a card is dropped."""

    column = serializers.PrimaryKeyRelatedField(queryset=Column.objects.all())
    position = serializers.IntegerField(min_value=0)


class ColumnSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Column
        fields = ("id", "board", "title", "position", "tasks")


class MembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Membership
        fields = ("id", "user", "role", "joined_at")


class AddMemberSerializer(serializers.Serializer):
    username = serializers.CharField()
    role = serializers.ChoiceField(
        choices=Membership.Role.choices, default=Membership.Role.MEMBER
    )

    def validate_username(self, value):
        try:
            return User.objects.get(username=value)
        except User.DoesNotExist as exc:
            raise serializers.ValidationError("User not found.") from exc


class BoardListSerializer(serializers.ModelSerializer):
    my_role = serializers.SerializerMethodField()
    task_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Board
        fields = ("id", "name", "description", "my_role", "task_count", "created_at")

    def get_my_role(self, board):
        return get_role(self.context["request"].user, board)


class BoardDetailSerializer(BoardListSerializer):
    columns = ColumnSerializer(many=True, read_only=True)
    memberships = MembershipSerializer(many=True, read_only=True)

    class Meta(BoardListSerializer.Meta):
        fields = BoardListSerializer.Meta.fields + ("columns", "memberships")
