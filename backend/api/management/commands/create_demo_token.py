from datetime import datetime, timedelta, timezone

from django.core.management.base import BaseCommand, CommandError

from api.models import DemoToken


class Command(BaseCommand):
    help = "Create a demo API token with an expiry date."

    def add_arguments(self, parser):
        parser.add_argument("--label", required=True, help="Human-readable label for this token")
        parser.add_argument("--days", type=int, default=30, help="Days until expiry (default: 30)")

    def handle(self, *args, **options):
        label = options["label"]
        days = options["days"]
        expires_at = datetime.now(tz=timezone.utc) + timedelta(days=days)

        tok = DemoToken.objects.create(label=label, expires_at=expires_at)

        self.stdout.write(self.style.SUCCESS(
            f"\nToken created:\n"
            f"  UUID:    {tok.token}\n"
            f"  Label:   {tok.label}\n"
            f"  Expires: {tok.expires_at.strftime('%Y-%m-%d %H:%M UTC')} ({days} days)\n"
        ))
