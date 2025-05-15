export function Card(props: { children?: any; className?: string }) {
    return (
        <div className={`rounded-xl bg-white/5 border border-white/10 p-4 shadow ${props.className ?? ''}`}>
            {props.children}
        </div>
    );
}