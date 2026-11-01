from rest_framework.routers import DefaultRouter

from .views import BoardViewSet, ColumnViewSet, TaskViewSet

router = DefaultRouter()
router.register("boards", BoardViewSet, basename="board")
router.register("columns", ColumnViewSet, basename="column")
router.register("tasks", TaskViewSet, basename="task")

urlpatterns = router.urls
