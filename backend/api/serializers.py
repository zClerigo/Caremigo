from rest_framework import serializers
from .models import Profile, MedicalRecord

class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = ['id', 'title', 'date', 'description', 'image', 'created_at']

class ProfileSerializer(serializers.ModelSerializer):
    records = MedicalRecordSerializer(many=True, read_only=True)
    
    class Meta:
        model = Profile
        fields = ['id', 'name', 'relationship', 'records'] 