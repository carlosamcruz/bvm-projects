import axios from 'axios'

//O sCrypt é muito dependente das APIs da WhatsOnchain que não vai permitir de forma direta fazer testes mais avançados 
//com o nó de testes local

export const rpcCall = async (method: string, params: any[] = []) => {
    const response = await axios.post(
        'http://127.0.0.1:18332/',
        {
            jsonrpc: '1.0',
            id: 'node-client',
            method,
            params,
        },
        {
            auth: {
                username: 'user',
                password: 'pass',
            },
        }
    )

    return response.data.result
}

rpcCall('getblockchaininfo').then(console.log)
