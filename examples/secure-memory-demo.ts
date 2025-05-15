import { SecureMemoryTransport } from '../core/transports/secure-memory-transport';


async function runDemo() {
    const client = new SecureMemoryTransport({ isServer: false });
    const server = new SecureMemoryTransport({ isServer: true });

    await client.init();
    await server.init();

    // Bind listeners
    client.on('message', (data: AllowSharedBufferSource | undefined) => {
        console.log('[Client] Received:', new TextDecoder().decode(data));
    });

    server.on('message', (data: AllowSharedBufferSource | undefined) => {
        console.log('[Server] Received:', new TextDecoder().decode(data));
    });

    client.on('error', (err: any) => {
        console.error('[Client Error]', err);
    });

    server.on('error', (err: any) => {
        console.error('[Server Error]', err);
    });

    // Pair both transports and wait for handshake
    try {
        client.pairWith(server);

        // Wait for handshake to complete
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Send messages
        await client.send(new TextEncoder().encode('Hello from Client 👋'));
        await server.send(new TextEncoder().encode('Hello from Server 🚀'));

    } catch (err: any) {
        console.error('[Handshake Error]', err.message);
    }

    // Close after brief delay
    setTimeout(() => {
        client.close();
        server.close();
        console.log('[Demo] Session closed.');
    }, 2000);
}

runDemo().catch(console.error);
