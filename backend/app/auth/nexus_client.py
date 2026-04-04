import httpx

from app.config import get_settings


class NexusError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


def _detail_from_body(data: object) -> str:
    """Normalize FastAPI / Nexus error JSON to a single string."""
    if data is None:
        return "Unknown error"
    if isinstance(data, str):
        return data
    if isinstance(data, dict):
        raw = data.get("detail")
        if isinstance(raw, str):
            return raw
        if isinstance(raw, list):
            parts: list[str] = []
            for item in raw:
                if isinstance(item, dict) and "msg" in item:
                    parts.append(str(item["msg"]))
                else:
                    parts.append(str(item))
            return "; ".join(parts) if parts else str(data)
        if raw is not None:
            return str(raw)
        return str(data)
    return str(data)


class NexusClient:
    def __init__(self):
        s = get_settings()
        self.base_url = s.nexus_url.rstrip("/")
        self.api_key = s.nexus_api_key

    def _headers(self) -> dict:
        return {
            "Content-Type": "application/json",
            "X-API-Key": self.api_key,
        }

    async def _request(self, method: str, path: str, **kwargs) -> dict | None:
        url = f"{self.base_url}/api/app-auth{path}"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.request(method, url, headers=self._headers(), **kwargs)
        except httpx.RequestError as e:
            raise NexusError(
                0,
                f"Cannot reach identity service at {self.base_url}: {e!s}",
            ) from e

        if resp.status_code == 204:
            return None

        try:
            data = resp.json()
        except Exception:
            snippet = (resp.text or "")[:500] or f"HTTP {resp.status_code}"
            if not resp.is_success:
                raise NexusError(resp.status_code, snippet)
            raise NexusError(resp.status_code, f"Invalid JSON from Nexus: {snippet}")

        if not resp.is_success:
            raise NexusError(resp.status_code, _detail_from_body(data))
        return data

    async def register(self, username: str, password: str) -> dict:
        return await self._request("POST", "/register", json={"username": username, "password": password})

    async def login(self, username: str, password: str) -> dict:
        return await self._request("POST", "/login", json={"username": username, "password": password})

    async def validate_session(self, session_token: str) -> dict | None:
        try:
            return await self._request("POST", "/validate", json={"session_token": session_token})
        except NexusError:
            return None

    async def logout(self, session_token: str) -> None:
        try:
            await self._request("POST", "/logout", json={"session_token": session_token})
        except NexusError:
            pass

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(f"{self.base_url}/api/health")
                return resp.status_code == 200
        except Exception:
            return False


def get_nexus_client() -> NexusClient:
    return NexusClient()
