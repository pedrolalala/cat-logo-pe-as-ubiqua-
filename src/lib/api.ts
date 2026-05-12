export interface Part {
  id: string
  referencia: string
  descricao: string
  valor_revenda: number
  url_produto: string
}

const MOCK_PARTS: Part[] = [
  {
    id: '1',
    referencia: 'UBQ-1001',
    descricao: 'Filtro de Óleo Industrial Alta Pressão',
    valor_revenda: 1250.0,
    url_produto: 'https://example.com',
  },
  {
    id: '2',
    referencia: 'UBQ-2042',
    descricao: 'Válvula Solenoide 24V Aço Inox',
    valor_revenda: 450.5,
    url_produto: 'https://example.com',
  },
  {
    id: '3',
    referencia: 'UBQ-3099',
    descricao: 'Bomba Hidráulica de Engrenagem',
    valor_revenda: 3420.0,
    url_produto: 'https://example.com',
  },
  {
    id: '4',
    referencia: 'UBQ-1055',
    descricao: 'Mangueira de Sucção 2 Polegadas',
    valor_revenda: 120.0,
    url_produto: 'https://example.com',
  },
  {
    id: '5',
    referencia: 'UBQ-4001',
    descricao: 'Painel de Controle Eletrônico V2',
    valor_revenda: 5600.0,
    url_produto: 'https://example.com',
  },
  {
    id: '6',
    referencia: 'UBQ-2088',
    descricao: 'Cilindro Pneumático Dupla Ação',
    valor_revenda: 890.75,
    url_produto: 'https://example.com',
  },
  {
    id: '7',
    referencia: 'UBQ-5510',
    descricao: 'Rolamento de Esferas Vedação Dupla',
    valor_revenda: 85.9,
    url_produto: 'https://example.com',
  },
  {
    id: '8',
    referencia: 'UBQ-8991',
    descricao: 'Correia de Transmissão Sincronizada',
    valor_revenda: 230.15,
    url_produto: 'https://example.com',
  },
]

export async function fetchParts(): Promise<Part[]> {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    // Fallback to mock data if env vars are not set to ensure app runs end-to-end
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_PARTS), 800))
  }

  const response = await fetch(`${url}/rest/v1/ubiqua_revenda?select=*`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  })

  if (!response.ok) {
    throw new Error('Falha ao buscar dados do catálogo')
  }

  return response.json()
}
