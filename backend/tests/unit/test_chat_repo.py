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
