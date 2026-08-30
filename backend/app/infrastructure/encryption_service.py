import os
import base64
import hashlib
from typing import Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from app.application.interfaces import IEncryptionService

class AES256GCMEncryptionService(IEncryptionService):
    """
    AES-256-GCM 알고리즘을 사용한 256비트 대칭키 암호화 서비스
    - 무작위 12바이트 Nonce(IV) + 16바이트 인증 태그(Tag) 결합
    - 접두사 'aes256gcm:'를 통한 암호화 데이터 식별 및 기존 레거시 평문 하위 호환(Graceful Fallback) 지원
    """
    PREFIX = "aes256gcm:"

    def __init__(self, key: str):
        # 1. Base64로 인코딩된 키 또는 일반 문자열 키로부터 32바이트(256비트) 키 도출
        raw_key = None
        try:
            decoded = base64.b64decode(key)
            if len(decoded) == 32:
                raw_key = decoded
        except Exception:
            pass

        if not raw_key:
            if isinstance(key, str):
                # 키 길이가 32바이트가 아닌 경우 SHA-256 해시를 통해 표준 32바이트 키 파생
                raw_key = hashlib.sha256(key.encode('utf-8')).digest()
            elif isinstance(key, bytes) and len(key) == 32:
                raw_key = key
            else:
                raw_key = hashlib.sha256(str(key).encode('utf-8')).digest()

        self.aesgcm = AESGCM(raw_key)

    def encrypt(self, plaintext: Optional[str]) -> Optional[str]:
        """
        평문 텍스트를 AES-256-GCM으로 암호화하여 'aes256gcm:<base64>' 포맷으로 반환합니다.
        """
        if not plaintext:
            return plaintext
        
        # 12바이트 랜덤 Nonce 생성
        nonce = os.urandom(12)
        ciphertext_bytes = self.aesgcm.encrypt(nonce, plaintext.encode('utf-8'), None)
        
        # nonce(12바이트) + ciphertext + tag(16바이트) 결합 후 base64 인코딩
        combined = nonce + ciphertext_bytes
        b64_encoded = base64.b64encode(combined).decode('utf-8')
        return f"{self.PREFIX}{b64_encoded}"

    def decrypt(self, ciphertext: Optional[str]) -> Optional[str]:
        """
        암호화된 문자열을 복호화합니다.
        'aes256gcm:' 접두사가 없는 기존 레거시 평문 데이터는 그대로 반환(Graceful Fallback)합니다.
        """
        if not ciphertext:
            return ciphertext
        
        # 접두사가 없으면 기존 평문 데이터로 간주하여 원본 반환
        if not str(ciphertext).startswith(self.PREFIX):
            return ciphertext
        
        b64_payload = ciphertext[len(self.PREFIX):]
        try:
            payload = base64.b64decode(b64_payload)
            if len(payload) < 12:
                return ciphertext
            
            nonce = payload[:12]
            enc_data = payload[12:]
            decrypted_bytes = self.aesgcm.decrypt(nonce, enc_data, None)
            return decrypted_bytes.decode('utf-8')
        except Exception:
            # 복호화 실패 시(변조되었거나 키 불일치) 예외로 시스템이 중단되지 않도록 원본 반환
            return ciphertext
