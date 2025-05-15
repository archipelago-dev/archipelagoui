
<Template>
    <Card>
        <Title>🛡️ AuthBridge Configuration</Title>
        <p class="text-sm mb-2">Choose your authentication provider and optional features.</p>

        <label class="block mb-2">
            <input type="checkbox" name="enableZKP" class="mr-2" /> Enable Zero-Knowledge Proofs
        </label>

        <label class="block mb-2">
            Provider:
            <select name="provider" class="ml-2 p-1 rounded bg-white/10">
                <option>Firebase</option>
                <option>Auth0</option>
                <option>Supabase</option>
                <option>Custom</option>
            </select>
        </label>
    </Card>
</Template>

<script>
    import { Card } from "@archipelagoui/ui"
    import { Title } from "@archipelagoui/ui"
</script>
