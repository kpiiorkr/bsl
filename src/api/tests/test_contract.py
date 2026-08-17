import json
from pathlib import Path

from openapi_spec_validator import validate
import schemathesis


def test_internal_and_external_openapi_documents_are_valid():
    root = Path(__file__).parents[2]
    for path in (root / "openapi.json", root.parent / "data" / "openapi.json"):
        document = json.loads(path.read_text(encoding="utf-8"))
        validate(document)
        assert document["openapi"] == "3.1.0"


def test_schemathesis_loads_the_internal_contract():
    contract = Path(__file__).parents[2] / "openapi.json"
    schema = schemathesis.openapi.from_path(contract)
    assert schema["/schools"]["GET"].definition.raw["operationId"] == "searchSchools"
