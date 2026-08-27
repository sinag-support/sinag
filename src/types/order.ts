export interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  discount: number
  product: {
    id: string
    title: string
    images: string[]
  }
}

export interface Order {
  id: string
  orderNumber: number
  status: string
  total: number
  payable: number
  shipping: number
  tax: number
  discount: number
  isPaid: boolean
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  address: {
    address: string
    city: string
    province: string
    postalCode: string
    country: string
  } | null
  payments: {
    id: string
    method: string
    status: string
    amount: number
    reference: string | null
    createdAt: string
  }[]
  user?: {
    id: string
    name: string | null
    email: string
  }
}