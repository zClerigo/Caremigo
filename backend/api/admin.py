from django.contrib import admin
from .models import Profile, MedicalRecord

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'relationship', 'created_at', 'updated_at')
    search_fields = ('name', 'relationship')

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ('title', 'profile', 'date', 'created_at')
    list_filter = ('profile', 'date')
    search_fields = ('title', 'description')
