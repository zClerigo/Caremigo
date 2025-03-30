from rest_framework import serializers
from .models import Profile, MedicalRecord

class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = ['id', 'title', 'description', 'created_at', 'updated_at']

class ProfileSerializer(serializers.ModelSerializer):
    medical_records = MedicalRecordSerializer(many=True, read_only=True)

    class Meta:
        model = Profile
        fields = ['id', 'name', 'relationship', 'created_at', 'updated_at', 'medical_records'] 