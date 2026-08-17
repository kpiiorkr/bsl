import httpx
import respx


def envelope(section: str, rows: list[dict], total: int | None = None) -> dict:
    return {
        section: [
            {
                "head": [
                    {"list_total_count": len(rows) if total is None else total},
                    {"RESULT": {"CODE": "INFO-000", "MESSAGE": "정상 처리되었습니다."}},
                ]
            },
            {"row": rows},
        ]
    }


@respx.mock
async def test_school_search_normalizes_response_and_has_more(api_client):
    route = respx.get("https://neis.test/hub/schoolInfo").mock(
        return_value=httpx.Response(
            200,
            json=envelope(
                "schoolInfo",
                [{
                    "ATPT_OFCDC_SC_CODE": "B10",
                    "SD_SCHUL_CODE": "7010569",
                    "SCHUL_NM": "예시고등학교",
                    "SCHUL_KND_SC_NM": "고등학교",
                    "LCTN_SC_NM": "서울특별시",
                    "ORG_RDNMA": "서울시 도로",
                    "ORG_RDNDA": " 1 ",
                }],
                total=21,
            ),
        )
    )
    response = await api_client.get("/api/v1/schools", params={"query": " 예시 ", "limit": 20})

    assert response.status_code == 200
    assert response.json() == {
        "items": [{
            "officeCode": "B10",
            "schoolCode": "7010569",
            "name": "예시고등학교",
            "schoolType": "고등학교",
            "region": "서울특별시",
            "address": "서울시 도로 1",
        }],
        "hasMore": True,
    }
    assert route.calls[0].request.url.params["SCHUL_NM"] == "예시"
    assert route.calls[0].request.url.params["pSize"] == "21"


@respx.mock
async def test_meals_are_filtered_sorted_and_html_is_not_exposed(api_client):
    respx.get("https://neis.test/hub/mealServiceDietInfo").mock(
        return_value=httpx.Response(
            200,
            json=envelope("mealServiceDietInfo", [
                {
                    "SCHUL_NM": "예시고등학교",
                    "MLSV_YMD": "20260802",
                    "MMEAL_SC_NM": "중식",
                    "DDISH_NM": "밥<br/>국&lt;br&gt;<b>김치</b>",
                    "CAL_INFO": "650 Kcal",
                },
                {
                    "SCHUL_NM": "예시고등학교",
                    "MLSV_YMD": "20260801",
                    "MMEAL_SC_NM": "석식",
                    "DDISH_NM": "제외",
                },
            ]),
        )
    )
    response = await api_client.get(
        "/api/v1/meals",
        params={"officeCode": "B10", "schoolCode": "7010569", "from": "2026-08-01", "to": "2026-08-02"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["items"] == [{
        "date": "2026-08-02",
        "mealType": "중식",
        "dishes": ["밥", "국", "김치"],
        "calories": "650 Kcal",
    }]
    assert body["school"]["name"] == "예시고등학교"


@respx.mock
async def test_info_200_is_an_empty_success(api_client):
    respx.get("https://neis.test/hub/mealServiceDietInfo").mock(
        return_value=httpx.Response(
            200, json={"RESULT": {"CODE": "INFO-200", "MESSAGE": "해당하는 데이터가 없습니다."}}
        )
    )
    response = await api_client.get(
        "/api/v1/meals",
        params={"officeCode": "B10", "schoolCode": "7010569", "from": "2026-08-01", "to": "2026-08-01"},
    )
    assert response.status_code == 200
    assert response.json()["items"] == []


async def test_invalid_inputs_use_problem_details(api_client):
    response = await api_client.get("/api/v1/schools", params={"query": " 가 "})
    assert response.status_code == 422
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.json()["code"] == "INVALID_QUERY"
    assert response.json()["instance"] is not None

    response = await api_client.get(
        "/api/v1/meals",
        params={"officeCode": "B10", "schoolCode": "7010569", "from": "2026-08-01", "to": "2026-09-01"},
    )
    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_DATE_RANGE"


@respx.mock
async def test_upstream_timeout_is_504_not_empty(api_client):
    respx.get("https://neis.test/hub/schoolInfo").mock(side_effect=httpx.ReadTimeout("late"))
    response = await api_client.get("/api/v1/schools", params={"query": "예시"})
    assert response.status_code == 504
    assert response.json()["code"] == "UPSTREAM_TIMEOUT"


@respx.mock
async def test_unknown_neis_result_is_502(api_client):
    respx.get("https://neis.test/hub/schoolInfo").mock(
        return_value=httpx.Response(200, json={"RESULT": {"CODE": "ERROR-500", "MESSAGE": "오류"}})
    )
    response = await api_client.get("/api/v1/schools", params={"query": "예시"})
    assert response.status_code == 502
    assert response.json()["code"] == "UPSTREAM_ERROR"


async def test_health_does_not_call_neis(api_client):
    response = await api_client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
