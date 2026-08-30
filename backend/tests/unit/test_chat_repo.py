import pytest
from unittest.mock import MagicMock
from app.infrastructure.supabase_repo import SupabaseChatRepository

@pytest.mark.asyncio
async def test_supabase_chat_repo_delete_chat():
    """
    대화방 삭제 시 연관된 messages 테이블의 레코드를 먼저 삭제하고,
    이후 chats 테이블의 해당 대화방 레코드를 삭제하는지 검증합니다.
    """
    mock_supabase = MagicMock()
    
    # messages table mock
    mock_messages_table = MagicMock()
    mock_messages_delete = MagicMock()
    mock_messages_eq = MagicMock()
    mock_messages_table.delete.return_value = mock_messages_delete
    mock_messages_delete.eq.return_value = mock_messages_eq
    mock_messages_eq.execute.return_value = MagicMock(data=[{"id": 1, "chat_id": 10}])

    # chats table mock
    mock_chats_table = MagicMock()
    mock_chats_delete = MagicMock()
    mock_chats_eq = MagicMock()
    mock_chats_table.delete.return_value = mock_chats_delete
    mock_chats_delete.eq.return_value = mock_chats_eq
    mock_chats_eq.execute.return_value = MagicMock(data=[{"id": 10, "title": "삭제할 대화방"}])

    def table_side_effect(table_name):
        if table_name == "messages":
            return mock_messages_table
        elif table_name == "chats":
            return mock_chats_table
        return MagicMock()

    mock_supabase.table.side_effect = table_side_effect

    repo = SupabaseChatRepository(mock_supabase)
    result = await repo.delete_chat(10)

    # 검증: messages 삭제 호출 확인
    mock_supabase.table.assert_any_call("messages")
    mock_messages_table.delete.assert_called_once()
    mock_messages_delete.eq.assert_called_once_with("chat_id", 10)

    # 검증: chats 삭제 호출 확인
    mock_supabase.table.assert_any_call("chats")
    mock_chats_table.delete.assert_called_once()
    mock_chats_delete.eq.assert_called_once_with("id", 10)

    assert result is True


@pytest.mark.asyncio
async def test_get_all_chats_unauthenticated():
    """
    로그인하지 않은 상태(user_id가 None 또는 empty)에서는
    DB의 다른 사용자 대화가 노출되지 않도록 빈 리스트를 즉시 반환하는지 검증합니다.
    """
    mock_supabase = MagicMock()
    repo = SupabaseChatRepository(mock_supabase)

    result_none = await repo.get_all_chats(user_id=None)
    assert result_none == []
    mock_supabase.table.assert_not_called()

    result_empty = await repo.get_all_chats(user_id="")
    assert result_empty == []
    mock_supabase.table.assert_not_called()


@pytest.mark.asyncio
async def test_get_all_chats_by_user_id():
    """
    특정 user_id로 대화 목록을 요청했을 때,
    해당 사용자의 user_id로 정확히 필터링(.eq('user_id', user_id))하여 가져오는지 검증합니다.
    """
    mock_supabase = MagicMock()
    mock_chats_table = MagicMock()
    mock_select = MagicMock()
    mock_eq = MagicMock()
    mock_order = MagicMock()

    mock_supabase.table.return_value = mock_chats_table
    mock_chats_table.select.return_value = mock_select
    mock_select.eq.return_value = mock_eq
    mock_eq.order.return_value = mock_order
    mock_order.execute.return_value = MagicMock(data=[
        {"id": 1, "title": "내 대화방 1", "user_id": "user_123"},
        {"id": 2, "title": "내 대화방 2", "user_id": "user_123"}
    ])

    repo = SupabaseChatRepository(mock_supabase)
    result = await repo.get_all_chats(user_id="user_123")

    mock_supabase.table.assert_called_with("chats")
    mock_chats_table.select.assert_called_with("*")
    mock_select.eq.assert_called_with("user_id", "user_123")
    mock_eq.order.assert_called_with("created_at", desc=True)
    assert len(result) == 2
    assert result[0]["user_id"] == "user_123"


@pytest.mark.asyncio
async def test_create_chat_with_user_id():
    """
    대화방을 새로 생성할 때 user_id가 전달되면
    chats 테이블 insert payload에 user_id가 정상적으로 포함되는지 검증합니다.
    """
    mock_supabase = MagicMock()
    mock_chats_table = MagicMock()
    mock_insert = MagicMock()

    mock_supabase.table.return_value = mock_chats_table
    mock_chats_table.insert.return_value = mock_insert
    mock_insert.execute.return_value = MagicMock(data=[
        {"id": 100, "title": "새 대화방", "user_id": "user_abc"}
    ])

    repo = SupabaseChatRepository(mock_supabase)
    result = await repo.create_chat(title="새 대화방", user_id="user_abc")

    mock_supabase.table.assert_called_with("chats")
    mock_chats_table.insert.assert_called_with({"title": "새 대화방", "user_id": "user_abc"})
    assert result["id"] == 100
    assert result["user_id"] == "user_abc"


@pytest.mark.asyncio
async def test_supabase_message_repo_encryption():
    """
    메시지 저장 시 본문(content)이 암호화되어 DB에 insert되고,
    메시지 조회 시 암호화된 본문이 복호화되어 반환되는지 검증합니다.
    """
    from app.infrastructure.supabase_repo import SupabaseMessageRepository

    mock_supabase = MagicMock()
    mock_messages_table = MagicMock()
    mock_insert = MagicMock()
    mock_select = MagicMock()
    mock_eq = MagicMock()
    mock_order = MagicMock()

    mock_supabase.table.return_value = mock_messages_table
    mock_messages_table.insert.return_value = mock_insert
    mock_insert.execute.return_value = MagicMock(data=[
        {"id": 1, "chat_id": 10, "role": "user", "content": "aes256gcm:encrypted_hello", "region": "경상도"}
    ])

    mock_messages_table.select.return_value = mock_select
    mock_select.eq.return_value = mock_eq
    mock_eq.order.return_value = mock_order
    mock_order.execute.return_value = MagicMock(data=[
        {"id": 1, "chat_id": 10, "role": "user", "content": "aes256gcm:encrypted_hello", "region": "경상도"}
    ])

    mock_encryption = MagicMock()
    mock_encryption.encrypt.side_effect = lambda t: f"aes256gcm:encrypted_{t}" if t else t
    mock_encryption.decrypt.side_effect = lambda t: t.replace("aes256gcm:encrypted_", "") if t and t.startswith("aes256gcm:encrypted_") else t

    repo = SupabaseMessageRepository(mock_supabase, encryption_service=mock_encryption)

    # 1. 메시지 저장 검증
    saved = await repo.save_message(10, "user", "hello", "경상도")
    mock_messages_table.insert.assert_called_with({
        "chat_id": 10,
        "role": "user",
        "content": "aes256gcm:encrypted_hello",
        "region": "경상도"
    })
    assert saved["content"] == "hello"  # 반환값은 사용자 편의를 위해 복호화된 원문

    # 2. 메시지 목록 조회 검증
    messages = await repo.get_messages(10)
    assert len(messages) == 1
    assert messages[0]["content"] == "hello"


@pytest.mark.asyncio
async def test_create_chat_with_initial_messages():
    """
    비로그인 게스트 상태에서 나눈 기존 대화 내용(initial_messages)을
    로그인 후 대화방 생성 시 한 번에 저장(마이그레이션)하는지 검증합니다.
    """
    mock_supabase = MagicMock()
    mock_chats_table = MagicMock()
    mock_messages_table = MagicMock()
    mock_insert_chat = MagicMock()
    mock_insert_msg = MagicMock()

    def table_side_effect(name):
        if name == "chats":
            return mock_chats_table
        elif name == "messages":
            return mock_messages_table
        return MagicMock()

    mock_supabase.table.side_effect = table_side_effect
    mock_chats_table.insert.return_value = mock_insert_chat
    mock_insert_chat.execute.return_value = MagicMock(data=[
        {"id": 200, "title": "첫 질문", "user_id": "user_migrated"}
    ])

    mock_messages_table.insert.return_value = mock_insert_msg
    mock_insert_msg.execute.return_value = MagicMock(data=[
        {"id": 1, "chat_id": 200, "role": "user", "content": "첫 질문", "region": "경상도"},
        {"id": 2, "chat_id": 200, "role": "bot", "content": "첫 답변", "region": "경상도"}
    ])

    mock_encryption = MagicMock()
    mock_encryption.encrypt.side_effect = lambda t: f"aes256gcm:{t}" if t else t
    mock_encryption.decrypt.side_effect = lambda t: t

    repo = SupabaseChatRepository(mock_supabase, encryption_service=mock_encryption)

    initial_msgs = [
        {"role": "user", "content": "첫 질문", "region": "경상도"},
        {"role": "bot", "content": "첫 답변", "region": "경상도"}
    ]

    result = await repo.create_chat(
        title="첫 질문",
        user_id="user_migrated",
        initial_messages=initial_msgs
    )

    assert result["id"] == 200
    mock_supabase.table.assert_any_call("chats")
    mock_supabase.table.assert_any_call("messages")
    mock_messages_table.insert.assert_called_once()



