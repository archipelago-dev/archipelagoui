cmd_Release/obj.target/openssl_pq/src/bindings/pq_crypto.o := /usr/bin/clang++ -o Release/obj.target/openssl_pq/src/bindings/pq_crypto.o ../src/bindings/pq_crypto.cpp '-DNODE_GYP_MODULE_NAME=openssl_pq' '-DUSING_UV_SHARED=1' '-DUSING_V8_SHARED=1' '-DV8_DEPRECATION_WARNINGS=1' '-D_GLIBCXX_USE_CXX11_ABI=1' '-D_DARWIN_USE_64_BIT_INODE=1' '-D_LARGEFILE_SOURCE' '-D_FILE_OFFSET_BITS=64' '-DBUILDING_NODE_EXTENSION' -I/Users/nick/Library/Caches/node-gyp/23.11.0/include/node -I/Users/nick/Library/Caches/node-gyp/23.11.0/src -I/Users/nick/Library/Caches/node-gyp/23.11.0/deps/openssl/config -I/Users/nick/Library/Caches/node-gyp/23.11.0/deps/openssl/openssl/include -I/Users/nick/Library/Caches/node-gyp/23.11.0/deps/uv/include -I/Users/nick/Library/Caches/node-gyp/23.11.0/deps/zlib -I/Users/nick/Library/Caches/node-gyp/23.11.0/deps/v8/include  -O3 -gdwarf-2 -fno-strict-aliasing -flto -mmacosx-version-min=11.0 -arch x86_64 -Wall -Wendif-labels -W -Wno-unused-parameter -std=gnu++20 -stdlib=libc++ -fno-rtti -fno-exceptions -MMD -MF ./Release/.deps/Release/obj.target/openssl_pq/src/bindings/pq_crypto.o.d.raw  -Xpreprocessor -fopenmp  -I/usr/local/opt/libomp/include -c
Release/obj.target/openssl_pq/src/bindings/pq_crypto.o: \
  ../src/bindings/pq_crypto.cpp ../src/bindings/pq_crypto.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/node_api.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/js_native_api.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/js_native_api_types.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/node_api_types.h \
  /usr/local/include/oqs/oqs.h /usr/local/include/oqs/oqsconfig.h \
  /usr/local/include/oqs/common.h /usr/local/include/oqs/rand.h \
  /usr/local/include/oqs/kem.h /usr/local/include/oqs/kem_bike.h \
  /usr/local/include/oqs/kem_classic_mceliece.h \
  /usr/local/include/oqs/kem_hqc.h /usr/local/include/oqs/kem_kyber.h \
  /usr/local/include/oqs/kem_ml_kem.h \
  /usr/local/include/oqs/kem_ntruprime.h \
  /usr/local/include/oqs/kem_frodokem.h /usr/local/include/oqs/sig.h \
  /usr/local/include/oqs/sig_dilithium.h \
  /usr/local/include/oqs/sig_ml_dsa.h \
  /usr/local/include/oqs/sig_falcon.h \
  /usr/local/include/oqs/sig_sphincs.h /usr/local/include/oqs/sig_mayo.h \
  /usr/local/include/oqs/sig_cross.h /usr/local/include/oqs/sig_stfl.h \
  /usr/local/include/oqs/aes_ops.h /usr/local/include/oqs/sha2_ops.h \
  /usr/local/include/oqs/sha3_ops.h /usr/local/include/oqs/sha3x4_ops.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/pem.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/macros.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/opensslconf.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/configuration.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./configuration_asm.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/configuration.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/opensslv.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./opensslv_asm.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/opensslv.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/e_os2.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/bio.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./bio_asm.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/bio.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/crypto.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./crypto_asm.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/crypto.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/safestack.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./safestack_asm.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/safestack.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/stack.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/types.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/cryptoerr.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/symhacks.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/cryptoerr_legacy.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/core.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/bioerr.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/evp.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/core_dispatch.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/evperr.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/params.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/bn.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/bnerr.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/objects.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/obj_mac.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/asn1.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./asn1_asm.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/asn1.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/asn1err.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/objectserr.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/x509.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./x509_asm.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/x509.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/buffer.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/buffererr.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/ec.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/ecerr.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/rsa.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/rsaerr.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/dsa.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/dh.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/dherr.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/dsaerr.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/sha.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/x509err.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/x509_vfy.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./x509_vfy_asm.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/x509_vfy.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/lhash.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./lhash_asm.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/lhash.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/pkcs7.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./pkcs7_asm.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/pkcs7.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/pkcs7err.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/http.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/conf.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./conf_asm.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/conf.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/conferr.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/conftypes.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/pemerr.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/x509v3.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./x509v3_asm.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/x509v3.h \
  /Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/x509v3err.h
../src/bindings/pq_crypto.cpp:
../src/bindings/pq_crypto.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/node_api.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/js_native_api.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/js_native_api_types.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/node_api_types.h:
/usr/local/include/oqs/oqs.h:
/usr/local/include/oqs/oqsconfig.h:
/usr/local/include/oqs/common.h:
/usr/local/include/oqs/rand.h:
/usr/local/include/oqs/kem.h:
/usr/local/include/oqs/kem_bike.h:
/usr/local/include/oqs/kem_classic_mceliece.h:
/usr/local/include/oqs/kem_hqc.h:
/usr/local/include/oqs/kem_kyber.h:
/usr/local/include/oqs/kem_ml_kem.h:
/usr/local/include/oqs/kem_ntruprime.h:
/usr/local/include/oqs/kem_frodokem.h:
/usr/local/include/oqs/sig.h:
/usr/local/include/oqs/sig_dilithium.h:
/usr/local/include/oqs/sig_ml_dsa.h:
/usr/local/include/oqs/sig_falcon.h:
/usr/local/include/oqs/sig_sphincs.h:
/usr/local/include/oqs/sig_mayo.h:
/usr/local/include/oqs/sig_cross.h:
/usr/local/include/oqs/sig_stfl.h:
/usr/local/include/oqs/aes_ops.h:
/usr/local/include/oqs/sha2_ops.h:
/usr/local/include/oqs/sha3_ops.h:
/usr/local/include/oqs/sha3x4_ops.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/pem.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/macros.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/opensslconf.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/configuration.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./configuration_asm.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/configuration.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/opensslv.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./opensslv_asm.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/opensslv.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/e_os2.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/bio.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./bio_asm.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/bio.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/crypto.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./crypto_asm.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/crypto.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/safestack.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./safestack_asm.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/safestack.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/stack.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/types.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/cryptoerr.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/symhacks.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/cryptoerr_legacy.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/core.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/bioerr.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/evp.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/core_dispatch.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/evperr.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/params.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/bn.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/bnerr.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/objects.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/obj_mac.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/asn1.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./asn1_asm.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/asn1.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/asn1err.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/objectserr.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/x509.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./x509_asm.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/x509.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/buffer.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/buffererr.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/ec.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/ecerr.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/rsa.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/rsaerr.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/dsa.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/dh.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/dherr.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/dsaerr.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/sha.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/x509err.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/x509_vfy.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./x509_vfy_asm.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/x509_vfy.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/lhash.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./lhash_asm.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/lhash.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/pkcs7.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./pkcs7_asm.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/pkcs7.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/pkcs7err.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/http.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/conf.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./conf_asm.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/conf.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/conferr.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/conftypes.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/pemerr.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/x509v3.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/./x509v3_asm.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/././archs/darwin64-x86_64-cc/asm/include/openssl/x509v3.h:
/Users/nick/Library/Caches/node-gyp/23.11.0/include/node/openssl/x509v3err.h:
