from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy.engine import URL


def upgrade_database(database_url: URL) -> None:
    migration_directory = Path(__file__).parent
    config = Config()
    config.set_main_option("script_location", str(migration_directory))
    config.set_main_option("sqlalchemy.url", database_url.render_as_string(hide_password=False))
    command.upgrade(config, "head")
