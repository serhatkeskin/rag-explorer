from datetime import datetime, timezone

from django.core.management.base import BaseCommand

from api.models import DemoToken


class Command(BaseCommand):
    help = "List all demo API tokens."

    def handle(self, *args, **options):
        now = datetime.now(tz=timezone.utc)
        tokens = DemoToken.objects.all()

        if not tokens:
            self.stdout.write("No tokens found.")
            return

        for tok in tokens:
            expired = tok.expires_at < now
            status = "REVOKED" if not tok.is_active else ("EXPIRED" if expired else "ACTIVE")
            color = self.style.ERROR if status != "ACTIVE" else self.style.SUCCESS
            self.stdout.write(color(
                f"[{status}] {tok.label} | {tok.token} | expires {tok.expires_at.strftime('%Y-%m-%d')}"
            ))
