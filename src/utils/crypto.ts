import CryptoLib from "../lib/crypto"
const Crypto = new CryptoLib()


export const setLib = (lib: any) => {
  Crypto.lib = lib
}


export const encrypt = async (body: string, pwd: string) => {
  return Crypto.encrypt(body, pwd)
};

export const decrypt = async (body: string, pwd: string) => {
  return Crypto.decrypt(body, pwd)
};

export const sha256 = async function (text: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text)
  const hash = await Crypto.lib.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const getHash = async (text: string) => { return (await sha256(text)).slice(0, 32) }
