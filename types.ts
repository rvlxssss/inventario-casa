
export interface Category {
    id: string;
    name: string;
    icon: string; // Material symbol name
}

export interface Product {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    expiryDate: string; // ISO date string YYYY-MM-DD
    categoryId: string; // Link to Category.id
    status: 'ok' | 'warning' | 'expired';
    notes?: string;
    cost?: number; // Total cost of this entry
    addedDate?: string; // ISO date string when added
}

export interface User {
    id: string;
    name: string; // Username
    avatarUrl: string;
    role: 'owner' | 'editor' | 'viewer';
    isCurrentUser?: boolean;
}

export interface NotificationSetting {
    id: string;
    label: string;
    enabled: boolean;
}

export interface Transaction {
    id: string;
    date: string; // ISO string
    type: 'expense' | 'usage';
    productId: string;
    productName: string;
    quantity: number;
    amount: number; // Cost for expense, 0 or value for usage
}