import CryptoJS from "crypto-js";

const PBKDF2_ITERATIONS = 100000;
const KEY_SIZE_BITS = 256;

function deriveKey(masterPassword, salt) {
  return CryptoJS.PBKDF2(masterPassword, salt, {
    keySize: KEY_SIZE_BITS / 32,
    iterations: PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  });
}

export function encrypt(plaintext, masterPassword) {
  const salt = CryptoJS.lib.WordArray.random(16);
  const iv = CryptoJS.lib.WordArray.random(16);
  const key = deriveKey(masterPassword, salt);

  const encrypted = CryptoJS.AES.encrypt(plaintext, key, { iv });

  return {
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: iv.toString(CryptoJS.enc.Base64),
    salt: salt.toString(CryptoJS.enc.Base64),
  };
}

export function decrypt(ciphertext, iv, salt, masterPassword) {
  const saltWords = CryptoJS.enc.Base64.parse(salt);
  const ivWords = CryptoJS.enc.Base64.parse(iv);
  const key = deriveKey(masterPassword, saltWords);

  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Base64.parse(ciphertext),
  });

  const decrypted = CryptoJS.AES.decrypt(cipherParams, key, { iv: ivWords });
  return decrypted.toString(CryptoJS.enc.UTF8);
}
