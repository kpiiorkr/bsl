import html
import re
from collections.abc import Mapping
from typing import Any

import httpx

from .config import Settings
from .errors import ApiError

_BR = re.compile(r"<br\s*/?>|\r?\n", re.IGNORECASE)
_TAG = re.compile(r"<[^>]*>")


class NeisClient:
    def __init__(self, settings: Settings) -> None:
        timeout = httpx.Timeout(settings.http_timeout_seconds)
        self._key = settings.neis_api_key
        self._client = httpx.AsyncClient(
            base_url=settings.neis_base_url.rstrip("/"), timeout=timeout
        )

    async def __aenter__(self) -> "NeisClient":
        return self

    async def __aexit__(self, *args: object) -> None:
        await self._client.aclose()

    async def school_info(self, query: str) -> tuple[list[dict[str, Any]], int]:
        payload = await self._get(
            "schoolInfo",
            {"SCHUL_NM": query, "pIndex": 1, "pSize": 21},
        )
        rows, total = self._rows(payload, "schoolInfo")
        return rows, total

    async def meals(
        self, office_code: str, school_code: str, from_date: str, to_date: str
    ) -> list[dict[str, Any]]:
        payload = await self._get(
            "mealServiceDietInfo",
            {
                "ATPT_OFCDC_SC_CODE": office_code,
                "SD_SCHUL_CODE": school_code,
                "MLSV_FROM_YMD": from_date,
                "MLSV_TO_YMD": to_date,
                "MMEAL_SC_CODE": "2",
                "pIndex": 1,
                "pSize": 1000,
            },
        )
        return self._rows(payload, "mealServiceDietInfo")[0]

    async def _get(self, endpoint: str, params: dict[str, object]) -> Mapping[str, Any]:
        params.update({"KEY": self._key, "Type": "json"})
        try:
            response = await self._client.get(f"/hub/{endpoint}", params=params)
            response.raise_for_status()
            payload = response.json()
        except httpx.TimeoutException as exc:
            raise ApiError(
                504, "UPSTREAM_TIMEOUT", "외부 서비스 시간 초과",
                "NEIS 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.",
            ) from exc
        except (httpx.HTTPError, ValueError) as exc:
            raise ApiError(
                502, "UPSTREAM_ERROR", "외부 서비스 오류",
                "NEIS 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
            ) from exc
        if not isinstance(payload, Mapping):
            raise self._format_error()
        return payload

    def _rows(
        self, payload: Mapping[str, Any], section: str
    ) -> tuple[list[dict[str, Any]], int]:
        direct = payload.get("RESULT")
        if isinstance(direct, Mapping):
            if direct.get("CODE") == "INFO-200":
                return [], 0
            self._validate_result(direct)
            raise self._format_error()
        blocks = payload.get(section)
        if not isinstance(blocks, list):
            raise self._format_error()
        result: Mapping[str, Any] | None = None
        total = 0
        rows: list[dict[str, Any]] = []
        for block in blocks:
            if not isinstance(block, Mapping):
                raise self._format_error()
            head = block.get("head")
            if isinstance(head, list):
                for item in head:
                    if isinstance(item, Mapping) and isinstance(item.get("RESULT"), Mapping):
                        result = item["RESULT"]
                    if isinstance(item, Mapping) and "list_total_count" in item:
                        try:
                            total = int(item["list_total_count"])
                        except (TypeError, ValueError) as exc:
                            raise self._format_error() from exc
            row = block.get("row")
            if isinstance(row, list) and all(isinstance(item, dict) for item in row):
                rows.extend(row)
        if result is None:
            raise self._format_error()
        self._validate_result(result)
        return rows, total

    def _validate_result(self, result: Mapping[str, Any]) -> None:
        code = result.get("CODE")
        if code in {"INFO-000", "INFO-200"}:
            return
        raise ApiError(
            502, "UPSTREAM_ERROR", "외부 서비스 오류",
            "NEIS가 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        )

    @staticmethod
    def _format_error() -> ApiError:
        return ApiError(
            502, "UPSTREAM_ERROR", "외부 서비스 오류",
            "NEIS 응답 형식을 해석하지 못했습니다.",
        )


def split_dishes(value: str) -> list[str]:
    decoded = html.unescape(value)
    dishes: list[str] = []
    for part in _BR.split(decoded):
        clean = html.unescape(_TAG.sub("", part)).strip()
        if clean:
            dishes.append(clean)
    return dishes
