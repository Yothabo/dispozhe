use wasm_bindgen::prelude::*;
use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Nonce
};
use rand::RngCore;
use base64::prelude::*;

#[wasm_bindgen]
pub struct EncryptionSession {
    key: [u8; 32],
}

#[wasm_bindgen]
impl EncryptionSession {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let mut key = [0u8; 32];
        rand::thread_rng().fill_bytes(&mut key);
        Self { key }
    }

    pub fn encrypt(&self, message: &str) -> String {
        let cipher = Aes256Gcm::new_from_slice(&self.key).unwrap();
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
        
        let ciphertext = cipher.encrypt(&nonce, message.as_bytes())
            .expect("encryption failure");
        
        let mut result = nonce.to_vec();
        result.extend_from_slice(&ciphertext);
        
        BASE64_STANDARD.encode(&result)
    }

    pub fn decrypt(&self, encrypted: &str) -> Result<String, JsValue> {
        let data = BASE64_STANDARD.decode(encrypted)
            .map_err(|_| "Invalid base64")?;
        
        if data.len() < 12 {
            return Err("Invalid data".into());
        }
        
        let (nonce_bytes, ciphertext) = data.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);
        
        let cipher = Aes256Gcm::new_from_slice(&self.key)
            .map_err(|_| "Invalid key")?;
        
        let plaintext = cipher.decrypt(nonce, ciphertext)
            .map_err(|_| "Decryption failed")?;
        
        String::from_utf8(plaintext)
            .map_err(|_| "Invalid UTF-8".into())
    }

    pub fn get_key_b64(&self) -> String {
        BASE64_STANDARD.encode(&self.key)
    }

    pub fn get_key_id(&self) -> String {
        let key_b64 = BASE64_STANDARD.encode(&self.key);
        key_b64[0..8].to_string()
    }

    pub fn from_key_b64(key_b64: &str) -> Result<EncryptionSession, JsValue> {
        let key = BASE64_STANDARD.decode(key_b64)
            .map_err(|_| "Invalid key")?;
        
        if key.len() != 32 {
            return Err("Invalid key length".into());
        }
        
        let mut key_array = [0u8; 32];
        key_array.copy_from_slice(&key);
        
        Ok(Self { key: key_array })
    }
}

#[wasm_bindgen]
pub fn generate_key_pair() -> String {
    let mut key = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut key);
    BASE64_STANDARD.encode(&key)
}

#[wasm_bindgen]
pub fn version() -> String {
    "1.0.0".to_string()
}
