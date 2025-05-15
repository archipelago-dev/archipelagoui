{
  "targets": [
    {
      "target_name": "openssl_pq",
      "sources": [
        "src/bindings/openssl.cpp",
        "src/bindings/pq_crypto.cpp"
      ],

      "cflags_cc": ["-std=c++17"],
      "libraries": ["-lssl", "-lcrypto", "-loqs"]
    }
  ]
}
