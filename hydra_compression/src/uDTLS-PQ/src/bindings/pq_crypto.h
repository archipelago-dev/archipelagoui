// src/bindings/pq_crypto.h
#ifndef PQ_CRYPTO_H
#define PQ_CRYPTO_H

#include <node_api.h>
#include <vector>
#include <string>

// PQ algorithm identifiers
enum class PQAlgorithmType {
  KYBER512,
  KYBER768,
  KYBER1024,
  DILITHIUM2,
  DILITHIUM3,
  DILITHIUM5
};

PQAlgorithmType string_to_pq_algorithm(const std::string& algo);

// ** Core liboqs wrappers **
napi_value GenerateKyberKeyPair(napi_env env, napi_callback_info info);
napi_value KyberEncapsulate    (napi_env env, napi_callback_info info);
napi_value KyberDecapsulate    (napi_env env, napi_callback_info info);

// ** Hybrid certificate **
napi_value GenerateHybridCertificate(napi_env env, napi_callback_info info);

// ** Decentralized Identifiers (DIDs) **
napi_value GenerateDidKeyPair(napi_env env, napi_callback_info info);
napi_value ResolveDID        (napi_env env, napi_callback_info info);
napi_value RegisterDID       (napi_env env, napi_callback_info info);
napi_value DeactivateDID     (napi_env env, napi_callback_info info);

// Module initialization function (called from openssl.cpp)
napi_value InitPQCrypto(napi_env env, napi_value exports);

#endif // PQ_CRYPTO_H
