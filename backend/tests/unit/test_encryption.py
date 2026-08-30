import pytest
from app.infrastructure.encryption_service import AES256GCMEncryptionService

# 테스트용 고정 256비트(32바이트) Base64 키
TEST_KEY = "O7Tp5n+9BRlXVT79130iiUIT9VZUecbkCCXOEmvtMQg="

def test_encrypt_and_decrypt_success():
    """
    AES-256-GCM 암호화 및 복호화가 정상 수행되는지 검증합니다.
    - 암호화 결과는 'aes256gcm:' 접두사로 시작해야 함
    - 암호화된 텍스트에 평문이 포함되어 있지 않아야 함
    - 복호화 결과는 원문과 정확히 일치해야 함
    """
    service = AES256GCMEncryptionService(TEST_KEY)
    original_text = "와라! 오늘 날씨 참말로 억수로 쥑이네예~"

    encrypted = service.encrypt(original_text)
    assert encrypted.startswith("aes256gcm:")
    assert original_text not in encrypted

    decrypted = service.decrypt(encrypted)
    assert decrypted == original_text


def test_legacy_plaintext_fallback():
    """
    접두사가 없는 기존 레거시 평문 데이터는 복호화 시도시 원문 그대로 반환되는지(Graceful Fallback) 검증합니다.
    """
    service = AES256GCMEncryptionService(TEST_KEY)
    legacy_text = "기존에 저장되어 있던 과거 평문 메시지입니다."

    # 'aes256gcm:' 접두사가 없으므로 그대로 원문 반환
    result = service.decrypt(legacy_text)
    assert result == legacy_text


def test_tampered_ciphertext_fallback():
    """
    암호문이 변조되거나 잘못된 경우에도 시스템이 중단되지 않고 원본 또는 안전하게 처리되는지 검증합니다.
    """
    service = AES256GCMEncryptionService(TEST_KEY)
    tampered = "aes256gcm:invalid_corrupted_base64_payload"

    # 복호화 실패 시 변조된 내용을 그대로 반환하거나 안전 처리
    result = service.decrypt(tampered)
    assert result == tampered


def test_empty_and_none_handling():
    """
    None 또는 빈 문자열 입력 시의 안전한 처리를 검증합니다.
    """
    service = AES256GCMEncryptionService(TEST_KEY)
    assert service.encrypt("") == ""
    assert service.encrypt(None) is None
    assert service.decrypt("") == ""
    assert service.decrypt(None) is None
