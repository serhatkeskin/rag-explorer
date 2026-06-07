import os
import tempfile
from datetime import timedelta

from django.conf import settings
from django.db import connection
from django.http import JsonResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from .models import Document, DemoToken
from .serializers import DocumentSerializer, QuerySerializer


def _require_admin(request):
    key = request.headers.get("X-Admin-Key", "")
    if key != settings.ADMIN_KEY:
        return JsonResponse({"error": "Forbidden"}, status=403)
    return None


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


@api_view(["GET", "POST"])
def admin_tokens(request):
    err = _require_admin(request)
    if err:
        return err

    if request.method == "GET":
        tokens = DemoToken.objects.all()
        data = [
            {
                "id": t.id,
                "token": str(t.token),
                "label": t.label,
                "expires_at": t.expires_at.isoformat(),
                "is_active": t.is_active,
                "created_at": t.created_at.isoformat(),
            }
            for t in tokens
        ]
        return Response(data)

    label = request.data.get("label", "").strip()
    days = request.data.get("days")
    if not label:
        return Response({"error": "label required"}, status=400)
    try:
        days = int(days)
        if days < 1:
            raise ValueError
    except (TypeError, ValueError):
        return Response({"error": "days must be a positive integer"}, status=400)

    tok = DemoToken.objects.create(
        label=label,
        expires_at=timezone.now() + timedelta(days=days),
    )
    return Response(
        {
            "id": tok.id,
            "token": str(tok.token),
            "label": tok.label,
            "expires_at": tok.expires_at.isoformat(),
            "is_active": tok.is_active,
            "created_at": tok.created_at.isoformat(),
        },
        status=201,
    )


@api_view(["DELETE"])
def admin_token_deactivate(request, pk):
    err = _require_admin(request)
    if err:
        return err

    try:
        tok = DemoToken.objects.get(pk=pk)
    except DemoToken.DoesNotExist:
        return Response({"error": "Not found"}, status=404)

    tok.is_active = False
    tok.save(update_fields=["is_active"])
    return Response({"id": tok.id, "is_active": False})


def _extract_text(file) -> str:
    """Extract plain text from an uploaded file (txt or pdf)."""
    name = getattr(file, "name", "")
    if name.lower().endswith(".pdf"):
        from pypdf import PdfReader
        suffix = ".pdf"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            for chunk in file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name
        try:
            reader = PdfReader(tmp_path)
            return "\n\n".join(
                page.extract_text() or "" for page in reader.pages
            ).strip()
        finally:
            os.unlink(tmp_path)
    else:
        return file.read().decode("utf-8", errors="replace")


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
    VectorStoreIndex.from_documents([li_doc], storage_context=storage_context)
    return 1


@api_view(["GET", "POST"])
def documents(request):
    if request.method == "GET":
        from django.db.models import Q
        token = getattr(request, "demo_token", None)
        docs = Document.objects.filter(
            Q(demo_token__isnull=True) | Q(demo_token=token)
        )
        return Response(DocumentSerializer(docs, many=True).data)

    serializer = DocumentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    document = serializer.save(demo_token=getattr(request, "demo_token", None))
    try:
        _ingest_document(document)
        document.indexed_at = timezone.now()
        document.chunk_count = 1
        document.save(update_fields=["indexed_at", "chunk_count"])
    except Exception as exc:
        document.delete()
        return Response(
            {"error": f"Indexing failed: {exc}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(DocumentSerializer(document).data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def upload_document(request):
    file = request.FILES.get("file")
    if not file:
        return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

    allowed = (".txt", ".pdf", ".md")
    if not any(file.name.lower().endswith(ext) for ext in allowed):
        return Response(
            {"error": f"Unsupported file type. Allowed: {', '.join(allowed)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    title = request.data.get("title", "") or os.path.splitext(file.name)[0]

    try:
        content = _extract_text(file)
    except Exception as exc:
        return Response(
            {"error": f"Text extraction failed: {exc}"},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    if not content.strip():
        return Response({"error": "File has no extractable text."}, status=status.HTTP_400_BAD_REQUEST)

    document = Document.objects.create(
        title=title, content=content,
        demo_token=getattr(request, "demo_token", None)
    )
    try:
        _ingest_document(document)
        document.indexed_at = timezone.now()
        document.chunk_count = 1
        document.save(update_fields=["indexed_at", "chunk_count"])
    except Exception as exc:
        document.delete()
        return Response(
            {"error": f"Indexing failed: {exc}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(DocumentSerializer(document).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
def chunks(request):
    """Return all indexed chunks from the pgvector table."""
    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT id, text, metadata_ FROM data_rag_docs ORDER BY id LIMIT 500"
            )
            rows = cursor.fetchall()
    except Exception as exc:
        return Response(
            {"error": f"Could not query chunks: {exc}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    result = [
        {"id": row[0], "text": row[1], "metadata": row[2]}
        for row in rows
    ]
    return Response({"count": len(result), "chunks": result})


@api_view(["POST"])
def query(request):
    serializer = QuerySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    from src.graph import run_query

    try:
        result = run_query(serializer.validated_data["query"])
    except Exception as exc:
        return Response(
            {"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return Response({
        "query": serializer.validated_data["query"],
        "answer": result["answer"],
        "sources": result["sources"],
    })
# Sun Jun  7 23:55:43 +03 2026
