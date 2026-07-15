from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class LibraryLayout:
    root: Path

    @property
    def database_path(self) -> Path:
        return self.root / "database" / "studio.sqlite3"

    def create_directories(self) -> None:
        for directory in (
            self.root,
            self.database_path.parent,
            self.root / "managed",
            self.root / "imports",
            self.root / "cache",
            self.root / "recovery",
        ):
            directory.mkdir(parents=True, exist_ok=True)


def resolve_library_layout(value: str | Path) -> LibraryLayout:
    root = Path(value).expanduser()
    if not root.is_absolute():
        raise ValueError("资料库路径必须为绝对路径。")
    return LibraryLayout(root=root.resolve())
