from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Document
from .serializers import DocumentSerializer, QuerySerializer


def _ingest_document(document: Document) -> int:
    """Embed and store document content in pgvector via LlamaIndex."""
    from llama_index.core import VectorStoreIndex, StorageContext
    from llama_index.core import Document as LIDocument
    from src.indexer import setup_llama_settings, get_vector_store

    setup_llama_settings()
    li_doc = LIDocument(
        text=document.content,
        metadata={"title": document.title, "django_id": str(document.id)},
    )
    vector_store = get_vector_store()
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    index = VectorStoreIndex.from_documents([li_doc], storage_context=storage_context)
    # LlamaIndex splits into chunks; count is approximate
    return 1


@api_view(["GET", "POST"])
def documents(request):
    if request.method == "GET":
        docs = Document.objects.all()
        return Response(DocumentSerializer(docs, many=True).data)

    serializer = DocumentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    document = serializer.save()

    try:
        chunk_count = _ingest_document(document)
        document.indexed_at = timezone.now()
        document.chunk_count = chunk_count
        document.save(update_fields=["indexed_at", "chunk_count"])
    except Exception as exc:
        document.delete()
        return Response(
            {"error": f"Indexing failed: {exc}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(DocumentSerializer(document).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def query(request):
    """
    LangGraph pipeline stays at the core.
    Django is only the HTTP layer — run_query() drives retrieve + generate.
    """
    serializer = QuerySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    from src.graph import run_query  # LangGraph pipeline

    try:
        answer = run_query(serializer.validated_data["query"])
    except Exception as exc:
        return Response(
            {"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response({"query": serializer.validated_data["query"], "answer": answer})
