from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=lambda value: "".join(
        [value.split("_")[0], *[part.title() for part in value.split("_")[1:]]]
    ), populate_by_name=True, extra="forbid")


class SchoolSummary(ApiModel):
    office_code: str
    school_code: str
    name: str
    school_type: str | None
    region: str | None
    address: str | None


class SchoolSearchResponse(ApiModel):
    items: list[SchoolSummary]
    has_more: bool


class SelectedSchool(ApiModel):
    office_code: str
    school_code: str
    name: str


class MealItem(ApiModel):
    date: date
    meal_type: Literal["중식"] = "중식"
    dishes: list[str]
    calories: str | None


class MealSearchResponse(ApiModel):
    school: SelectedSchool
    from_: date
    to: date
    items: list[MealItem]

    model_config = ConfigDict(
        alias_generator=lambda value: "from" if value == "from_" else "".join(
            [value.split("_")[0], *[part.title() for part in value.split("_")[1:]]]
        ),
        populate_by_name=True,
        extra="forbid",
    )


class HealthResponse(ApiModel):
    status: Literal["ok"] = "ok"


class ProblemDetail(ApiModel):
    type: str
    title: str
    status: int
    detail: str
    code: str
    instance: str | None
