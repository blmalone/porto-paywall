import {
    useConnect,
    useConnectors,
} from 'wagmi'

export function Connect() {
    const connect = useConnect()
    const connectors = useConnectors()

    // Find the Porto connector
    const portoConnector = connectors?.find(connector =>
        connector.name.toLowerCase().includes('porto')
    )

    if (!portoConnector) {
        return <div>Porto connector not available</div>
    }

    return (
        <button onClick={() => connect.connect({ connector: portoConnector })}>
            Connect Porto
        </button>
    )
}