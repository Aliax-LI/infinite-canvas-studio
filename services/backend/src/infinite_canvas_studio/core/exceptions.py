class DomainError(Exception):
    """Base for all expected domain errors that map to a ProblemDetail response."""
    status_code: int = 422

    def __init__(self, code: str, message: str, retryable: bool = False) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.retryable = retryable


class NotFoundError(DomainError):
    """Requested resource does not exist or has been deleted."""
    status_code = 404

    def __init__(self, message: str, code: str = "not_found") -> None:
        super().__init__(code=code, message=message, retryable=False)


class ValidationError(DomainError):
    """Input failed domain validation rules."""
    status_code = 422

    def __init__(self, message: str, code: str = "validation_failed") -> None:
        super().__init__(code=code, message=message, retryable=False)


class ConflictError(DomainError):
    """Operation conflicts with current state."""
    status_code = 409

    def __init__(self, message: str, code: str = "conflict") -> None:
        super().__init__(code=code, message=message, retryable=False)


class LibraryUnavailableError(DomainError):
    """Library root is not configured or not reachable."""
    status_code = 503

    def __init__(self, message: str = "Library is not configured.") -> None:
        super().__init__(code="library_unavailable", message=message, retryable=True)
