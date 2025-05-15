// src/bindings/openssl.h
#ifndef DTLS_OPENSSL_H
#define DTLS_OPENSSL_H

#include <node_api.h>
#include <openssl/ssl.h>
#include <openssl/err.h>
#include <openssl/crypto.h>
#include <openssl/x509v3.h>
#include <openssl/ocsp.h>
#include <string>
#include <vector>
#include <memory>

// RAII wrapper around SSL_CTX
class SSLContextWrapper {
public:
  SSLContextWrapper();
  SSLContextWrapper(SSL_CTX* ctx);
  ~SSLContextWrapper();

  SSL_CTX* get() const { return ctx_; }

  // New features:
  void enableCertTransparency(bool enable);
  void addCRLDistributionPoint(const std::string& uri);
  void enableOCSPStapling(bool enable);
  void addCertificatePolicy(const std::string& policyOID);

private:
  SSL_CTX* ctx_;
  std::vector<std::string> crlPoints_;
  std::vector<std::string> policies_;
  bool ocspStaplingEnabled_;
  bool certTransparencyEnabled_;
};

// RAII wrapper around SSL*
class SSLSessionWrapper {
public:
  SSLSessionWrapper(SSL_CTX* ctx);
  ~SSLSessionWrapper();
  SSL* get() const { return ssl_; }
private:
  SSL* ssl_;
};

// OpenSSL init/cleanup
void init_openssl();
void cleanup_openssl();

// Helpers
SSL_CTX* create_dtls_context(bool is_server);
bool set_certificates(SSL_CTX* ctx, const char* cert_path, const char* key_path);
void set_cipher_list(SSL_CTX* ctx, const std::vector<std::string>& ciphers);

// N-API exports for DTLS/OpenSSL
napi_value CreateContext           (napi_env, napi_callback_info);
napi_value FreeContext             (napi_env, napi_callback_info);
napi_value CreateSession           (napi_env, napi_callback_info);
napi_value FreeSession             (napi_env, napi_callback_info);
napi_value DtlsConnect             (napi_env, napi_callback_info);
napi_value DtlsAccept              (napi_env, napi_callback_info);
napi_value DtlsReceive             (napi_env, napi_callback_info);
napi_value DtlsSend                (napi_env, napi_callback_info);
napi_value DtlsShutdown            (napi_env, napi_callback_info);
napi_value SetCipherSuites         (napi_env, napi_callback_info);
napi_value SetPQCipherSuites       (napi_env, napi_callback_info);
napi_value SetVerifyMode           (napi_env, napi_callback_info);
napi_value SetMinMaxVersion        (napi_env, napi_callback_info);
napi_value GetError                (napi_env, napi_callback_info);
napi_value GetVersion              (napi_env, napi_callback_info);

// ** New N-API hooks **
napi_value SSLContextSetCertTransparency       (napi_env, napi_callback_info);
napi_value SSLContextAddCRLDistributionPoint   (napi_env, napi_callback_info);
napi_value SSLContextEnableOCSPStapling        (napi_env, napi_callback_info);
napi_value SSLContextAddCertificatePolicy      (napi_env, napi_callback_info);

#endif // DTLS_OPENSSL_H
