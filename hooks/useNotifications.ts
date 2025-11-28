import { useEffect, useRef } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useInventory } from '../context/InventoryContext';

export const useNotifications = () => {
    const { products } = useInventory();
    const prevProductsRef = useRef<Map<string, number>>(new Map());
    const hasCheckedExpiry = useRef(false);

    // Request permissions on mount
    useEffect(() => {
        const req = async () => {
            try {
                const perm = await LocalNotifications.checkPermissions();
                if (perm.display !== 'granted') {
                    await LocalNotifications.requestPermissions();
                }
            } catch (e) {
                console.warn("LocalNotifications not available (web mode?)", e);
                if ("Notification" in window && Notification.permission !== "granted") {
                    Notification.requestPermission();
                }
            }
        };
        req();
    }, []);

    // Helper to schedule
    const scheduleNotification = async (title: string, body: string, idOffset: number) => {
        // Generate a numeric ID from the string (simple hash)
        const id = Math.abs(title.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) + idOffset);

        try {
            await LocalNotifications.schedule({
                notifications: [{
                    title,
                    body,
                    id,
                    schedule: { at: new Date(Date.now() + 500) },
                    sound: 'beep.wav',
                    smallIcon: 'ic_stat_notifications', // Android resource if available
                }]
            });
        } catch (e) {
            // Fallback for Web
            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(title, { body });
            }
        }
    };

    // 1. Monitor Stock Changes (Real-time)
    useEffect(() => {
        products.forEach(product => {
            const prevQty = prevProductsRef.current.get(product.id);
            const currentQty = product.quantity;

            // Update ref for next render
            prevProductsRef.current.set(product.id, currentQty);

            // Skip if this is the first load (prevQty is undefined)
            // We don't want to blast notifications just by opening the app
            if (prevQty === undefined) return;

            // Detect changes
            if (currentQty !== prevQty) {
                // Stock Low Logic (<= 2)
                // Trigger only when crossing the threshold downwards
                if (currentQty <= 2 && currentQty > 0 && prevQty > 2) {
                    scheduleNotification(
                        'Stock Bajo ⚠️',
                        `Quedan pocas unidades de "${product.name}" (${currentQty}).`,
                        parseInt(product.id.slice(-5))
                    );
                }

                // Out of Stock Logic (0)
                if (currentQty === 0 && prevQty > 0) {
                    scheduleNotification(
                        'Producto Agotado ❌',
                        `"${product.name}" se ha terminado.`,
                        parseInt(product.id.slice(-5)) + 1
                    );
                }
            }
        });
    }, [products]);

    // 2. Check Expiry (Once per session)
    useEffect(() => {
        if (hasCheckedExpiry.current || products.length === 0) return;

        const checkExpiry = async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let delay = 0;

            for (const product of products) {
                if (!product.expiryDate) continue;

                const [year, month, day] = product.expiryDate.split('-').map(Number);
                const expiry = new Date(year, month - 1, day);
                const diffTime = expiry.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // Expired
                if (diffDays < 0) {
                    setTimeout(() => {
                        scheduleNotification(
                            'Producto Vencido 🗑️',
                            `"${product.name}" venció hace ${Math.abs(diffDays)} días.`,
                            parseInt(product.id.slice(-5)) + 2
                        );
                    }, delay * 500); // Stagger notifications
                    delay++;
                }
                // About to expire (Warning threshold: 3 days for urgent alert, 7 days is visual)
                // Let's notify for <= 3 days to avoid spamming for everything in the 7 day window
                else if (diffDays <= 3) {
                    setTimeout(() => {
                        scheduleNotification(
                            'Por Vencer ⏳',
                            `"${product.name}" vence en ${diffDays === 0 ? 'hoy' : diffDays + ' días'}.`,
                            parseInt(product.id.slice(-5)) + 3
                        );
                    }, delay * 500);
                    delay++;
                }
            }
            hasCheckedExpiry.current = true;
        };

        checkExpiry();
    }, [products]);
};
