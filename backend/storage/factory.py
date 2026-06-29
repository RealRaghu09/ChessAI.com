import logging

from config import get_settings
from storage.json_store import StorageProvider
from storage.postgres import JsonStorage, PostgresStorage

logger = logging.getLogger(__name__)

_storage_provider: StorageProvider | None = None


def get_storage_provider() -> StorageProvider:
    '''
    Get the storage provider
    '''
    global _storage_provider
    if _storage_provider is not None:
        return _storage_provider

    settings = get_settings()
    if settings.database_url:
        try:
            provider = PostgresStorage(settings.database_url)
            if provider.health_check():
                logger.info("Using PostgreSQL storage backend")
                _storage_provider = provider
                return provider
        except Exception as exc:
            logger.warning("Database unavailable, falling back to JSON: %s", exc)

    logger.info("Using JSON file storage backend")
    _storage_provider = JsonStorage(settings.data_dir)
    return _storage_provider


def reset_storage_provider() : # Not using but will expand the code later
    '''
    Reset the storage provider
    '''
    global _storage_provider
    _storage_provider = None
