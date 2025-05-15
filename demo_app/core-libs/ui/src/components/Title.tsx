export function Title(props: { children?: any; className?: string }) {
    return <h2 className={`text-xl font-bold mb-2 ${props.className ?? ''}`}>{props.children}</h2>;
}