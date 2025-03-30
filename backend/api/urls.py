from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProfileViewSet, MedicalRecordViewSet, TaskViewSet

router = DefaultRouter()
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'profiles/(?P<profile_id>\d+)/records', MedicalRecordViewSet, basename='profile-records')
router.register(r'profiles/(?P<profile_id>\d+)/tasks', TaskViewSet, basename='profile-tasks')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'records', MedicalRecordViewSet, basename='record')

urlpatterns = [
    path('', include(router.urls)),
] 