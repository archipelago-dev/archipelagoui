// src/bindings/openssl.cpp
#include "openssl.h"
#include "pq_crypto.h"  // Include pq_crypto.h to access InitPQCrypto
#include <node_api.h>
#include <openssl/ssl.h>
#include <openssl/err.h>
#include <openssl/crypto.h>
#include <iostream>
#include <string>
#include <vector>
#include <map>

// ----- tiny helper so we can write DECLARE_NAPI_METHOD("foo", Foo) -----
#ifndef DECLARE_NAPI_METHOD
#  define DECLARE_NAPI_METHOD(js_name, c_func) \
     { js_name, nullptr, c_func, nullptr, nullptr, nullptr, napi_default, nullptr }
#endif


// Mapping between our handles and the actual OpenSSL objects
static std::map<int, std::shared_ptr<SSLContextWrapper>> g_contexts;
static std::map<int, std::shared_ptr<SSLSessionWrapper>> g_sessions;
static int next_id = 1;

// Initialize OpenSSL
void init_openssl() {
  SSL_library_init();
  OpenSSL_add_all_algorithms();
  SSL_load_error_strings();
  ERR_load_crypto_strings();
}

// Clean up OpenSSL
void cleanup_openssl() {
  ERR_free_strings();
  EVP_cleanup();
  CRYPTO_cleanup_all_ex_data();
}

// SSL Context wrapper implementation
SSLContextWrapper::SSLContextWrapper() : ctx_(nullptr), ocspStaplingEnabled_(false), certTransparencyEnabled_(false) {}

SSLContextWrapper::SSLContextWrapper(SSL_CTX* ctx) : ctx_(ctx), ocspStaplingEnabled_(false), certTransparencyEnabled_(false) {}

SSLContextWrapper::~SSLContextWrapper() {
  if (ctx_) {
    SSL_CTX_free(ctx_);
    ctx_ = nullptr;
  }
}

// Implementation of enableOCSPStapling
void SSLContextWrapper::enableOCSPStapling(bool enable) {
  ocspStaplingEnabled_ = enable;
  
  // In newer OpenSSL versions, we would use SSL_CTX_set_tlsext_status_cb
  // But for compatibility, we'll use a different approach
  if (enable) {
    // Set up OCSP stapling (implementation depends on OpenSSL version)
    // For newer versions of OpenSSL, you might use:
    // SSL_CTX_set_tlsext_status_cb(ctx_, ocsp_status_callback);
    // SSL_CTX_set_tlsext_status_arg(ctx_, ctx_);
    
    // For compatibility, we'll use the SSL_CONF approach
    SSL_CONF_CTX *cctx = SSL_CONF_CTX_new();
    SSL_CONF_CTX_set_flags(cctx, SSL_CONF_FLAG_CLIENT);
    SSL_CONF_CTX_set_ssl_ctx(cctx, ctx_);
    SSL_CONF_cmd(cctx, "Options", "StatusRequest");
    SSL_CONF_CTX_free(cctx);
  }
}

// Implementation of enableCertTransparency
void SSLContextWrapper::enableCertTransparency(bool enable) {
  certTransparencyEnabled_ = enable;
  // Certificate Transparency implementation would go here
  // This is typically done via custom verification callbacks
}

// Implementation of addCRLDistributionPoint
void SSLContextWrapper::addCRLDistributionPoint(const std::string& uri) {
  crlPoints_.push_back(uri);
  // In a full implementation, we would set up CRL checking with these URIs
}

// Implementation of addCertificatePolicy
void SSLContextWrapper::addCertificatePolicy(const std::string& policyOID) {
  policies_.push_back(policyOID);
  // In a full implementation, we would configure policy checking
}

// SSL Session wrapper implementation
SSLSessionWrapper::SSLSessionWrapper(SSL_CTX* ctx) : ssl_(nullptr) {
  if (ctx) {
    ssl_ = SSL_new(ctx);
  }
}

SSLSessionWrapper::~SSLSessionWrapper() {
  if (ssl_) {
    SSL_free(ssl_);
    ssl_ = nullptr;
  }
}

// Create a DTLS context
SSL_CTX* create_dtls_context(bool is_server) {
  // For OpenSSL 3.0+
  const SSL_METHOD* method = is_server ? DTLS_server_method() : DTLS_client_method();
  SSL_CTX* ctx = SSL_CTX_new(method);

  if (!ctx) {
    std::cerr << "Error creating SSL context" << std::endl;
    ERR_print_errors_fp(stderr);
    return nullptr;
  }

  // Set default options
  SSL_CTX_set_options(ctx, SSL_OP_NO_SSLv2 | SSL_OP_NO_SSLv3 | SSL_OP_NO_TLSv1);

  return ctx;
}

// Set certificates for the context
bool set_certificates(SSL_CTX* ctx, const char* cert_path, const char* key_path) {
  if (!ctx) return false;

  if (cert_path && SSL_CTX_use_certificate_file(ctx, cert_path, SSL_FILETYPE_PEM) <= 0) {
    ERR_print_errors_fp(stderr);
    return false;
  }

  if (key_path && SSL_CTX_use_PrivateKey_file(ctx, key_path, SSL_FILETYPE_PEM) <= 0) {
    ERR_print_errors_fp(stderr);
    return false;
  }

  if (cert_path && key_path && !SSL_CTX_check_private_key(ctx)) {
    std::cerr << "Private key does not match the certificate" << std::endl;
    return false;
  }

  return true;
}

// Set cipher list for the context
void set_cipher_list(SSL_CTX* ctx, const std::vector<std::string>& ciphers) {
  if (!ctx || ciphers.empty()) return;

  std::string cipher_list;
  for (const auto& cipher : ciphers) {
    if (!cipher_list.empty()) cipher_list += ":";
    cipher_list += cipher;
  }

  SSL_CTX_set_cipher_list(ctx, cipher_list.c_str());
}

// NAPI implementation for CreateContext
napi_value CreateContext(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

  bool is_server = false;
  std::string cert_path, key_path;

  // Parse options object
  if (argc > 0) {
    napi_value options = args[0];
    napi_value prop_value;

    // Check if it's a server
    if (napi_get_named_property(env, options, "isServer", &prop_value) == napi_ok) {
      napi_get_value_bool(env, prop_value, &is_server);
    }

    // Get cert path
    if (napi_get_named_property(env, options, "cert", &prop_value) == napi_ok) {
      char buffer[1024];
      size_t result;
      napi_get_value_string_utf8(env, prop_value, buffer, sizeof(buffer), &result);
      cert_path = std::string(buffer, result);
    }

    // Get key path
    if (napi_get_named_property(env, options, "key", &prop_value) == napi_ok) {
      char buffer[1024];
      size_t result;
      napi_get_value_string_utf8(env, prop_value, buffer, sizeof(buffer), &result);
      key_path = std::string(buffer, result);
    }
  }

  // Create OpenSSL context
  SSL_CTX* ctx = create_dtls_context(is_server);
  if (!ctx) {
    napi_throw_error(env, nullptr, "Failed to create DTLS context");
    napi_value result;
    napi_get_null(env, &result);
    return result;
  }

  // Set certificates if provided
  if (!cert_path.empty() && !key_path.empty()) {
    if (!set_certificates(ctx, cert_path.c_str(), key_path.c_str())) {
      SSL_CTX_free(ctx);
      napi_throw_error(env, nullptr, "Failed to set certificates");
      napi_value result;
      napi_get_null(env, &result);
      return result;
    }
  }

  // Store context in our map
  int id = next_id++;
  g_contexts[id] = std::make_shared<SSLContextWrapper>(ctx);

  // Create and return the context handle
  napi_value result;
  napi_create_object(env, &result);

  napi_value id_value;
  napi_create_int32(env, id, &id_value);
  napi_set_named_property(env, result, "id", id_value);

  return result;
}

// NAPI implementation for FreeContext
napi_value FreeContext(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

  if (argc < 1) {
    napi_throw_error(env, nullptr, "Wrong number of arguments");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get context ID
  napi_value context_obj = args[0];
  napi_value id_value;
  napi_get_named_property(env, context_obj, "id", &id_value);

  int id;
  napi_get_value_int32(env, id_value, &id);

  // Check if context exists
  if (g_contexts.find(id) == g_contexts.end()) {
    napi_throw_error(env, nullptr, "Invalid context");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Remove context from map
  g_contexts.erase(id);

  napi_value result;
  napi_get_boolean(env, true, &result);
  return result;
}

// NAPI implementation for SetCipherSuites
napi_value SetCipherSuites(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value args[2];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

  if (argc < 2) {
    napi_throw_error(env, nullptr, "Wrong number of arguments");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get context ID
  napi_value context_obj = args[0];
  napi_value id_value;
  napi_get_named_property(env, context_obj, "id", &id_value);

  int id;
  napi_get_value_int32(env, id_value, &id);

  // Check if context exists
  if (g_contexts.find(id) == g_contexts.end()) {
    napi_throw_error(env, nullptr, "Invalid context");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get cipher suites array
  napi_value cipher_suites_array = args[1];
  bool is_array;
  napi_is_array(env, cipher_suites_array, &is_array);

  if (!is_array) {
    napi_throw_error(env, nullptr, "Cipher suites must be an array");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get array length
  uint32_t array_length;
  napi_get_array_length(env, cipher_suites_array, &array_length);

  // Extract cipher suites
  std::vector<std::string> ciphers;
  for (uint32_t i = 0; i < array_length; i++) {
    napi_value item;
    napi_get_element(env, cipher_suites_array, i, &item);

    char buffer[256];
    size_t result;
    napi_get_value_string_utf8(env, item, buffer, sizeof(buffer), &result);
    ciphers.push_back(std::string(buffer, result));
  }

  // Set cipher list
  SSL_CTX* ctx = g_contexts[id]->get();
  set_cipher_list(ctx, ciphers);

  napi_value result;
  napi_get_boolean(env, true, &result);
  return result;
}

// NAPI implementation for SSLContextSetCertTransparency
napi_value SSLContextSetCertTransparency(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value args[2];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

  if (argc < 2) {
    napi_throw_error(env, nullptr, "Wrong number of arguments");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get context ID
  napi_value context_obj = args[0];
  napi_value id_value;
  napi_get_named_property(env, context_obj, "id", &id_value);

  int id;
  napi_get_value_int32(env, id_value, &id);

  // Check if context exists
  if (g_contexts.find(id) == g_contexts.end()) {
    napi_throw_error(env, nullptr, "Invalid context");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get enable flag
  bool enable;
  napi_get_value_bool(env, args[1], &enable);

  // Enable cert transparency
  g_contexts[id]->enableCertTransparency(enable);

  napi_value result;
  napi_get_boolean(env, true, &result);
  return result;
}

// NAPI implementation for SSLContextAddCRLDistributionPoint
napi_value SSLContextAddCRLDistributionPoint(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value args[2];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

  if (argc < 2) {
    napi_throw_error(env, nullptr, "Wrong number of arguments");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get context ID
  napi_value context_obj = args[0];
  napi_value id_value;
  napi_get_named_property(env, context_obj, "id", &id_value);

  int id;
  napi_get_value_int32(env, id_value, &id);

  // Check if context exists
  if (g_contexts.find(id) == g_contexts.end()) {
    napi_throw_error(env, nullptr, "Invalid context");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get URI
  char uri[1024];
  size_t uri_len;
  napi_get_value_string_utf8(env, args[1], uri, sizeof(uri), &uri_len);
  std::string uri_str(uri, uri_len);

  // Add CRL distribution point
  g_contexts[id]->addCRLDistributionPoint(uri_str);

  napi_value result;
  napi_get_boolean(env, true, &result);
  return result;
}

// NAPI implementation for SSLContextEnableOCSPStapling
napi_value SSLContextEnableOCSPStapling(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value args[2];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

  if (argc < 2) {
    napi_throw_error(env, nullptr, "Wrong number of arguments");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get context ID
  napi_value context_obj = args[0];
  napi_value id_value;
  napi_get_named_property(env, context_obj, "id", &id_value);

  int id;
  napi_get_value_int32(env, id_value, &id);

  // Check if context exists
  if (g_contexts.find(id) == g_contexts.end()) {
    napi_throw_error(env, nullptr, "Invalid context");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get enable flag
  bool enable;
  napi_get_value_bool(env, args[1], &enable);

  // Enable OCSP stapling
  g_contexts[id]->enableOCSPStapling(enable);

  napi_value result;
  napi_get_boolean(env, true, &result);
  return result;
}

// NAPI implementation for SSLContextAddCertificatePolicy
napi_value SSLContextAddCertificatePolicy(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value args[2];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

  if (argc < 2) {
    napi_throw_error(env, nullptr, "Wrong number of arguments");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get context ID
  napi_value context_obj = args[0];
  napi_value id_value;
  napi_get_named_property(env, context_obj, "id", &id_value);

  int id;
  napi_get_value_int32(env, id_value, &id);

  // Check if context exists
  if (g_contexts.find(id) == g_contexts.end()) {
    napi_throw_error(env, nullptr, "Invalid context");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get policy OID
  char policy[256];
  size_t policy_len;
  napi_get_value_string_utf8(env, args[1], policy, sizeof(policy), &policy_len);
  std::string policy_str(policy, policy_len);

  // Add certificate policy
  g_contexts[id]->addCertificatePolicy(policy_str);

  napi_value result;
  napi_get_boolean(env, true, &result);
  return result;
}

// NAPI implementation for SetPQCipherSuites
napi_value SetPQCipherSuites(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value args[2];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

  if (argc < 2) {
    napi_throw_error(env, nullptr, "Wrong number of arguments");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get context ID
  napi_value context_obj = args[0];
  napi_value id_value;
  napi_get_named_property(env, context_obj, "id", &id_value);

  int id;
  napi_get_value_int32(env, id_value, &id);

  // Check if context exists
  if (g_contexts.find(id) == g_contexts.end()) {
    napi_throw_error(env, nullptr, "Invalid context");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get PQ algorithm type
  napi_value pq_algo_value = args[1];
  char pq_algo_str[32];
  size_t pq_algo_len;
  napi_get_value_string_utf8(env, pq_algo_value, pq_algo_str, sizeof(pq_algo_str), &pq_algo_len);
  std::string pq_algo(pq_algo_str, pq_algo_len);

  // Get the SSL context
  SSL_CTX* ctx = g_contexts[id]->get();

  // Set appropriate post-quantum TLS groups and signature algorithms based on the requested algorithm
  if (pq_algo == "kyber512") {
    // For Kyber512, use appropriate groups
    if (SSL_CTX_set1_groups_list(ctx, "kyber512") != 1) {
      napi_throw_error(env, nullptr, "Failed to set Kyber512 groups");
      napi_value result;
      napi_get_boolean(env, false, &result);
      return result;
    }
  } else if (pq_algo == "kyber768") {
    // For Kyber768, use appropriate groups
    if (SSL_CTX_set1_groups_list(ctx, "kyber768") != 1) {
      napi_throw_error(env, nullptr, "Failed to set Kyber768 groups");
      napi_value result;
      napi_get_boolean(env, false, &result);
      return result;
    }
  } else if (pq_algo == "hybrid") {
    // For hybrid mode, use both classical and PQ groups with preference for PQ
    if (SSL_CTX_set1_groups_list(ctx, "kyber768:x25519:kyber512:secp384r1") != 1) {
      napi_throw_error(env, nullptr, "Failed to set hybrid groups");
      napi_value result;
      napi_get_boolean(env, false, &result);
      return result;
    }
  }

  // Set signature algorithms if Dilithium is requested
  if (pq_algo == "dilithium2" || pq_algo == "dilithium3" || pq_algo == "hybrid") {
    // Set signature algorithms with preference for Dilithium
    if (SSL_CTX_set1_sigalgs_list(ctx, "dilithium3:dilithium2:RSA+SHA256:ECDSA+SHA256") != 1) {
      napi_throw_error(env, nullptr, "Failed to set PQ signature algorithms");
      napi_value result;
      napi_get_boolean(env, false, &result);
      return result;
    }
  }

  // Set DTLS cipher suites that work well with PQ algorithms
  // Use modern AEAD ciphers with PQ key exchange
  std::vector<std::string> pq_compatible_ciphers = {
    "TLS_AES_256_GCM_SHA384",
    "TLS_AES_128_GCM_SHA256",
    "TLS_CHACHA20_POLY1305_SHA256",
    "ECDHE-RSA-AES256-GCM-SHA384",
    "ECDHE-RSA-AES128-GCM-SHA256",
    "ECDHE-RSA-CHACHA20-POLY1305"
  };

  // Set the cipher list
  set_cipher_list(ctx, pq_compatible_ciphers);

  napi_value result;
  napi_get_boolean(env, true, &result);
  return result;
}

// NAPI implementation for SetVerifyMode
napi_value SetVerifyMode(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value args[2];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

  if (argc < 2) {
    napi_throw_error(env, nullptr, "Wrong number of arguments");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get context ID
  napi_value context_obj = args[0];
  napi_value id_value;
  napi_get_named_property(env, context_obj, "id", &id_value);

  int id;
  napi_get_value_int32(env, id_value, &id);

  // Check if context exists
  if (g_contexts.find(id) == g_contexts.end()) {
    napi_throw_error(env, nullptr, "Invalid context");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get verify mode
  int mode;
  napi_get_value_int32(env, args[1], &mode);

  // Set verify mode
  SSL_CTX* ctx = g_contexts[id]->get();
  SSL_CTX_set_verify(ctx, mode, nullptr);

  napi_value result;
  napi_get_boolean(env, true, &result);
  return result;
}

// NAPI implementation for SetMinMaxVersion
napi_value SetMinMaxVersion(napi_env env, napi_callback_info info) {
  size_t argc = 3;
  napi_value args[3];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

  if (argc < 3) {
    napi_throw_error(env, nullptr, "Wrong number of arguments");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get context ID
  napi_value context_obj = args[0];
  napi_value id_value;
  napi_get_named_property(env, context_obj, "id", &id_value);

  int id;
  napi_get_value_int32(env, id_value, &id);

  // Check if context exists
  if (g_contexts.find(id) == g_contexts.end()) {
    napi_throw_error(env, nullptr, "Invalid context");
    napi_value result;
    napi_get_boolean(env, false, &result);
    return result;
  }

  // Get min and max versions
  int min_version, max_version;
  napi_get_value_int32(env, args[1], &min_version);
  napi_get_value_int32(env, args[2], &max_version);

  // Set min and max versions
  SSL_CTX* ctx = g_contexts[id]->get();
  SSL_CTX_set_min_proto_version(ctx, min_version);
  SSL_CTX_set_max_proto_version(ctx, max_version);

  napi_value result;
  napi_get_boolean(env, true, &result);
  return result;
}

// NAPI implementation for GetError
napi_value GetError(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);

  if (argc < 1) {
    napi_throw_error(env, nullptr, "Wrong number of arguments");
    napi_value result;
    napi_create_string_utf8(env, "Invalid arguments", NAPI_AUTO_LENGTH, &result);
    return result;
  }

  // Get session ID
  napi_value session_obj = args[0];
  napi_value id_value;
  napi_get_named_property(env, session_obj, "id", &id_value);

  int id;
  napi_get_value_int32(env, id_value, &id);

  // Check if session exists
  if (g_sessions.find(id) == g_sessions.end()) {
    napi_throw_error(env, nullptr, "Invalid session");
    napi_value result;
    napi_create_string_utf8(env, "Invalid session", NAPI_AUTO_LENGTH, &result);
    return result;
  }

  // Get OpenSSL error
  char error_buf[256];
  ERR_error_string_n(ERR_get_error(), error_buf, sizeof(error_buf));

  napi_value result;
  napi_create_string_utf8(env, error_buf, NAPI_AUTO_LENGTH, &result);
  return result;
}

// NAPI implementation for GetVersion
napi_value GetVersion(napi_env env, napi_callback_info info) {
  const char* version = OpenSSL_version(OPENSSL_VERSION);

  napi_value result;
  napi_create_string_utf8(env, version, NAPI_AUTO_LENGTH, &result);
  return result;
}

static napi_value Init(napi_env env, napi_value exports)
{
std::cout << "[native] Init called!" << std::endl;

  init_openssl();
  napi_add_env_cleanup_hook(env, [](void*) { cleanup_openssl(); }, nullptr);

  const napi_property_descriptor spec[] = {
    DECLARE_NAPI_METHOD("createContext",            CreateContext),
    DECLARE_NAPI_METHOD("freeContext",              FreeContext),
    DECLARE_NAPI_METHOD("setCipherSuites",          SetCipherSuites),
    DECLARE_NAPI_METHOD("setPQCipherSuites",        SetPQCipherSuites),
    DECLARE_NAPI_METHOD("setVerifyMode",            SetVerifyMode),
    DECLARE_NAPI_METHOD("setMinMaxVersion",         SetMinMaxVersion),
    DECLARE_NAPI_METHOD("getError",                 GetError),
    DECLARE_NAPI_METHOD("getVersion",               GetVersion),
    DECLARE_NAPI_METHOD("enableCertTransparency",   SSLContextSetCertTransparency),
    DECLARE_NAPI_METHOD("addCRLDistributionPoint",  SSLContextAddCRLDistributionPoint),
    DECLARE_NAPI_METHOD("enableOCSPStapling",       SSLContextEnableOCSPStapling),
    DECLARE_NAPI_METHOD("addCertificatePolicy",     SSLContextAddCertificatePolicy)
  };

  napi_define_properties(env, exports, sizeof(spec) / sizeof(spec[0]), spec);
  InitPQCrypto(env, exports);

  napi_value test_value;
  napi_create_string_utf8(env, "hello", NAPI_AUTO_LENGTH, &test_value);
  napi_set_named_property(env, exports, "test", test_value);


  return exports;
}

// 👇 This is all you need to register it
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)