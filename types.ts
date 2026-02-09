export interface Order {
  id: string;
  buyerName: string;
  itemName: string;
  price: number;
  quantity: number;
  isPaid: boolean;
  createdAt: number;
}

export interface GroupBuy {
  id: string;
  title: string;
  createdAt: number;
  orders: Order[];
}

export type ViewState = 'LIST' | 'DETAIL';