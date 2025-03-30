from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProfileViewSet, MedicalRecordViewSet, TodoViewSet

router = DefaultRouter()
router.register(r'profiles', ProfileViewSet, basename='profile')

profile_router = DefaultRouter()
profile_router.register(r'medical-records', MedicalRecordViewSet, basename='medical-record')
profile_router.register(r'todos', TodoViewSet, basename='todo')

urlpatterns = [
    path('', include(router.urls)),
    path('profiles/<int:profile_pk>/', include(profile_router.urls)),
] 