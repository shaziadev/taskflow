from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Board, Column, Membership, Task
from .permissions import IsBoardAdminOrReadOnly, IsBoardMember, get_role
from .serializers import (
    AddMemberSerializer,
    BoardDetailSerializer,
    BoardListSerializer,
    ColumnSerializer,
    MembershipSerializer,
    TaskMoveSerializer,
    TaskSerializer,
)
from .services import create_board, move_task


class BoardViewSet(viewsets.ModelViewSet):
    """
    /api/boards/            list + create
    /api/boards/{id}/       retrieve (with columns & tasks) / update / delete
    /api/boards/{id}/members/            list + add members (admin)
    /api/boards/{id}/members/{user_id}/  remove member (admin)
    """

    permission_classes = [IsAuthenticated, IsBoardAdminOrReadOnly]

    def get_queryset(self):
        # Users only ever see boards they are a member of.
        qs = Board.objects.filter(memberships__user=self.request.user).annotate(
            task_count=Count("columns__tasks", distinct=True)
        )
        if self.action == "retrieve":
            qs = qs.prefetch_related(
                "columns__tasks__assignee", "memberships__user"
            )
        return qs

    def get_serializer_class(self):
        return BoardDetailSerializer if self.action == "retrieve" else BoardListSerializer

    def create(self, request, *args, **kwargs):
        serializer = BoardListSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        board = create_board(owner=request.user, **serializer.validated_data)
        board = self.get_queryset().get(pk=board.pk)
        return Response(
            BoardListSerializer(board, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["get", "post"])
    def members(self, request, pk=None):
        board = self.get_object()  # runs IsBoardAdminOrReadOnly (POST = admin only)
        if request.method == "GET":
            data = MembershipSerializer(board.memberships.select_related("user"), many=True).data
            return Response(data)

        serializer = AddMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data["username"].pk == board.owner_id:
            raise PermissionDenied("The board owner's role can't be changed.")
        membership, _ = Membership.objects.update_or_create(
            board=board,
            user=serializer.validated_data["username"],
            defaults={"role": serializer.validated_data["role"]},
        )
        return Response(MembershipSerializer(membership).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path=r"members/(?P<user_id>\d+)")
    def remove_member(self, request, pk=None, user_id=None):
        board = self.get_object()
        if int(user_id) == board.owner_id:
            raise PermissionDenied("The board owner cannot be removed.")
        membership = get_object_or_404(Membership, board=board, user_id=user_id)
        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ColumnViewSet(
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Columns are created/renamed/deleted by board admins only."""

    serializer_class = ColumnSerializer
    permission_classes = [IsAuthenticated, IsBoardAdminOrReadOnly]

    def get_queryset(self):
        return Column.objects.filter(board__memberships__user=self.request.user)

    def perform_create(self, serializer):
        board = serializer.validated_data["board"]
        if get_role(self.request.user, board) != Membership.Role.ADMIN:
            raise PermissionDenied("Only board admins can add columns.")
        serializer.save(position=board.columns.count())


class TaskViewSet(viewsets.ModelViewSet):
    """CRUD for tasks plus POST /api/tasks/{id}/move/ for drag-and-drop."""

    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsBoardMember]

    def get_queryset(self):
        qs = Task.objects.filter(
            column__board__memberships__user=self.request.user
        ).select_related("assignee", "column")
        board_id = self.request.query_params.get("board")
        if board_id:
            qs = qs.filter(column__board_id=board_id)
        return qs

    def perform_create(self, serializer):
        column = serializer.validated_data["column"]
        serializer.save(created_by=self.request.user, position=column.tasks.count())

    @action(detail=True, methods=["post"])
    def move(self, request, pk=None):
        task = self.get_object()
        serializer = TaskMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        to_column = serializer.validated_data["column"]
        if to_column.board_id != task.column.board_id:
            return Response(
                {"column": "Target column must belong to the same board."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        task = move_task(task, to_column, serializer.validated_data["position"])
        return Response(TaskSerializer(task, context={"request": request}).data)
