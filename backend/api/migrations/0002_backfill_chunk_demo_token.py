from django.db import migrations


# Backfill the `demo_token` tag onto every existing pgvector chunk so that
# retrieval/listing can be tenant-isolated. The vector table (data_rag_docs)
# is created by LlamaIndex, not Django, so this is guarded by to_regclass and
# written as raw SQL. Each chunk's django_id maps back to its Document; chunks
# without an owning token (seed corpus) get the shared "__default__" tag.
BACKFILL_SQL = r"""
DO $$
BEGIN
  IF to_regclass('public.data_rag_docs') IS NOT NULL THEN
    UPDATE data_rag_docs d
    SET metadata_ = jsonb_set(
        d.metadata_,
        '{demo_token}',
        to_jsonb(COALESCE(t.token::text, '__default__'))
    )
    FROM api_document doc
    LEFT JOIN api_demotoken t ON t.id = doc.demo_token_id
    WHERE d.metadata_ ->> 'django_id' ~ '^[0-9]+$'
      AND (d.metadata_ ->> 'django_id')::int = doc.id;

    -- Any chunk still untagged (e.g. orphaned/seed rows without a Document) is default.
    UPDATE data_rag_docs
    SET metadata_ = jsonb_set(metadata_, '{demo_token}', '"__default__"')
    WHERE metadata_ ->> 'demo_token' IS NULL;
  END IF;
END $$;
"""


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(BACKFILL_SQL, reverse_sql=migrations.RunSQL.noop),
    ]
