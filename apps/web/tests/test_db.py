"""
Explicit tests for plan §1 + §6 ACs:
  - query engine works (insert + select roundtrip)
  - DB is clean between tests (insert in test A not visible in test B)
"""

from sqlalchemy import select, func

from web.auth.model import User


async def test_insert_select_roundtrip(db_session) -> None:
    user = User(email="roundtrip@example.com", name="Round Trip", google_id="g-rt-1")
    db_session.add(user)
    await db_session.commit()

    result = await db_session.execute(
        select(User).where(User.email == "roundtrip@example.com")
    )
    fetched = result.scalar_one()

    assert fetched.id is not None
    assert fetched.email == "roundtrip@example.com"
    assert fetched.name == "Round Trip"


async def test_db_starts_empty(db_session) -> None:
    """Each test begins with an empty DB — verifies isolation from other tests."""
    result = await db_session.execute(select(func.count()).select_from(User))
    count = result.scalar_one()
    assert count == 0
