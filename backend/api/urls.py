from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProfileViewSet, MedicalRecordViewSet

router = DefaultRouter()
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'profiles/(?P<profile_id>\d+)/records', MedicalRecordViewSet, basename='profile-records')

urlpatterns = [
    path('', include(router.urls)),
] 