from config import get_settings
from storage.json_store import StorageProvider
from storage.postgres import JsonStorage, PostgresStorage
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
                print("Using PostgreSQL storage backend")
                _storage_provider = provider
                return provider
        except Exception as exc:
            print("Database unavailable, falling back to JSON: ", exc)

    print("Using JSON file storage backend because no db conn")
    _storage_provider = JsonStorage(settings.data_dir)
    return _storage_provider


def reset_storage_provider() : # Not using but will expand the code later
    '''
    Reset the storage provider
    '''
    global _storage_provider
    _storage_provider = None
