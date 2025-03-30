from rest_framework import serializers
from .models import Profile, MedicalRecord

class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = ['id', 'title', 'date', 'description', 'image', 'image_data', 
                 'analysis_summary', 'analysis_actions', 'analysis_recommendations', 
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.image:
            representation['image'] = instance.image.url
        return representation

class ProfileSerializer(serializers.ModelSerializer):
    records = MedicalRecordSerializer(many=True, read_only=True)
    
    class Meta:
        model = Profile
        fields = ['id', 'name', 'relationship', 'records', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at'] 