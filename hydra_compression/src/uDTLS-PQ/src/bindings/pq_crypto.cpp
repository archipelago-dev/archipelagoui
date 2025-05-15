// src/bindings/pq_crypto.cpp
#include "pq_crypto.h"
#include <oqs/oqs.h>
#include <openssl/pem.h>
#include <openssl/x509.h>
#include <openssl/x509v3.h>
#include <stdexcept>
#include <vector>
#include <map>
#include <node_api.h>
#include <openssl/evp.h>
#include <openssl/rsa.h>
#include <openssl/pem.h>
#include <openssl/bn.h>
#include <string>
#include <sstream>
#include <iomanip>

// --- string ↔ enum conversion ---
PQAlgorithmType string_to_pq_algorithm(const std::string& algo) {
  if (algo=="kyber512")     return PQAlgorithmType::KYBER512;
  if (algo=="kyber768")     return PQAlgorithmType::KYBER768;
  if (algo=="kyber1024")    return PQAlgorithmType::KYBER1024;
  if (algo=="dilithium2")   return PQAlgorithmType::DILITHIUM2;
  if (algo=="dilithium3")   return PQAlgorithmType::DILITHIUM3;
  if (algo=="dilithium5")   return PQAlgorithmType::DILITHIUM5;
  return PQAlgorithmType::KYBER768;
}

static const char* get_kem_name(PQAlgorithmType a) {
  switch(a) {
    case PQAlgorithmType::KYBER512:  return OQS_KEM_alg_kyber_512;
    case PQAlgorithmType::KYBER768:  return OQS_KEM_alg_kyber_768;
    case PQAlgorithmType::KYBER1024: return OQS_KEM_alg_kyber_1024;
    default:                         return OQS_KEM_alg_kyber_768;
  }
}

// --- Keypair / encapsulation ---
napi_value GenerateKyberKeyPair(napi_env env, napi_callback_info info) {
  // parse [ algorithm? ]
  size_t argc=1; napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

  std::string algo = "kyber768";
  if (argc>=1) {
    char buf[32]; size_t len;
    napi_get_value_string_utf8(env, args[0], buf, sizeof(buf), &len);
    algo = std::string(buf, len);
  }
  PQAlgorithmType at = string_to_pq_algorithm(algo);
  const char* kem = get_kem_name(at);

  // init OQS
  OQS_init();
  OQS_KEM *k = OQS_KEM_new(kem);
  if (!k) throw std::runtime_error("OQS init failed");

  std::vector<uint8_t> pk(k->length_public_key), sk(k->length_secret_key);
  if (OQS_KEM_keypair(k, pk.data(), sk.data()) != OQS_SUCCESS) {
    OQS_KEM_free(k);
    throw std::runtime_error("keypair failed");
  }
  OQS_KEM_free(k);

  // return {publicKey, privateKey}
  napi_value out, buf1, buf2;
  napi_create_object(env, &out);
  napi_create_buffer_copy(env, pk.size(),  pk.data(),  nullptr, &buf1);
  napi_set_named_property(env, out, "publicKey", buf1);
  napi_create_buffer_copy(env, sk.size(),  sk.data(),  nullptr, &buf2);
  napi_set_named_property(env, out, "privateKey", buf2);
  return out;
}

napi_value KyberEncapsulate(napi_env env, napi_callback_info info) {
  // Parse arguments: [publicKey, algo?]
  size_t argc = 2;
  napi_value args[2];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  
  if (argc < 1) {
    napi_throw_error(env, nullptr, "Wrong number of arguments");
    return nullptr;
  }
  
  // Get public key buffer
  bool is_buffer;
  napi_is_buffer(env, args[0], &is_buffer);
  if (!is_buffer) {
    napi_throw_error(env, nullptr, "Public key must be a buffer");
    return nullptr;
  }
  
  void* pub_data;
  size_t pub_len;
  napi_get_buffer_info(env, args[0], &pub_data, &pub_len);
  
  // Get algorithm (optional)
  std::string algo = "kyber768";
  if (argc >= 2) {
    char buf[32];
    size_t len;
    napi_get_value_string_utf8(env, args[1], buf, sizeof(buf), &len);
    algo = std::string(buf, len);
  }
  
  // Get algorithm type and KEM name
  PQAlgorithmType at = string_to_pq_algorithm(algo);
  const char* kem = get_kem_name(at);
  
  // Initialize OQS
  OQS_init();
  OQS_KEM* k = OQS_KEM_new(kem);
  if (!k) {
    napi_throw_error(env, nullptr, "Failed to initialize OQS KEM");
    return nullptr;
  }
  
  // Encapsulate
  std::vector<uint8_t> ciphertext(k->length_ciphertext);
  std::vector<uint8_t> shared_secret(k->length_shared_secret);
  
  if (OQS_KEM_encaps(k, ciphertext.data(), shared_secret.data(), 
                     static_cast<uint8_t*>(pub_data)) != OQS_SUCCESS) {
    OQS_KEM_free(k);
    napi_throw_error(env, nullptr, "Encapsulation failed");
    return nullptr;
  }
  
  OQS_KEM_free(k);
  
  // Return { ciphertext, sharedSecret }
  napi_value result, ct_buf, ss_buf;
  napi_create_object(env, &result);
  napi_create_buffer_copy(env, ciphertext.size(), ciphertext.data(), nullptr, &ct_buf);
  napi_set_named_property(env, result, "ciphertext", ct_buf);
  napi_create_buffer_copy(env, shared_secret.size(), shared_secret.data(), nullptr, &ss_buf);
  napi_set_named_property(env, result, "sharedSecret", ss_buf);
  
  return result;
}

napi_value KyberDecapsulate(napi_env env, napi_callback_info info) {
  // Parse arguments: [privateKey, ciphertext, algo?]
  size_t argc = 3;
  napi_value args[3];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  
  if (argc < 2) {
    napi_throw_error(env, nullptr, "Wrong number of arguments");
    return nullptr;
  }
  
  // Get private key buffer
  bool is_buffer;
  napi_is_buffer(env, args[0], &is_buffer);
  if (!is_buffer) {
    napi_throw_error(env, nullptr, "Private key must be a buffer");
    return nullptr;
  }
  
  void* priv_data;
  size_t priv_len;
  napi_get_buffer_info(env, args[0], &priv_data, &priv_len);
  
  // Get ciphertext buffer
  napi_is_buffer(env, args[1], &is_buffer);
  if (!is_buffer) {
    napi_throw_error(env, nullptr, "Ciphertext must be a buffer");
    return nullptr;
  }
  
  void* ct_data;
  size_t ct_len;
  napi_get_buffer_info(env, args[1], &ct_data, &ct_len);
  
  // Get algorithm (optional)
  std::string algo = "kyber768";
  if (argc >= 3) {
    char buf[32];
    size_t len;
    napi_get_value_string_utf8(env, args[2], buf, sizeof(buf), &len);
    algo = std::string(buf, len);
  }
  
  // Get algorithm type and KEM name
  PQAlgorithmType at = string_to_pq_algorithm(algo);
  const char* kem = get_kem_name(at);
  
  // Initialize OQS
  OQS_init();
  OQS_KEM* k = OQS_KEM_new(kem);
  if (!k) {
    napi_throw_error(env, nullptr, "Failed to initialize OQS KEM");
    return nullptr;
  }
  
  // Decapsulate
  std::vector<uint8_t> shared_secret(k->length_shared_secret);
  if (OQS_KEM_decaps(k, shared_secret.data(), 
                     static_cast<uint8_t*>(ct_data), 
                     static_cast<uint8_t*>(priv_data)) != OQS_SUCCESS) {
    OQS_KEM_free(k);
    napi_throw_error(env, nullptr, "Decapsulation failed");
    return nullptr;
  }
  
  OQS_KEM_free(k);
  
  // Return shared secret buffer
  napi_value result;
  napi_create_buffer_copy(env, shared_secret.size(), shared_secret.data(), nullptr, &result);
  return result;
}

// Forward declaration for hybrid certificate generation
extern std::pair<std::vector<uint8_t>,std::vector<uint8_t>>
  generate_hybrid_certificate(
    const std::string& classicalAlgo,
    const std::string& pqAlgo,
    const std::string& subject,
    const std::string& issuer,
    int validityDays
  );

napi_value GenerateHybridCertificate(napi_env env, napi_callback_info info) {
  size_t argc=5; napi_value args[5];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

  // [0]=classicalAlgo, [1]=pqAlgo, [2]=subject, [3]=issuer, [4]=validityDays
  char bufC[32], bufP[32], bufS[256], bufI[256];
  size_t lC,lP,lS,lI;
  napi_get_value_string_utf8(env,args[0],bufC,sizeof(bufC),&lC);
  napi_get_value_string_utf8(env,args[1],bufP,sizeof(bufP),&lP);
  napi_get_value_string_utf8(env,args[2],bufS,sizeof(bufS),&lS);
  napi_get_value_string_utf8(env,args[3],bufI,sizeof(bufI),&lI);

  int validity; napi_get_value_int32(env,args[4],&validity);

  auto [cert, key] = generate_hybrid_certificate(
    std::string(bufC,lC),
    std::string(bufP,lP),
    std::string(bufS,lS),
    std::string(bufI,lI),
    validity
  );

  napi_value out, certBuf, keyBuf;
  napi_create_object(env, &out);
  napi_create_buffer_copy(env, cert.size(), cert.data(), nullptr, &certBuf);
  napi_set_named_property(env, out, "cert", certBuf);
  napi_create_buffer_copy(env, key.size(), key.data(), nullptr, &keyBuf);
  napi_set_named_property(env, out, "key", keyBuf);
  return out;
}

// --- DID support ---
extern std::tuple<std::string,std::vector<uint8_t>,std::vector<uint8_t>>
  generate_did_keypair(const std::string& method);
extern std::string resolve_did(const std::string& did);
extern std::string register_did(const std::string& docJson);
extern std::string deactivate_did(const std::string& did);

napi_value GenerateDidKeyPair(napi_env env, napi_callback_info info) {
  size_t argc=1; napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  char bufM[32]; size_t lenM;
  napi_get_value_string_utf8(env,args[0],bufM,sizeof(bufM),&lenM);
  auto [did, pub, priv] = generate_did_keypair(std::string(bufM,lenM));

  napi_value out, didVal, pubBuf, privBuf;
  napi_create_object(env,&out);
  napi_create_string_utf8(env,did.c_str(),NAPI_AUTO_LENGTH,&didVal);
  napi_set_named_property(env,out,"did",didVal);
  napi_create_buffer_copy(env, pub.size(), pub.data(), nullptr, &pubBuf);
  napi_set_named_property(env,out,"publicKey",pubBuf);
  napi_create_buffer_copy(env, priv.size(), priv.data(), nullptr, &privBuf);
  napi_set_named_property(env,out,"privateKey",privBuf);
  return out;
}

napi_value ResolveDID(napi_env env, napi_callback_info info) {
  size_t argc=1; napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  char bufD[128]; size_t lenD;
  napi_get_value_string_utf8(env,args[0],bufD,sizeof(bufD),&lenD);
  std::string doc = resolve_did(std::string(bufD,lenD));
  napi_value result;
  napi_create_string_utf8(env, doc.c_str(), NAPI_AUTO_LENGTH, &result);
  return result;
}

napi_value RegisterDID(napi_env env, napi_callback_info info) {
  size_t argc=1; napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  // document JSON is a string or Buffer
  bool isBuf; napi_is_buffer(env,args[0],&isBuf);
  std::string docJson;
  if (isBuf) {
    void* data; size_t len;
    napi_get_buffer_info(env,args[0],&data,&len);
    docJson.assign((char*)data, len);
  } else {
    char tmp[4096]; size_t l;
    napi_get_value_string_utf8(env,args[0],tmp,sizeof(tmp),&l);
    docJson.assign(tmp,l);
  }
  std::string tx = register_did(docJson);
  napi_value out;
  napi_create_string_utf8(env, tx.c_str(), NAPI_AUTO_LENGTH, &out);
  return out;
}

napi_value DeactivateDID(napi_env env, napi_callback_info info) {
  size_t argc=1; napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  char buf[128]; size_t l;
  napi_get_value_string_utf8(env,args[0],buf,sizeof(buf),&l);
  std::string status = deactivate_did(std::string(buf,l));
  napi_value out;
  napi_create_string_utf8(env, status.c_str(), NAPI_AUTO_LENGTH, &out);
  return out;
}

// --- Module init ---
// The Init function has been moved to InitPQCrypto and is called from openssl.cpp



// === Helpers for PQ algorithm names ===
// enum class PQAlgorithmType { KYBER512, KYBER768, KYBER1024 };
static PQAlgorithmType str2pq(const std::string& a){
  if(a=="kyber512") return PQAlgorithmType::KYBER512;
  if(a=="kyber1024")return PQAlgorithmType::KYBER1024;
  return PQAlgorithmType::KYBER768;
}
static const char* pqName(PQAlgorithmType a){
  switch(a){
    case PQAlgorithmType::KYBER512:  return OQS_KEM_alg_kyber_512;
    case PQAlgorithmType::KYBER1024: return OQS_KEM_alg_kyber_1024;
    default:                         return OQS_KEM_alg_kyber_768;
  }
}

// === Module registration function (called from openssl.cpp) ===
napi_value InitPQCrypto(napi_env env, napi_value exports) {

  OQS_init();
  
  // Register cleanup hook for OQS
  napi_add_env_cleanup_hook(env, [](void*){ /* OQS cleanup if needed */ }, nullptr);
  
  napi_property_descriptor descs[] = {
    { "generateKyberKeyPair",        nullptr, GenerateKyberKeyPair,        nullptr, nullptr, nullptr, napi_default, nullptr },
    { "kyberEncapsulate",            nullptr, KyberEncapsulate,            nullptr, nullptr, nullptr, napi_default, nullptr },
    { "kyberDecapsulate",            nullptr, KyberDecapsulate,            nullptr, nullptr, nullptr, napi_default, nullptr },
    { "generateHybridCertificate",   nullptr, GenerateHybridCertificate,   nullptr, nullptr, nullptr, napi_default, nullptr },
    { "generateDidKeyPair",          nullptr, GenerateDidKeyPair,          nullptr, nullptr, nullptr, napi_default, nullptr },
    { "resolveDID",                  nullptr, ResolveDID,                  nullptr, nullptr, nullptr, napi_default, nullptr },
    { "registerDID",                 nullptr, RegisterDID,                 nullptr, nullptr, nullptr, napi_default, nullptr },
    { "deactivateDID",               nullptr, DeactivateDID,               nullptr, nullptr, nullptr, napi_default, nullptr }
  };
  napi_define_properties(env, exports, sizeof(descs)/sizeof(*descs), descs);
  return exports;
}


