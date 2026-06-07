from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ["id", "title", "content", "created_at", "indexed_at", "chunk_count"]
        read_only_fields = ["id", "created_at", "indexed_at", "chunk_count"]


class QuerySerializer(serializers.Serializer):
    query = serializers.CharField(min_length=1, max_length=2000)
