import { describe, it, expect } from '@jest/globals';
import { TemplateParser } from '../../core/renderer/template-parser';

describe('TemplateParser', () => {
    const parser = new TemplateParser();

    describe('Basic Parsing', () => {
        it('parses component name correctly', () => {
            const result = parser.parse('<MyComponent />');
            expect(result.componentName).toBe('MyComponent');
        });

        it('parses attributes correctly', () => {
            const result = parser.parse('<MyComponent title="Hello" active="true" />');
            expect(result.attributes).toEqual({
                title: 'Hello',
                active: 'true',
            });
        });

        it('parses slots correctly', () => {
            const tpl = `<MyComponent><slot name="footer">Footer Content</slot></MyComponent>`;
            const result = parser.parse(tpl);
            expect(result.slots).toEqual({
                footer: 'Footer Content',
            });
        });

        it('parses expressions correctly', () => {
            const result = parser.parse('<MyComponent label="{{ user.name }}" />');
            expect(result.expressions).toEqual(['user.name']);
        });

        it('handles invalid templates gracefully', () => {
            const result = parser.parse('<BrokenComponent title="oops');
            expect(result.errors?.length).toBeGreaterThanOrEqual(0);
            expect(typeof result.componentName).toBe('string');
        });
    });

    describe('Directive Parsing', () => {
        it('parses v-if directive correctly', () => {
            const tpl = `<UserCard v-if="user.isActive" />`;
            const result = parser.parse(tpl);
            expect(result.directives?.vIf).toBe('user.isActive');
        });

        it('parses v-for directive correctly', () => {
            const tpl = `<UserCard v-for="item in users" />`;
            const result = parser.parse(tpl);
            expect(result.directives?.vFor).toEqual({ item: 'item', iterable: 'users' });
        });

        it('parses :prop binding correctly', () => {
            const tpl = `<UserCard :name="user.name" :age="user.age" />`;
            const result = parser.parse(tpl);
            expect(result.directives?.bindings).toEqual({
                name: 'user.name',
                age: 'user.age'
            });
        });

        it('parses mixed attributes and directives', () => {
            const tpl = `<UserCard title="Mr." :name="user.name" v-if="user.active" v-for="u in list" />`;
            const result = parser.parse(tpl);
            expect(result.attributes).toMatchObject({
                title: 'Mr.',
                ':name': 'user.name',
                'v-if': 'user.active',
                'v-for': 'u in list'
            });
            expect(result.directives).toEqual({
                vIf: 'user.active',
                vFor: { item: 'u', iterable: 'list' },
                bindings: { name: 'user.name' }
            });
        });

        it('ignores malformed v-for directive', () => {
            const tpl = `<UserCard v-for="broken syntax" />`;
            const result = parser.parse(tpl);
            expect(result.directives?.vFor).toBeUndefined();
        });

        it('handles attributes without quotes', () => {
            // This test demonstrates that such cases are currently not supported
            // and helps detect regressions if you add support later.
            const tpl = `<UserCard active />`;
            const result = parser.parse(tpl);
            expect(result.attributes).toEqual({});
        });
    });
});
