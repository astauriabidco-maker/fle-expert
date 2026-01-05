import { useAuth } from '../contexts/AuthContext';

interface RechargePackProps {
    packId: string;
    label: string;
    price: string;
    credits: number;
}

export function RechargePack({ packId, label, price, credits }: RechargePackProps) {
    const { user } = useAuth();

    const handleRecharge = async () => {
        if (!user || !user.organizationId) return;

        try {
            const response = await fetch('/api/payments/create-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    packId,
                    orgId: user.organizationId
                })
            });

            if (!response.ok) {
                console.error('Payment session creation failed');
                return;
            }

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Error initiating recharge:', error);
        }
    };

    return (
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 rounded-xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{label}</h3>
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-medium">
                    {credits} crédits
                </span>
            </div>
            <div className="flex items-end gap-1">
                <p className="text-3xl font-black text-slate-900 dark:text-white">{price}</p>
                <span className="text-slate-500 mb-1">€</span>
            </div>
            <button
                onClick={handleRecharge}
                className="w-full bg-blue-600 dark:bg-blue-500 text-white py-2.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-semibold transition-colors flex justify-center items-center gap-2"
            >
                <span>Acheter ce pack</span>
            </button>
        </div>
    );
}
