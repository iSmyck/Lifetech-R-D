class ApiError(Exception):
    def __init__(self, status_code: int, message: str, is_operational: bool = True) -> None:
        self.status_code = status_code
        self.message = message
        self.is_operational = is_operational
        super().__init__(message)


class LLMError(ApiError):
    def __init__(self, message: str = "LLM request failed") -> None:
        super().__init__(status_code=502, message=message)


class AuthError(ApiError):
    def __init__(self, message: str = "Authentication failed") -> None:
        super().__init__(status_code=401, message=message)


class ForbiddenError(ApiError):
    def __init__(self, message: str = "Access denied") -> None:
        super().__init__(status_code=403, message=message)
