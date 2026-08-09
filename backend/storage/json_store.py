import json
import threading
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class StorageProvider(ABC):
    backend_name: str

    @abstractmethod
    def health_check(self) -> bool:
        print("health check route for db.")


class JsonCollectionStore(Generic[T]):
    def __init__(self, path: Path, model: type[T]):
        '''
        Initialize the JSON collection store
        '''
        self.path = path
        self.model = model
        self._lock = threading.Lock()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self._write_all([])

    def _read_all(self) -> list[dict]:
        '''
        Read all items from the JSON file
        '''
        with self._lock:
            if not self.path.exists():
                return []
            text = self.path.read_text(encoding="utf-8").strip()
            if not text:
                return []
            return json.loads(text)

    def _write_all(self, items: list[dict]) -> None:
        '''
        Write all items to the JSON file
        '''
        with self._lock:
            tmp = self.path.with_suffix(".tmp")
            tmp.write_text(json.dumps(items, indent=2, default=str), encoding="utf-8")
            tmp.replace(self.path)

    def list_all(self) -> list[T]:
        '''
        List all items
        '''
        return [self.model.model_validate(item) for item in self._read_all()]

    def get_by_id(self, item_id: str) -> T | None:
        '''
        Get an item by ID
        '''
        for item in self.list_all():
            if item.id == item_id:
                return item
        return None

    def create(self, item: T) -> T:
        '''
        Create an item
        '''
        items = self._read_all()
        items.append(json.loads(item.model_dump_json()))
        self._write_all(items)
        return item

    def update(self, item: T) -> T:
        '''
        Update an item
        '''
        items = self._read_all()
        updated = []
        found = False
        for raw in items:
            if raw.get("id") == item.id:
                updated.append(json.loads(item.model_dump_json()))
                found = True
            else:
                updated.append(raw)
        if not found:
            updated.append(json.loads(item.model_dump_json()))
        self._write_all(updated)
        return item

    def delete(self, item_id: str) -> bool:
        '''
        Delete an item
        '''
        items = self._read_all()
        new_items = [i for i in items if i.get("id") != item_id]
        if len(new_items) == len(items):
            return False
        self._write_all(new_items)
        return True

    def find_one(self, predicate) -> T | None:
        '''
        Find one item
        '''
        for item in self.list_all():
            if predicate(item):
                return item
        return None

    def find_many(self, predicate) -> list[T]:
        '''
        Find many items
        '''
        return [item for item in self.list_all() if predicate(item)]
